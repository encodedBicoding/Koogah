
import log from 'fancy-log';
import Sequelize from 'sequelize';
import distanceApi from 'google-distance-matrix';
import uuid from 'uuid/v4';
import { config } from 'dotenv';
import moment from 'moment';
import generate_ref from '../../v1/helpers/ref.id';
import checkTypeV2 from '../helpers/check.type.v2';
import calc_delivery_price_v2 from '../helpers/calc.price.v2';
import { 
  sendNewPackageNotification,
} from '../../v1/helpers/slack';
import Notifier from '../../v1/helpers/notifier';

import eventEmitter from '../../../EventEmitter';

import {
  Packages,
  Couriers,
  Notifications,
  Customers,
  PushDevices,
} from '../../../database/models';
import PushNotify from '../../../PushNotifications';
import { getCorporatePriceSlashed, getIndividualPriceSlashed } from '../../v1/helpers/slashed_delivery_price';

config();
distanceApi.key(process.env.GOOGLE_API_KEY);

const isProduction = process.env.NODE_ENV === 'production';
const { Op } = Sequelize;

const cron = require('node-cron');


class PackageV2 {
   /**
   * @method get_estimate_v2
   * @memberof Package
   * @params req, res
   * @description Customers can get estimates before creating packages
   * @return JSON object
   */

  static get_estimate_v2(req, res) {
    return Promise.try(async () => {
      let { type } = req.params;
      const { ...data } = req.body;

      if (type.length <= 5) {
        type = `${type}-state`;
      }

      if (type === 'intra-state') {
        data.to_state = data.from_state;
      }

      const origins = checkTypeV2('from', data, type);
      const destinations = checkTypeV2('to', data, type);
      distanceApi.matrix([origins], [destinations], async function (err, result) {
        try {
          if (err) {
            throw new Error(err);
          } else {
            const distance_in_km = result.rows[0].elements[0].distance.text;
            const distance = Math.ceil(Number(distance_in_km.split(' ')[0].replace(',', '')));
            const delivery_price = data.is_express_delivery ? Math.ceil(calc_delivery_price_v2(type, data.transport_mode_category, distance, data.value) * 2.2) : calc_delivery_price_v2(type, data.transport_mode_category, distance, data.value);
            if (!delivery_price) {
              return res.status(400).json({
                status: 400,
                error: 'An error occurred, please try again'
              });
            }
            const dt = {
              delivery_price,
              distance,
              ...data
            }
            return res.status(200).json({
              status: 200,
              data: dt
            })
          }
         } catch (err) {
          log(err);
          return res.status(400).json({
            status: 400,
            error: 'An error occurred, please try again',
          });
        }
      })
    })
      .catch(err => {
        log(err);
        return res.status(400).json({
          status: 400,
          err,
        });
      })
  }

  /**
   * @method request_dispatch_v2
   * @memberof Package
   * @params req, res
   * @description this method create a package that needs a dispatcher
   * @return JSON object
   */

  static async request_dispatch_v2(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      let { type } = req.params;
      let {
        transport_mode_category,
        delivery_price,
        distance,
        value,
        ...data
      } = req.body;

      if (type.length <= 5) {
        type = `${type}-state`;
      }
      // same state
      if (type === 'intra-state') {
        data.to_state = data.from_state;
      }
      if (!data.payment_mode) {
        data.payment_mode = 'virtual_balance';
      }
      if (!value) {
        value = '0-999';
      }
      if (data.payment_mode === 'virtual_balance') {
        if (Number(delivery_price) > Number(user.virtual_balance)) {
          return res.status(400).json({
            status: 400,
            error: `You must top-up your account with at least ₦${Number(delivery_price) - Number(user.virtual_balance)} before requesting this dispatch`
          })
        }
        if ((Number(user.virtual_balance) - Number(user.virtual_allocated_balance)) < Number(delivery_price)) {
          return res.status(400).json({
            status: 400,
            error: 'Package limit exceeded for the amount in your wallet, \nTop-up your wallet or delete a package that has not been picked-up'
          })
        }
        const updated_V_A_B = Number(user.virtual_allocated_balance) + Number(delivery_price)
        await Customers.update({
          virtual_allocated_balance: updated_V_A_B
        }, {
          where: {
            id: user.id
          }
        });
      } else {
       return res.status(400).json({
         status: 400,
         error: 'Invalid payment mode'
       })
      }
      // create the package.
      const package_id = uuid();
      const delivery_key = generate_ref('delivery');
      const package_detail = await Packages.create({
        type_of_dispatch: type,
        customer_id: user.id,
        transport_mode_category,
        value,
        distance,
        delivery_price,
        package_id,
        delivery_key,
        ...data,
      });
      const message = {
        pickup_state: data.from_state,
        notification_id: Math.floor(Math.random() * 1234 * 60),
        detail: `new ${data.is_express_delivery ? 'EXPRESS' : ''} pickup @ ${data.pickup_address} to ${data.dropoff_address} for ₦${new Intl.NumberFormat('en-US').format(Number(delivery_price))}. You might want to pick it up, do check it out!.`
      };
      const task = cron.schedule('1 * * * * *', () => {
        PackageV2.sendNewPackageCreationToDispatchersV2(message, task);
      });
      sendNewPackageNotification(package_detail, user, data);

      // push event to all companies;
      let comp_m = `New ${data.is_express_delivery ? 'EXPRESS' : ''} pickup @ ${data.pickup_address} to ${data.dropoff_address}`;
      eventEmitter.emit('company_new_package_creation', {
        message: comp_m,
      })
      return res.status(200).json({
        status: 200,
        message: 'Package created successfully. Please wait, dispatchers will reach out to you soon',
        data: package_detail,
      });
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        err,
      });
    })
  }

  /**
   * @method change_price
   * @memberof Package
   * @params req, res
   * @description courier can change the price of package they pick up, in negotiation
   * @return JSON object
   */

  static change_price(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const { package_id } = req.params;
      const { new_price } = req.body;
      const _package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Package not found',
        });
      }
      if (_package.dispatcher_id !== user.id) {
        return res.status(401).json({
          status: 401,
          error: 'You are not allowed to perform this action',
        });
      }

      if (Number(new_price) < Number(_package.delivery_price)) {
        return res.status(400).json({
          status: 400,
          error: 'New price should not be lower than actual price'
        })
      }
      await Packages.update(
        {
          pending_delivery_price: Number(new_price)
        },
        {
          where: {
            package_id
          }
        }
      );

      const updated_package = await Packages.findOne({
        where: {
          package_id,
        },
        attributes: {
          exclude: ['delivery_key']
        }
      });

      const package_owner = await Customers.findOne({
        where: {
          id: updated_package.customer_id,
        },
      });

      const NEW_NOTIFICATION = {
        email: package_owner.email,
        entity_id: package_id,
        is_viewable: true,
        type: 'customer',
        desc: 'CD006',
        message: `The approved dispatcher for package with id: ${package_id} has requested a change in price for this package`,
        title: 'New Price change',
        action_link: (isProduction) ? `${process.env.SERVER_APP_URL}/package/owner/view/${package_id}` : `http://localhost:4000/v1/package/owner/view/${package_id}`, // ensure customer is logged in
      };

      const _notification = await Notifications.create({ ...NEW_NOTIFICATION });
      // get all user unread notifications;
      let timestamp_benchmark = moment().subtract(5, 'months').format();
      let all_notifications = await Notifications.findAll({
        where: {
          [Op.and]: [{ email: package_owner.email }, { type: 'customer' }],
          created_at: {
            [Op.gte]: timestamp_benchmark
          }
        }
      });
      const device_notify_obj = {
        title: NEW_NOTIFICATION.title,
        body: NEW_NOTIFICATION.message,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        icon: 'ic_launcher'
      };
      await Notifier(
        all_notifications,
        package_owner,
        'customer',
        device_notify_obj,
        _notification
      );
      return res.status(200).json({
        status: 200,
        message: 'package delivery price change awaits approval from package owner',
        data: updated_package,
      });
      
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        err,
      });
    })
  }

  /**
   * @method approve_or_decline_price_change
   * @memberof Package
   * @params req, res
   * @description Customer can approve or decline the request to change delivery price
   * @return JSON object
   */

  static approve_or_decline_price_change(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const { response } = req.query;
      const { package_id } = req.params;
      const NEW_NOTIFICATION = {
        type: 'courier',
      };
      const _package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Package not found',
        });
      }
      if (_package.customer_id !== user.id) {
        return res.status(400).json({
          status: 401,
          error: 'You are not allowed to perform this action. Please contact support@koogah.com',
        });
      }
      if (!_package.pending_delivery_price) {
        return res.status(400).json({
          status: 400,
          error: 'Oops, seems there is no pending weight change for this package',
        });
      }
      const dispatcher = await Couriers.findOne({
        where: {
          id: _package.dispatcher_id,
        },
      });
      if (response === 'approve') {
        if (_package.payment_mode === 'virtual_balance') {
          // check if customer's virtual balance is enough for dispatching the goods
          if (Number(_package.pending_delivery_price) > Number(user.virtual_balance)) {
            return res.status(400).json({
              status: 400,
              error: 'Please top-up your account to approve this new weight change'
            })
          }
          // remove the previous delivery cost from the allocated virtual balance
          // then compare with the user current virtual balance against the new delivery price
          let updated_V_A_B = 0;
          if (user.virtual_allocated_balance > 0) {
            updated_V_A_B = Number(user.virtual_allocated_balance) - Number(_package.delivery_price);
          }
          if ((Number(user.virtual_balance) - Number(updated_V_A_B)) < Number(_package.pending_delivery_price)) {
            return res.status(400).json({
              status: 400,
              error: 'Please top-up your account to approve this new price change'
            })
          }
          updated_V_A_B = Number(updated_V_A_B) + Number(_package.pending_delivery_price);
          await Customers.update({
            virtual_allocated_balance: updated_V_A_B
          }, {
            where: {
              id: user.id
            }
          })
        } 
        await Packages.update({
          delivery_price: _package.pending_delivery_price,
          pending_delivery_price: null,
        },
        {
          where: {
            package_id,
          },
        });
        NEW_NOTIFICATION.email = dispatcher.email;
        NEW_NOTIFICATION.desc="CD007";
        NEW_NOTIFICATION.message = `A customer just approved price change for package with id: ${package_id}`;
        NEW_NOTIFICATION.title = 'New price change approval';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }
      if (response === 'decline') {
        await Packages.update({
          pending_delivery_price: null,
        },
        {
          where: {
            package_id,
          },
        });
        NEW_NOTIFICATION.email = dispatcher.email;
        NEW_NOTIFICATION.desc="CD007";
        NEW_NOTIFICATION.message = `A customer just declined price change for package with id: ${package_id}`;
        NEW_NOTIFICATION.title = 'New price change declined';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }
      const updated_package = await Packages.findOne({
        where: {
          package_id,
        },
      });

      NEW_NOTIFICATION.entity_id = package_id;
      NEW_NOTIFICATION.is_viewable = true;

      const _notification = await Notifications.create({ ...NEW_NOTIFICATION });

      // get all user unread notifications;
      let timestamp_benchmark = moment().subtract(5, 'months').format();
      let all_notifications = await Notifications.findAll({
        where: {
          [Op.and]: [{ email: dispatcher.email }, { type: 'courier' }],
          created_at: {
            [Op.gte]: timestamp_benchmark
          }
        }
      });
      const device_notify_obj = {
        title: NEW_NOTIFICATION.title,
        body: NEW_NOTIFICATION.message,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        icon: 'ic_launcher'
      };
      await Notifier(
        all_notifications,
        dispatcher,
        'dispatcher',
        device_notify_obj,
        _notification
      );

      const res_message = `Successfully ${response === 'approve' ? 'approved' : 'declined'} price change request`;
      return res.status(200).json({
        status: 200,
        message: res_message,
        data: updated_package,
      });

    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        err,
      });
    })
  }

  /**
   * @method edit_package_v2
   * @memberof Package
   * @params req, res
   * @description Customer can approve or decline the request to change delivery price
   * @return JSON object
   */
  static edit_package_v2(req, res) {
    return Promise.try(async () => {
      const { package_id } = req.params;
      const { payment_mode, ...data } = req.body;
      const { user } = req.session;
      const _package = await Packages.findOne({
        where: {
          package_id
        }
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Oops, seems this package doesn\'t exist anymore'
        })
      }
      if (_package.status === 'delivered') {
        return res.status(400).json({
          status: 400,
          error: 'Invalid operation, cannot edit a delivered package'
        })
      }
      if (_package.status === 'tracking') {
        return res.status(400).json({
          status: 400,
          error: 'Invalid operation, cannot edit a tracking package'
        })
      }
      let type = data.type_of_dispatch;
      // same state
      if (type === 'intra-state') {
        data.to_state = data.from_state;
      }
      const origins = checkTypeV2('from', data, type);
      const destinations = checkTypeV2('to', data, type);
      distanceApi.matrix([origins], [destinations], async function (err, result) {
        try { 
          if (err) {
            throw new Error(err);
          } else {
            try {
              const distance_in_km = result.rows[0].elements[0].distance.text;
              const distance = Math.ceil(Number(distance_in_km.split(' ')[0].replace(',', '')));
              const delivery_price = data.is_expresss_delivery ? Math.ceil(calc_delivery_price_v2(type, data.transport_mode_category, distance, data.value) * 2.5) : calc_delivery_price_v2(type, data.transport_mode_category, distance, data.value);
              if (!delivery_price) {
                return res.status(400).json({
                  status: 400,
                  error: 'Weight must match one of ["0-5","6-10", "11-15", "16-25", "26-40", "50-100", "101-200", "201-300", "301-400", "401-500", "501>"],',
                });
              }
              if (payment_mode === 'virtual_balance') {
                if (Number(delivery_price) > Number(user.virtual_balance)) {
                  return res.status(400).json({
                    status: 400,
                    error: `You must top-up your account with at least ₦${Number(delivery_price) - Number(user.virtual_balance)} before editing this package`
                  })
                }

                let updated_V_A_B = 0;
                if (user.virtual_allocated_balance > 0) {
                  updated_V_A_B = Number(user.virtual_allocated_balance) - Number(_package.delivery_price);
                }
                if ((Number(user.virtual_balance) - Number(updated_V_A_B)) < Number(delivery_price)) {
                  return res.status(400).json({
                    status: 400,
                    error: 'Please top-up your account to successfully edit this package'
                  })
                }
                updated_V_A_B = Number(updated_V_A_B) + Number(delivery_price);
                await Customers.update({
                  virtual_allocated_balance: updated_V_A_B
                }, {
                  where: {
                    id: user.id
                  }
                });

                if (
                  payment_mode !== _package.payment_mode
                  && _package.payment_mode === 'koogah_coin'
                ) {
                  const KOOGAH_COIN_WORTH = process.env.KOOGAH_COIN_WORTH;
                  let user_allocated_kc_balance = Number(KOOGAH_COIN_WORTH) * Number(user.virtual_allocated_kc_balance);
                  let updated_V_A_KC_B = Number(user_allocated_kc_balance) - Number(_package.delivery_price);
                  updated_V_A_KC_B = updated_V_A_KC_B / KOOGAH_COIN_WORTH;
                  await Customers.update({
                    virtual_allocated_kc_balance: updated_V_A_KC_B
                  }, {
                      where: {
                      id: user.id
                    }
                  })
                }

               
              }else {
                return res.status(400).json({
                  status: 400,
                  error: 'Invalid payment mode'
                })
              }
              await Packages.update({
                distance,
                delivery_price,
                payment_mode,
                ...data,
              }, {
                where: {
                  package_id,
                }
              })
              const updated_package = await Packages.findOne({
                where: {
                  package_id,
                }
              });
              return res.status(200).json({
                status: 200,
                message: 'Package updated successfully',
                data: updated_package
              })
            } catch (err) {
              log(err);
              return res.status(400).json({
               status: 400,
               error: err,
             });
            }
          }
        } catch (err) {
          log(err);
            return res.status(400).json({
             status: 400,
             error: err,
           });
        }
      })
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        err,
      });
    })
  }

    /**
   * @method customer_view_all_package_v2
   * @memberof Package
   * @params req, res
   * @description Customers can view all packages they own
   * @return JSON object
   */

     static customer_view_all_package_v2(req, res) {
      const { user } = req.session;
      let { status, offset } = req.query;
      return Promise.try(async () => {
        let all_packages;
        if (!offset) {
          offset = 0;
        }
        if (status === undefined  || status == 'all') {
          all_packages = await Packages.findAndCountAll({
            limit: 5,
            offset,
            where: {
              customer_id: user.id,
            },
            include: [
              {
                model: Couriers,
                as: 'dispatcher',
                attributes: [
                  "id",
                  'first_name',
                  'last_name',
                  'email',
                  'mobile_number',
                  'state',
                  'town',
                  'nationality',
                  'sex',
                  'profile_image',
                  'rating',
                  'deliveries',
              ]
              },
            ],
            order: [
              ['status', 'DESC'],
              ['created_at', 'DESC']
            ]
          });
        } else {
          all_packages = await Packages.findAndCountAll({
            limit: 5,
            offset,
            where: {
              customer_id: user.id,
              status,
            },
            order: [
              ['status', 'DESC']
            ]
          });
        }
        return res.status(200).json({
          status: 200,
          message: 'All packages retreived successfully',
          data: all_packages,
        });
      }).catch((error) => {
        log(error);
        return res.status(400).json({
          status: 400,
          error,
        });
      });
     }
  
   /**
   * @method sendNewPackageCreationToDispatchersV2
   * @memberof Package
   * @params req, res
   * @description Customers new package creation to dispatcher.
   * @return JSON object
   */
    static sendNewPackageCreationToDispatchersV2(msg, task) {
      return Promise.try(async() => {
        const allPushDevices = await PushDevices.findAll({
          where: {
            is_active: true,
            current_state_location: {
              [Op.iLike]: `%${msg.pickup_state}%`,
            },
          }
        });
        const device_notify_obj = {
          title: 'New Pickup - Koogah',
          body: `Hi, ${msg.detail}`,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          icon: 'ic_launcher'
        };
        const all_tokens = allPushDevices.map((pd) => pd.token);
        const notification_message = PushNotify.createMessage(
          device_notify_obj,
          {
            notification_id: Math.floor(Math.random() * 1234 * 60),
            desc: 'CD012',
          }
        );
        PushNotify.sendMessageDispatcher(notification_message, all_tokens);
        task.stop();
      }).catch(err => {
        log(err);
      });
    }
  
  /**
   * @method courier_view_marketplace_v2
   * @memberof Package
   * @params req, res
   * @description Couriers can view all packages in the market place
   * @return JSON object
   */

  static courier_view_packages_in_marketplace_v2(req, res) {
  return Promise.try( async () => {
    const { user } = req.session;
    let { from, state, to, dispatch_type, offset } = req.query;
    if (!state) {
      state = user.state
    }
    if(!offset) {
      offset = 0;
    }
    if (!from) {
      from = user.town
    }
    let all_package_in_marketplace;

    if (!dispatch_type) {
      dispatch_type = 'intra-state'
    }
    if (dispatch_type === 'intra-state') {
      if (!to) { 
        all_package_in_marketplace = await Packages.findAndCountAll({
          limit: 10,
          offset,
          order: [
            ['createdAt', 'DESC'],
          ],
          where:  {
              [Op.and]: [
                {
                  from_state: {
                    [Op.iLike]: `%${state}%`,
                  },
                },
                { type_of_dispatch: dispatch_type },
                { dispatcher_id: null}
              ],
              status: {
                [Op.eq]: 'not-picked'
              }
            },
          attributes: {
            exclude: ['delivery_key']
          },
          include: [
            {
              model: Customers,
              as: 'customer',
              attributes: [
                "id",
                'first_name',
                'last_name',
                'has_business',
                'business_name',
                'rating',
                'profile_image',
                'mobile_number_one',
                'mobile_number_two',
                'address',
                'nationality',
                'email',
                'state',
                'town'
              ]
            },
          ],
        })
      }
      else {
        all_package_in_marketplace = await Packages.findAndCountAll({
          limit: 5,
          offset,
          order: [
            ['createdAt', 'DESC']
          ],
          where: {
            [Op.and]: [
                { 
                  from_state: {
                  [Op.iLike]: `%${state}%`
                } 
                }, 
                {
                  to_state: {
                    [Op.iLike]: `%${state}%`,
                  },
                },
                { 
                  from_town: {
                    [Op.iLike]: `%${from}%`
                  }
                },
                { 
                  to_town: {
                    [Op.iLike]: `%${to}%`
                  }
                },
                { type_of_dispatch: dispatch_type },
                { dispatcher_id: null}
            ],
            status: {
              [Op.eq]: 'not-picked'
            }
          },
          attributes: {
            exclude: ['delivery_key']
          },
          include: [
            {
              model: Customers,
              as: 'customer',
              attributes: [
                "id",
                'first_name',
                'last_name',
                'has_business',
                'business_name',
                'rating',
                'profile_image',
                'mobile_number_one',
                'mobile_number_two',
                'address',
                'nationality',
                'email',
                'state',
                'town'
              ]
            },
          ],
        })
      }
    }

    if (dispatch_type === 'inter-state') {
      if (!to) {
          all_package_in_marketplace = await Packages.findAndCountAll({
            limit: 5,
            offset,
            order: [
              ['createdAt', 'DESC']
            ],
            where: {
              [Op.and]: [
                { 
                  from_state: {
                  [Op.iLike]: `%${from}%`
                  } 
                }, 
                  { type_of_dispatch: dispatch_type },
                  { dispatcher_id: null}
              ],
              status: {
                [Op.eq]: 'not-picked'
              }
            },
            attributes: {
              exclude: ['delivery_key']
            },
            include: [
              {
                model: Customers,
                as: 'customer',
                attributes: [
                  "id",
                  'first_name',
                  'last_name',
                  'has_business',
                  'business_name',
                  'rating',
                  'profile_image',
                  'mobile_number_one',
                  'mobile_number_two',
                  'address',
                  'nationality',
                  'email',
                  'state',
                  'town'
                ]
              },
            ],
          })
      } else {
        all_package_in_marketplace = await Packages.findAndCountAll({
          limit: 5,
          offset,
          order: [
            ['createdAt', 'DESC']
          ],
          where: {
            [Op.and]: [
                { 
                  from_state: {
                  [Op.iLike]: `%${state}%`
                } 
                },  
                { 
                  to_state: {
                    [Op.iLike]: `%${to}%`
                  }
                },
                { type_of_dispatch: dispatch_type },
                { dispatcher_id: null}
            ],
            status: {
              [Op.eq]: 'not-picked'
            }
          },
          attributes: {
            exclude: ['delivery_key']
          },
          include: [
            {
              model: Customers,
              as: 'customer',
              attributes: [
                "id",
                'first_name',
                'last_name',
                'has_business',
                'business_name',
                'rating',
                'profile_image',
                'mobile_number_one',
                'mobile_number_two',
                'address',
                'nationality',
                'email',
                'state',
                'town'
              ]
            },
          ],
        })
      }
    }

    if (dispatch_type === 'international') {
      if(!to) {
        all_package_in_marketplace = await Packages.findAndCountAll({
          limit: 5,
          offset,
          order: [
            ['createdAt', 'DESC']
          ],
          where: {
            [Op.and]: [
                { from_country: from }, 
                { type_of_dispatch: dispatch_type },
                { dispatcher_id: null}
            ],
            status: {
              [Op.eq]: 'not-picked'
            }
          },
          attributes: {
            exclude: ['delivery_key']
          },
          include: [
            {
              model: Customers,
              as: 'customer',
              attributes: [
                "id",
                'first_name',
                'last_name',
                'has_business',
                'business_name',
                'rating',
                'profile_image',
                'mobile_number_one',
                'mobile_number_two',
                'address',
                'nationality',
                'email',
                'state',
                'town'
              ]
            },
          ],
        })
      } else {
        all_package_in_marketplace = await Packages.findAndCountAll({
          limit: 5,
          offset,
          order: [
            ['createdAt', 'DESC']
          ],
          where: {
            [Op.and]: [
                { from_country: from }, 
                { type_of_dispatch: dispatch_type },
                { to_country: to},
                { dispatcher_id: null}
            ],
            status: {
              [Op.eq]: 'not-picked'
            }
          },
          attributes: {
            exclude: ['delivery_key']
          },
          include: [
            {
              model: Customers,
              as: 'customer',
              attributes: [
                "id",
                'first_name',
                'last_name',
                'has_business',
                'business_name',
                'rating',
                'profile_image',
                'mobile_number_one',
                'mobile_number_two',
                'address',
                'nationality',
                'email',
                'state',
                'town'
              ]
            },
          ],
        })
      }
    }
    const {count, rows} = all_package_in_marketplace;


    const packagesRes = rows.map((row) => {
      const rowData = row.dataValues;
      return {
        main_delivery_price: rowData.delivery_price,
        ...rowData,
        delivery_price: user.is_cooperate ? getCorporatePriceSlashed(rowData.delivery_price) : getIndividualPriceSlashed(rowData.delivery_price)
      }
    })

    return res.status(200).json({
      status: 200,
      message: 'packages retrieved successfully',
      data:{
        count,
        rows: packagesRes, 
      },
    })
  }).catch((error) => {
    log(error);
    return res.status(400).json({
      status: 400,
      error,
    });
  })
}

}

export default PackageV2;