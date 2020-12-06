/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import Sequelize from 'sequelize';
import distanceApi from 'google-distance-matrix';
import log from 'fancy-log';
import uuid from 'uuid/v4';
import { config } from 'dotenv';
import checkType from '../helpers/check.type';
import calc_delivery_price from '../helpers/calc.price';
import generate_ref from '../helpers/ref.id';
import {
  Packages, Couriers, Notifications, Customers, PushDevices, PackagesTrackings
} from '../../../database/models';

import PushNotify from '../../../PushNotifications';
import eventEmitter from '../../../EventEmitter';
import geoPackageDestination from '../helpers/geo-package-destination';

config();
distanceApi.key(process.env.GOOGLE_API_KEY);

const isProduction = process.env.NODE_ENV === 'production';
const { Op } = Sequelize;
/**
 * @class Package
 * @description Defines methods for packages. Packages are ggods that needs to be dispatched
 */
class Package {
  /**
   * @method request_dispatch
   * @memberof Package
   * @params req, res
   * @description this method create a package that needs a dispatcher
   * @return JSON object
   */
  static async request_dispatch(req, res) {
    const { user } = req.session;
    let { type } = req.params;
    const { weight, ...data } = req.body;
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
    // calculate the distance between package pickup location
    // and package dropoff location
    return Promise.try(async () => {
      const origins = checkType('from', data, type);
      const destinations = checkType('to', data, type);
      distanceApi.matrix([origins], [destinations], async function (err, result) {
        try {
          if (err) {
            throw new Error(err);
          } else {
            try {
              const distance_in_km = result.rows[0].elements[0].distance.text;
              const distance = Math.ceil(Number(distance_in_km.split(' ')[0].replace(',', '')));
              const delivery_price = calc_delivery_price(type, weight, distance);
              if (!delivery_price) {
                return res.status(400).json({
                  status: 400,
                  error: 'Weight must match one of ["0-5","6-10", "11-15", "16-25", "26-40", "50-100", "101-200", "201-300", "301-400", "401-500", "501>"],',
                });
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
                    error: 'Sorry you have reached your package balance threshold, \nplease top-up your account or delete a package that has not been picked-up'
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
              } else if (data.payment_mode === 'koogah_coin') {
                 // convert koogah coin to determine value;
                 // in Naira, it is worth 10 Naira.
                const KOOGAH_COIN_WORTH = process.env.KOOGAH_COIN_WORTH;
                const user_koogah_coin_balance = Number(KOOGAH_COIN_WORTH) * Number(user.koogah_coin);
                // convert virtual allocated kc balance
                const user_allocated_kc_balance = Number(KOOGAH_COIN_WORTH) * Number(user.virtual_allocated_kc_balance);
                if (Number(delivery_price) > Number(user_koogah_coin_balance)) {
                  return res.status(400).json({
                    status: 400,
                    error: 'Sorry, you have insufficient KC balance'
                  })
                }
                if ((Number(user_koogah_coin_balance) - Number(user_allocated_kc_balance)) < Number(delivery_price)) {
                  return res.status(400).json({
                    status: 400,
                    error: 'Sorry, you have reached your package koogah coin balance threshhold,\n please select a different means of payment'
                  })
                }
                // before saving, convert it back.
                let updated_V_A_KC_B = Number(user_allocated_kc_balance) + Number(delivery_price);
                updated_V_A_KC_B = updated_V_A_KC_B / KOOGAH_COIN_WORTH;
      
                await Customers.update({
                  virtual_allocated_kc_balance: updated_V_A_KC_B
                }, {
                    where: {
                    id: user.id
                  }
                })
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
                weight,
                distance,
                delivery_price,
                package_id,
                delivery_key,
                ...data,
              });
    
              // TODO: this should create a new package creation notification
              // and/or send a websocket notification to all couriers registered in the package location area
              return res.status(200).json({
                status: 200,
                message: 'Package created successfully. Please wait, dispatchers will reach out to you soon',
                data: package_detail,
              });
            } catch (err) {
              log(err);
              return res.status(400).json({
               status: 400,
               err
             });
            }
          }
        } catch (err) {
          log(err);
            return res.status(400).json({
              status: 400,
              err
          });
        }
      })
    }).catch((err) => {
      log(err);
      return res.status(400).json({
       status: 400,
       err
     });
    })
  }

  /**
   * @method show_interest
   * @memberof Package
   * @params req, res
   * @description this method allows a user to show interest in a package
   * @return JSON object
   */

  static show_interest(req, res) {
    const { package_id } = req.params;
    const { user } = req.session;
    return Promise.try(async () => {
      if (user.pending > 0) {
        return res.status(400).json({
          status: 400,
          error: 'You cannot pickup more packages. Please deliver the one you have pending',
        });
      }
      const _package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'The package you want to pickup doesn\'t exist',
        });
      }
      if (_package.dispatcher_id || _package.status === 'picked-up') {
        return res.status(400).json({
          status: 400,
          error: 'This package has already been picked up by another dispatcher',
        });
      }
      if (_package.pending_dispatchers.includes(user.id)) {
        return res.status(400).json({
          status: 400,
          error: 'You have already indicated interest for the package. Please wait for the owner to approve you.',
        });
      }
      // update Package and send a notification to the owner of the package.
      return Promise.try(async () => {
        await Packages.update({
          pending_dispatchers: _package.pending_dispatchers.concat(user.id),
        },
        {
          where: {
            package_id,
          },
        });
        const updated_package = await Packages.findOne({
          where: {
            package_id,
          },
          attributes: {
            exclude: ['delivery_key']
          }
        });
        const customer = await Customers.findOne({
          where: {
            id: _package.customer_id,
          },
        });
        const NEW_NOTIFICATION = {
          email: customer.email,
          type: 'customer',
          desc: 'CD004',
          title: `Interested dispatcher for package: ${package_id}`,
          message: _package.pending_dispatchers.length > 1 ? 'A dispatcher is interested in your package. Please ensure you checkout the dispatcher\'s profile first, before approving them' : 'Another dispatcher is interested in your package. Please ensure you checkout the dispatcher\'s profile first, before approving them',
          action_link: (isProduction) ? `${process.env.SERVER_APP_URL}/profile/courier/pv/${user.id}` : `http://localhost:4000/v1/profile/courier/pv/${user.id}`, // ensure customer is logged in
        };

        const _notification = await Notifications.create({ ...NEW_NOTIFICATION });
        // get all user unread notifications;
        let all_notifications = await Notifications.findAll({
          where: {
            [Op.and]: [{email: user.email}, {type: 'customer'}]
          }
        })
        let backDate = new Date().setMonth(10);
        all_notifications = all_notifications.filter((notification) => {
          let notification_date = notification.createdAt.toLocaleString().split(',').join();
          notification_date = notification_date.split('/');

          let y = Number(notification_date[2].split(',')[0]);
          let m = Number(notification_date[0]);
          let d = Number(notification_date[1]);

          let notification_date_obj = Date.UTC(y, m, d);

          if (backDate < notification_date_obj) {
            return notification;
          }
        });
        // customer websocket id;
        const customer_websocket_id = `customer:${user.email}:${user.id}`;
        
        // emit the new notification event;
        eventEmitter.emit('new_notification', {
          connectionId: customer_websocket_id,
          data: all_notifications
        });


        const _customer_device = await PushDevices.findOne({
          where: {
            [Op.and]: [{user_id: user.id},{is_active: true},{user_type: 'customer'}]
          }
        });

        if (_customer_device) {
          
          let device_notify_obj = {};
          if (_customer_device.platform === 'ios') {
            device_notify_obj = {
              title: `Interested dispatcher for package: ${package_id}`,
              body: _package.pending_dispatchers.length > 1 ? 'A dispatcher is interested in your package.' : 'Another dispatcher is interested in your package.',
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
            }
          } else {
            device_notify_obj = {
              title: `Interested dispatcher for package: ${package_id}`,
              body: _package.pending_dispatchers.length > 1 ? 'A dispatcher is interested in your package.' : 'Another dispatcher is interested in your package.',
              click_action: 'FLUTTER_NOTIFICATION_CLICK',
              icon: 'ic_launcher'
            }
          }
  
          const device_token = _customer_device.token;
          const notification_message = PushNotify.createMessage(
          device_notify_obj,
          {
            notification_id: _notification.id,
            action_link: (isProduction) ? `${process.env.SERVER_APP_URL}/profile/courier/pv/${user.id}` : `http://localhost:4000/v1/profile/courier/pv/${user.id}`, // ensure customer is logged in // to be changed later
          });
          PushNotify.sendMessage(notification_message, device_token);
        }

        return res.status(200).json({
          status: 200,
          message: 'Your interest is acknowledged. The owner of the package will be notified shortly',
          data: updated_package,
        });
      }).catch((err) => {
        log(err);
        res.status(400).json({
          status: 400,
          error: err,
        });
      });
    }).catch((err) => {
      log(err);
      res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }
  /**
   * @method approve_or_decline
   * @memberof Package
   * @params req, res
   * @description this method allows a customer approve/decline a dispatcher's request
   * @return JSON object
   */

  static approve_or_decline(req, res) {
    const { package_id, dispatcher_id } = req.params;
    const { response } = req.query;
    const { user } = req.session;
    const NEW_NOTIFICATION = {
      type: 'courier',
    };
    return Promise.try(async () => {
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
        return res.status(401).json({
          status: 401,
          error: 'You are not allowed to perform this action. Please contact support@koogah.com',
        });
      }
      if (!_package.pending_dispatchers) {
        return res.status(400).json({
          status: 400,
          error: 'Cannot perform action. No Pending dispatcher for this package',
        });
      }
      if (!_package.pending_dispatchers.includes(dispatcher_id)) {
        return res.status(404).json({
          status: 404,
          error: 'The selected dispatcher is not interested in dispatching this package'
        })
      }
      if (response === 'approve') {
        const date_time = new Date().toLocaleString();
        const dispatcher = await Couriers.findOne({
          where: {
            id: dispatcher_id,
          },
        });

        if (!dispatcher) {
          return res.status(404).json({
            status: 404,
            error: 'Oops, seems the dispatcher doesn\'t exists anymore...',
          });
        }
        if (dispatcher.pending > 0) {
          return res.status(401).json({
            status: 401,
            error: `Oops cannot select dispatcher\n${dispatcher.first_name}${' '}${dispatcher.last_name} already dispatches for another customer`,
          });
        }

        await Packages.update({
          dispatcher_id,
          pickup_time: date_time,
          status: 'picked-up',
        },
        {
          where: {
            package_id,
          },
        });
        const number_of_pickups = parseInt(dispatcher.pickups, 10) + 1;
        const number_of_pending_deliveries = parseInt(dispatcher.pending, 10) + 1;
        await Couriers.update({
          pickups: number_of_pickups,
          pending: number_of_pending_deliveries,
        }, {
          where: {
            email: dispatcher.email,
          },
        });
        NEW_NOTIFICATION.email = dispatcher.email;
        NEW_NOTIFICATION.desc='CD005';
        NEW_NOTIFICATION.message = 'A customer has approved you to dispatch their package. \n Please ensure you meet them at a rather safe zone or outside their doors and/or gate';
        NEW_NOTIFICATION.title = 'New Dispatch Approval';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }

      if (response === 'decline') {
        const dispatcher = await Couriers.findOne({
          where: {
            id: dispatcher_id,
          },
        });
        if (_package.status === 'picked-up') {
            // update the dispatcher's pending packages;
            // and reduce their pick ups
          const current_pending_deliveries = parseInt(dispatcher.pending, 10) - 1;
          const current_pickups = parseInt(dispatcher.pickups, 10) - 1;
          await Couriers.update({
            pending: current_pending_deliveries,
            pickups: current_pickups
          }, {
            where: {
              id: dispatcher_id
            }
          });
          // remove the dispatcher from the list of pending dispatchers;
          let pending_dispatchers = _package.pending_dispatchers;
          // get index of dispatcher.
          const idx = pending_dispatchers.findIndex((d) => d === dispatcher_id);
          pending_dispatchers.splice(idx, 1);

          await Packages.update({
            dispatcher_id: null,
            pending_dispatchers,
            pickup_time: null,
            status: 'not-picked'
          },
            {
              where: {
                package_id,
            }
          })
        } else {
          // remove the dispatcher from the list of pending dispatchers;
          let pending_dispatchers = _package.pending_dispatchers;
          // get index of dispatcher.
          const idx = pending_dispatchers.findIndex((d) => d === dispatcher_id);
          pending_dispatchers.splice(idx, 1);
          await Packages.update({
            pending_dispatchers,
            status: 'not-picked'
          },
          {
            where: {
              package_id,
            },
          });
        }
        NEW_NOTIFICATION.email = dispatcher.email;
        NEW_NOTIFICATION.desc='CD005';
        NEW_NOTIFICATION.message = `A customer has declined your request to dispatch their package with id: ${package_id}.`;
        NEW_NOTIFICATION.title = 'New Dispatch Decline';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }
      const updated_package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      await Notifications.create({ ...NEW_NOTIFICATION });
      const res_message = `Successfully ${response === 'approve' ? 'approved' : 'declined'} dispatcher request`;
      return res.status(200).json({
        status: 200,
        message: res_message,
        data: updated_package,
      });
    }).catch((err) => {
      log(err);
      res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method change_weight
   * @memberof Package
   * @params req, res
   * @description courier can change the weight of package they pick up, in negotiation
   * @return JSON object
   */

  static change_weight(req, res) {
    const { user } = req.session;
    const { package_id } = req.params;
    const { new_weight } = req.body;
    return Promise.try(async () => {
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
          message: 'You are not allowed to perform this action',
        });
      }
      const new_delivery_price = calc_delivery_price(
        _package.type_of_dispatch,
        new_weight,
        _package.distance,
      );
      if (!new_delivery_price) {
        return res.status(400).json({
          status: 400,
          error: 'Weight must match one of ["0-5","6-10", "11-15", "16-25", "26-40", "50-100", "101-200", "201-300", "301-400", "401-500", "501>"],',
        });
      }
      return Promise.try(async () => {
        await Packages.update({
          pending_weight: new_weight,
          pending_delivery_price: new_delivery_price,
        },
        {
          where: {
            package_id,
          },
        });
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
          type: 'customer',
          desc: 'CD006',
          message: `The approved dispatcher for package with id: ${package_id} has changed the weight of the package`,
          title: 'New weight change',
          action_link: (isProduction) ? `${process.env.SERVER_APP_URL}/package/owner/view/${package_id}` : `http://localhost:4000/v1/package/owner/view/${package_id}`, // ensure customer is logged in
        };
        await Notifications.create({ ...NEW_NOTIFICATION });
        return res.status(200).json({
          status: 200,
          message: 'package weight change awaits approval from package owner',
          data: updated_package,
        });
      }).catch((err) => {
        log(err);
        return res.status(400).json({
          status: 400,
          error: err,
        });
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method approve_or_decline_weight_change
   * @memberof Package
   * @params req, res
   * @description Customer can approve or decline the request to change weight
   * @return JSON object
   */

  static approve_or_decline_weight_change(req, res) {
    const { user } = req.session;
    const { response } = req.query;
    const { package_id } = req.params;
    const NEW_NOTIFICATION = {
      type: 'courier',
    };
    return Promise.try(async () => {
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
      if (!_package.pending_weight || !_package.pending_delivery_price) {
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
          // check if customer's virtual balance is enough for dispatch the goods
          if (Number(_package.pending_delivery_price) > Number(user.virtual_balance)) {
            return res.status(400).json({
              status: 400,
              error: 'Please top-up your account to approve this new weight change'
            })
          }
          // remove the previous delivery cost from the allocated virual balance
          // then compare with the user current virtual balance against the new delivery price
          let updated_V_A_B = 0;
          if (user.virtual_allocated_balance > 0) {
            updated_V_A_B = Number(user.virtual_allocated_balance) - Number(_package.delivery_price);
          }
          if ((Number(user.virtual_balance) - Number(updated_V_A_B)) < Number(_package.pending_delivery_price)) {
            return res.status(400).json({
              status: 400,
              error: 'Please top-up your account to approve this new weight change'
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

        if (_package.payment_mode === 'koogah_coin') {
          // convert koogah coin to determine value;
          // in Naira, it is worth 10 Naira
          const KOOGAH_COIN_WORTH = process.env.KOOGAH_COIN_WORTH;
          const user_koogah_coin_balance = Number(KOOGAH_COIN_WORTH) * Number(user.koogah_coin);

          let user_allocated_kc_balance = Number(KOOGAH_COIN_WORTH) * Number(user.virtual_allocated_kc_balance);
          if (Number(_package.pending_delivery_price) > Number(user_koogah_coin_balance)) {
            return res.status(400).json({
              status: 400,
              error: 'Sorry, you have insufficient KC balance to approve this weight change',
            })
          }
          // subtract the user alloc kc balance from the delivery price
          if (user_allocated_kc_balance > 0) {
            user_allocated_kc_balance = Number(user_allocated_kc_balance) - Number(_package.delivery_price);
          } 
          if ((Number(user_koogah_coin_balance) - Number(user_allocated_kc_balance)) < Number(_package.pending_delivery_price)) {
            return res.status(400).json({
              status: 400,
              error: 'Sorry, you cannot complete this dispatch with Koogah coin, please use another payment mode'
            })
          }
          let updated_V_A_KC_B = Number(user_allocated_kc_balance) + Number(_package.pending_delivery_price);
          updated_V_A_KC_B = updated_V_A_KC_B / KOOGAH_COIN_WORTH;
          
          await Customers.update({
            virtual_allocated_kc_balance: updated_V_A_KC_B
          }, {
              where: {
              id: user.id
            }
          })

        }
   
        await Packages.update({
          weight: _package.pending_weight,
          delivery_price: _package.pending_delivery_price,
          pending_weight: null,
          pending_delivery_price: null,
        },
        {
          where: {
            package_id,
          },
        });
        NEW_NOTIFICATION.email = dispatcher.email;
        NEW_NOTIFICATION.desc="CD007";
        NEW_NOTIFICATION.message = `A customer just approved weight change for package with id: ${package_id}`;
        NEW_NOTIFICATION.title = 'New weight change approval';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }
      if (response === 'decline') {
        await Packages.update({
          pending_weight: null,
          pending_delivery_price: null,
        },
        {
          where: {
            package_id,
          },
        });
        NEW_NOTIFICATION.email = dispatcher.email;
        NEW_NOTIFICATION.desc="CD007";
        NEW_NOTIFICATION.message = `A customer just declined weight change for package with id: ${package_id}`;
        NEW_NOTIFICATION.title = 'New weight change declined';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }
      const updated_package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      await Notifications.create({ ...NEW_NOTIFICATION });
      const res_message = `Successfully ${response === 'approve' ? 'approved' : 'declined'} weight change request`;
      return res.status(200).json({
        status: 200,
        message: res_message,
        data: updated_package,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        error: err,
      });
    });
  }

  /**
   * @method mark_package_as_delivered
   * @memberof Package
   * @params req, res
   * @description Couriers can mark a package as delivered, when they deliver it.
   * @return JSON object
   */

  static mark_package_as_delivered(req, res) {
    const { user } = req.session;
    const { package_id, delivery_key } = req.params;
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      // validated delivery key;
      if (!delivery_key) {
        return res.status(400).json({
          status: 400,
          error: 'Please include the delivery key of this package'
        })
      }
      const KEY_CODE = delivery_key.slice(0, 5);
      if (KEY_CODE !== process.env.DELIVERY_KEYCODE) {
        return res.status(400).json({
          status: 400,
          error: 'Invalid delivery code'
        })
      }

      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Oops, seems the package doesn\'t exist anymore',
        });
      }
      if (delivery_key !== _package.delivery_key) {
        return res.status(400).json({
          status: 400,
          error: 'Delivery code is wrong, please contact the person who requested the delivery'
        })
      }
      if (_package.dispatcher_id !== user.id) {
        return res.status(401).json({
          status: 401,
          error: 'You are not authorized to perform this action',
        });
      }
      if (_package.dropoff_time || _package.status === 'delivered') {
        return res.status(400).json({
          status: 400,
          error: 'Oops, seems you have already delivered this package',
        });
      }
      const date_time = new Date().toLocaleString();
      await Packages.update({
        status: 'delivered',
        is_currently_tracking: false,
        dropoff_time: date_time,
        pending_dispatchers: [],
      },
      {
        where: {
          package_id,
        },
      });
      const user_new_delivery_count = parseInt(user.deliveries, 10) + 1;
      const user_new_pending_count = parseInt(user.pending, 10) - 1;
      await Couriers.update({
        deliveries: user_new_delivery_count,
        pending: user_new_pending_count,
      },
      {
        where: {
          email: user.email,
        },
      });
      const updated_package = await Packages.findOne({
        where: {
          package_id,
        },
        attributes: {
          exclude: ['delivery_key']
        },
        include: [
          {
            model: Couriers,
            as: 'dispatcher',
            attributes: [
              'id',
              'first_name',
              'last_name',
              'profile_image',
              'rating',
              'pickups',
              'deliveries',
            ],
          },
        ],
      });
      const customer = await Customers.findOne({
        where: {
          id: updated_package.customer_id,
        },
      });
      const NEW_NOTIFICATION = {
        email: customer.email,
        type: 'customer',
        desc: 'CD008',
        message: `The dispatcher for the package with id: ${package_id}, just marked the package as delivered`,
        title: 'New Package Delivered',
        action_link: (isProduction) ? `${process.env.SERVER_APP_URL}/package/owner/view/${package_id}` : `http://localhost:4000/v1/package/owner/view/${package_id}`, // ensure customer is logged in TODO: fix action link
      };
      await Notifications.create({ ...NEW_NOTIFICATION });
      return res.status(200).json({
        status: 200,
        message: 'Package delivered successfully',
        data: updated_package,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method courier_get_package
   * @memberof Package
   * @params req, res
   * @description Couriers can get a package they are approved to dispatch.
   * @return JSON object
   */

  static courier_get_package(req, res) {
    const { user } = req.session;
    const { package_id } = req.params;
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          package_id,
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
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Package doesn\'t exists',
        });
      }
      if (_package.dispatcher_id !== user.id) {
        return res.status(404).json({
          status: 404,
          error: 'You are not authorized to view this package details',
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'Package retreived successfully',
        data: _package,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method courier_preview_package
   * @memberof Package
   * @params req, res
   * @description Couriers can preview a package from the market place.
   * @return JSON object
   */

  static courier_preview_package(req, res) {
    const { package_id } = req.params;
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          package_id,
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
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Package doesn\'t exists',
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'Package retreived successfully',
        data: _package,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method customer_view_package
   * @memberof Package
   * @params req, res
   * @description Customers can view a package they own
   * @return JSON object
   */

  static customer_view_package(req, res) {
    const { user } = req.session;
    const { package_id } = req.params;
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          [Op.and]: [{ customer_id: user.id }, { package_id }],
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
      });
      if (!_package) {
        return res.status(401).json({
          status: 401,
          error: 'You cannot view this package',
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'Package retreived successfully',
        data: { ..._package },
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
   * @method customer_view_all_package
   * @memberof Package
   * @params req, res
   * @description Customers can view all packages they own
   * @return JSON object
   */

  static customer_view_all_package(req, res) {
    const { user } = req.session;
    const { status } = req.query;
    return Promise.try(async () => {
      let all_packages;
      if (!status) {
        all_packages = await Packages.findAll({
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
        });
      } else {
        all_packages = await Packages.findAll({
          where: {
            customer_id: user.id,
            status,
          },
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
   * @method courier_view_all_package
   * @memberof Package
   * @params req, res
   * @description Couriers can view all packages they dispatch
   * @return JSON object
   */

  static courier_view_all_package(req, res) {
    const { user } = req.session;
    const { status } = req.query;
    return Promise.try(async () => {
      let all_packages;
      if (!status) {
        all_packages = await Packages.findAll({
          where: {
            dispatcher_id: user.id,
          },
          attributes: {
            exclude: ['delivery_key']
          },
          include: [
            {
              model: Customers,
              as: 'customer',
            },
          ],
        });
      } else {
        all_packages = await Packages.findAll({
          where: {
            dispatcher_id: user.id,
            status,
          },
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
   * @method courier_view_marketplace
   * @memberof Package
   * @params req, res
   * @description Couriers can view all packages in the market place
   * @return JSON object
   */

   static courier_view_packages_in_marketplace(req, res) {
     return Promise.try( async () => {
       const { user } = req.session;
       let { from, state, to, dispatch_type } = req.query;
       if (!state) {
        state = user.state
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
          all_package_in_marketplace = await Packages.findAll({
            where: {
              [Op.or]: [
                  { from_state: state }, 
                  { to_state: state },
                  { from_town: from },
                  { type_of_dispatch: dispatch_type },
                  { dispatcher_id: null}
                ]
            },
            attributes: {
              exclude: ['delivery_key']
            }
          })
         }
        else {
          all_package_in_marketplace = await Packages.findAll({
            where: {
              [Op.and]: [
                  { from_state: state }, 
                  { to_state: state },
                  { from_town: from },
                  { to_town: to},
                  { type_of_dispatch: dispatch_type },
                  { dispatcher_id: null}
                ]
            },
            attributes: {
              exclude: ['delivery_key']
            }
          })
        }
       }

       if (dispatch_type === 'inter-state') {
         if (!to) {
            all_package_in_marketplace = await Packages.findAll({
              where: {
                [Op.and]: [
                    { from_state: from }, 
                    { type_of_dispatch: dispatch_type },
                    { dispatcher_id: null}
                  ]
              },
              attributes: {
                exclude: ['delivery_key']
              }
            })
         } else {
          all_package_in_marketplace = await Packages.findAll({
            where: {
              [Op.and]: [
                  { from_state: from }, 
                  { to_state: to },
                  { type_of_dispatch: dispatch_type },
                  { dispatcher_id: null}
                ]
            },
            attributes: {
              exclude: ['delivery_key']
            }
          })
         }
       }

       if (dispatch_type === 'international') {
         if(!to) {
           all_package_in_marketplace = await Packages.findAll({
             where: {
              [Op.and]: [
                  { from_country: from }, 
                  { type_of_dispatch: dispatch_type },
                  { dispatcher_id: null}
                ]
             },
             attributes: {
              exclude: ['delivery_key']
            }
           })
         } else {
          all_package_in_marketplace = await Packages.findAll({
            where: {
              [Op.and]: [
                  { from_country: from }, 
                  { type_of_dispatch: dispatch_type },
                  { to_country: to},
                  { dispatcher_id: null}
                ]
            },
            attributes: {
              exclude: ['delivery_key']
            }
          })
         }
       }

       return res.status(200).json({
         status: 200,
         message: 'package retrieved successfully',
         data: all_package_in_marketplace
       })
     }).catch((error) => {
      log(error);
      return res.status(400).json({
        status: 400,
        error,
      });
     })
   }

  /**
   * @method declinePickup
   * @memberof Package
   * @params req, res
   * @description Couriers can decline pickup if they fail to come to an agreement with a customer
   * @return JSON object
   */

  static declinePickup(req, res) {
    return Promise.try( async() => {
      const { decline_cause } = req.body;
      const { package_id } = req.query;
      const { user } = req.session;
      const NEW_NOTIFICATION = {
        type: 'customer',
      };

      const isFound = await Packages.findOne({ 
        where: {
          [Op.and]: [{ package_id}, {dispatcher_id: user.id}]
        }
      });
      if (!isFound) {
        return res.status(404).json({
          status: 404,
          error: 'Sorry, cannot decline a package you didn\'t pickup'
        })
      }
      if (isFound.status === 'tracking') {
        return res.status(400).json({
          status: 400,
          error: 'You cannot decline a package currently tracking'
        })
      }
      // update the dispatcher's pending;
      // and reduce their pick ups
      const current_pending_deliveries = parseInt(user.pending, 10) - 1;
      const current_pickups = parseInt(user.pickups, 10) - 1
      await Couriers.update({
        pending: current_pending_deliveries,
        pickups: current_pickups
      }, {
        where: {
          id: user.id
        }
      })
      // find the customer to create a notification;
      const customer = await Customers.findOne({
        where: {
          id: isFound.customer_id
        }
      })

      await Packages.update({
        dispatcher_id: null,
        status: 'not-picked',
        pickup_time: null,
        pickup_decline_cause: decline_cause,
        pending_delivery_price: null
      }, {
        where: {
        package_id
      }})

      NEW_NOTIFICATION.email = customer.email;
      NEW_NOTIFICATION.desc = 'CD009';
      NEW_NOTIFICATION.message = `A dispatcher just declined pickup for package with id: ${package_id}`,
      NEW_NOTIFICATION.title = 'New pickup decline';
      NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in

      await Notifications.create({ ...NEW_NOTIFICATION })

      return res.status(200).json({
        status: 200,
        message: 'You have successfully declined this pick-up'
      })

    })
    .catch((error) => {
      log(error);
      return res.status(400).json({
        status: 400,
        error
      })
    })
  }

  /**
   * @method allPackagePendingDispatchers
   * @memberof Package
   * @params req, res
   * @description Customers can get all pending dispatch requests in a package.
   * @return JSON object
   */

  static allPackagePendingDispatchers(req, res) {
    return Promise.try( async () => {
      const { package_id } = req.params;
      const _package = await Packages.findOne({
        where: {
          package_id
        }
      });
      if (!_package) return res.status(404).json({
        status: 404,
        message: 'Oops, seems this package doesn\'t exist anymore'
      });

      const pending_dispatchers = [];
      for(var i=0; i<_package.pending_dispatchers.length; i++) {
        let _dispatcher = await Couriers.findOne({
          where: {
            id: _package.pending_dispatchers[i]
          }
        });
        if (!_dispatcher) {
          continue;
        }
        pending_dispatchers.push(_dispatcher.getSafeDataValues());

        if (i === (_package.pending_dispatchers.length - 1)) {
          return res.status(200).json({
            status: 200,
            message: 'dispatchers retrieved successfully',
            data: pending_dispatchers
          })
        }
      }
    }).catch((error ) => {
      log(error);
      return res.status(400).json({
        status: 400,
        error
      });
    });
  }

  /**
   * @method startDispatch //Start Tracking
   * @memberof Package
   * @params req, res
   * @description Couriers can mark a package as tracking, this means they have started their journey to dispatch the package
   * @return JSON object
   */

  static startDispatch(req, res) {
    return Promise.try(async () =>{
      const {
        package_id,
        dispatcher_lat,
        dispatcher_lng
      } = req.params;
      const { user } = req.session;
      const NEW_NOTIFICATION = {
        type: 'customer',
      }
      let destination_lng, destination_lat;
      const _package = await Packages.findOne({ 
        where: {
          package_id
        }
      });

      if(!_package) return res.status(400).json({
        status: 400,
        message: 'Oops, seems package doesn\'t exist anymore'
      });

      if (_package.dispatcher_id !== user.id) {
        return res.status(400).json({
          status: 400,
          message: 'Sorry, cannot dispatch package you didn\'t pick up'
        })
      }

      const customer = await Customers.findOne({
        where: {
          id: _package.customer_id
        }
      });

      if (!customer) {
        return res.status(400).json({
          status: 400,
          message: 'Oops, seems the customer doesn\'t exist anymore'
        })
      }
      const result = await geoPackageDestination(_package);
 
      destination_lat = result[0].latitude;
      destination_lng = result[0].longitude;

      NEW_NOTIFICATION.email = customer.email;
      NEW_NOTIFICATION.desc = 'CD010';
      NEW_NOTIFICATION.message = `Your package with id: ${package_id} is now being dispatched`;
      NEW_NOTIFICATION.title = 'New Dispatch started';
      NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in

      // create push notifications.

      // create packages tracking.
      const new_package_tracking = {};
      new_package_tracking.package_id = package_id;
      new_package_tracking.customer_id = _package.customer_id;
      new_package_tracking.dispatcher_id = _package.dispatcher_id;
      new_package_tracking.dispatcher_lat = dispatcher_lat;
      new_package_tracking.dispatcher_lng = dispatcher_lng;
      new_package_tracking.destination_lat = destination_lat;
      new_package_tracking.destination_lng = destination_lng;


      await PackagesTrackings.create({ ...new_package_tracking });
      await Packages.update({
        is_currently_tracking: true,
        status: 'tracking',
      }, {
        where: {
        package_id
      }});
      await Notifications.create({ ...NEW_NOTIFICATION });

      const dataResponse = {
        package_id,
        dispatcher_lat,
        dispatcher_lng,
        customer_id,
      }

      return res.status(200).json({
        status: 200,
        message: 'You have successfully started this dispatch.',
        data: dataResponse
      })

    }).catch((error)=> {
      log(error);
      return res.status(400).json({
        status: 400,
        error
      });
    })
  }

  /**
   * @method allCurrentlyTrackingPackages
   * @memberof Package
   * @params req, res
   * @description Customers can get all their packages currently tracking
   * @return JSON object
   */

   static allCurrentlyTrackingPackages(req, res) {
     return Promise.try(async () => {
       const { user} = req.session;
       const _packages = await Packages.findAll({
         where: {
           [Op.and]: [{customer_id: user.id}, {is_currently_tracking: true}]
         }
       });

       return res.status(200).json({
         status: 200,
         message: 'Packages retrieved successfully',
         data: _packages
       })
     }).catch((err)=> {
       log(err);
       return res.status(400).json({
        status: 400,
        err
      });
     })
   }
  
  /**
   * @method deletePackage
   * @memberof Package
   * @params req, res
   * @description Customers can delete packages...
   * @return JSON object
   */

  static deletePackage(req, res) {
    return Promise.try(async () => { 
      const { package_id } = req.params;
      const { user } = req.session;

      // find the package;
      const _package = await Packages.findOne({
        where: {
          package_id
        }
      });

      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Oops, seems package has already been deleted'
        })
      }
      if (_package.customer_id !== user.id) {
        return res.status(401).json({
          status: 401,
          error: 'Not Authorized to delete this package'
        })
      }

      const benchmark = [
        'tracking',
        'picked-up'
      ];

      if (benchmark.includes(_package.status)) {
        return res.status(400).json({
          status: 400,
          error: 'Cannot delete a package that is currenty tracking or picked'
        })
      }

      if (_package.status === 'not-picked') {
        const delivery_price = _package.delivery_price;
        if (_package.payment_mode === 'virtual_balance') {
          const updated_V_A_B = Number(user.virtual_allocated_balance) - Number(delivery_price);
          await Customers.update({
            virtual_allocated_balance: updated_V_A_B
          }, {
            where: {
              id: user.id
            }
          });
        }
        if (_package.payment_mode === 'koogah_coin') {
          const KOOGAH_COIN_WORTH = process.env.KOOGAH_COIN_WORTH;
          const user_allocated_kc_balance = Number(KOOGAH_COIN_WORTH) * Number(user.virtual_allocated_kc_balance);
          let updated_V_A_KC_B = Number(user_allocated_kc_balance) - Number(delivery_price);
          updated_V_A_KC_B = updated_V_A_KC_B / KOOGAH_COIN_WORTH;

          await Customers.update({
            virtual_allocated_kc_balance: updated_V_A_KC_B
          }, {
              where: {
              id: user.id
            }
          })
        }
      }
      // delete package;
      await Packages.destroy({
        where: {
          package_id
        }
      });

      return res.status(200).json({
        status: 200,
        message: 'Package deleted successfully'
      })

    }).catch((err) => {
      log(err);
       return res.status(400).json({
        status: 400,
        err
      });
    })
  }

  /**
   * @method editPackage
   * @memberof Package
   * @params req, res
   * @description Customers can edit packages...
   * @return JSON object
   */

  static editPackage(req, res) {
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

      let type = data.type_of_dispatch;
      // same state
      if (type === 'intra-state') {
        data.to_state = data.from_state;
      }
      const origins = checkType('from', data, type);
      const destinations = checkType('to', data, type);
      distanceApi.matrix([origins], [destinations], async function (err, result) {
        try { 
          if (err) {
            throw new Error(err);
          } else {
            try {
              const distance_in_km = result.rows[0].elements[0].distance.text;
              const distance = Math.ceil(Number(distance_in_km.split(' ')[0].replace(',', '')));
              const delivery_price = calc_delivery_price(type, data.weight, distance);
              if (!delivery_price) {
                return res.status(400).json({
                  status: 400,
                  error: 'Weight must match one of ["0-5","6-10", "11-15", "16-25", "26-40", "50-100", "101-200", "201-300", "301-400", "401-500", "501>"],',
                });
              }
              if (payment_mode === 'virtual_balance') {
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
                if (Number(delivery_price) > Number(user.virtual_balance)) {
                  return res.status(400).json({
                    status: 400,
                    error: `You must top-up your account with at least ₦${Number(delivery_price) - Number(user.virtual_balance)} before editing this package`
                  })
                }
                // remove the previous delivery cost from the allocated virual balance
                // then compare with the user current virtual balance against the delivery price
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
    
              } else if (payment_mode === 'koogah_coin') {
                if (
                  payment_mode !== _package.payment_mode
                  && _package.payment_mode === 'virtual_balance'
                ) {
                  let updated_V_A_B = Number(user.virtual_allocated_balance) - Number(_package.delivery_price);
                  await Customers.update({
                    virtual_allocated_balance: updated_V_A_B
                  }, {
                    where: {
                      id: user.id
                    }
                  });
                }
                  // convert koogah coin to determine value;
                  // in Naira, it is worth 10 Naira.
                const KOOGAH_COIN_WORTH = process.env.KOOGAH_COIN_WORTH;
                const user_koogah_coin_balance = Number(KOOGAH_COIN_WORTH) * Number(user.koogah_coin);
                let user_allocated_kc_balance = Number(KOOGAH_COIN_WORTH) * Number(user.virtual_allocated_kc_balance);
                if (Number(delivery_price) > Number(user_koogah_coin_balance)) {
                  return res.status(400).json({
                    status: 400,
                    error: 'Sorry, you have insufficient KC balance to edit this package',
                  })
                }
                // subtract the user alloc kc balance from the delivery price
                if (user_allocated_kc_balance > 0) {
                  user_allocated_kc_balance = Number(user_allocated_kc_balance) - Number(_package.delivery_price);
                } 
                if ((Number(user_koogah_coin_balance) - Number(user_allocated_kc_balance)) < Number(delivery_price)) {
                  return res.status(400).json({
                    status: 400,
                    error: 'Sorry, you cannot complete this dispatch with Koogah coin, please use another payment mode'
                  })
                }
                let updated_V_A_KC_B = Number(user_allocated_kc_balance) + Number(delivery_price);
                updated_V_A_KC_B = updated_V_A_KC_B / KOOGAH_COIN_WORTH;
                await Customers.update({
                  virtual_allocated_kc_balance: updated_V_A_KC_B
                }, {
                    where: {
                    id: user.id
                  }
                })
              } else {
                return res.status(400).json({
                  status: 400,
                  error: 'Invalid payment mode'
                })
              }
              await Packages.update({
                distance,
                delivery_price,
                payment_mode,
                ...data
              }, {
                where: {
                  package_id,
                }
              })
              const updated_package = await Packages.findOne({
                where: {
                  package_id
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
               err
             });
            }
          }
        } catch (err) {
          log(err);
            return res.status(400).json({
             status: 400,
             err
           });
        }
      })

    }).catch((err) => {
      log(err);
      return res.status(400).json({
       status: 400,
       err
     });
     })
  }
  
  /**
   * @method getEstimate
   * @memberof Package
   * @params req, res
   * @description Customers can get estimates before creating packages
   * @return JSON object
   */

  static getEstimate(req, res) {
    return Promise.try(async () => {
      let { type } = req.params;
      const { ...data } = req.body;
      if (type.length <= 5) {
        type = `${type}-state`;
      }

      if (type === 'intra-state') {
        data.to_state = data.from_state;
      }
      const origins = checkType('from', data, type);
      const destinations = checkType('to', data, type);
      distanceApi.matrix([origins], [destinations], async function (err, result) { 
        try { 
          if (err) {
            throw new Error(err);
          } else {
            try { 
              const distance_in_km = result.rows[0].elements[0].distance.text;
              const distance = Math.ceil(Number(distance_in_km.split(' ')[0].replace(',', '')));
              const delivery_price = calc_delivery_price(type, data.weight, distance);
              if (!delivery_price) {
                return res.status(400).json({
                  status: 400,
                  error: 'Weight must match one of ["0-5","6-10", "11-15", "16-25", "26-40", "50-100", "101-200", "201-300", "301-400", "401-500", "501>"],',
                });
              }
              const dt = {
                delivery_price,
                ...data
              }
              return res.status(200).json({
                status: 200,
                data: dt
              })
            } catch (err) {
              log(err);
              return res.status(400).json({
               status: 400,
               err
             });
            }
          }
        } catch (err) {
          log(err);
          return res.status(400).json({
           status: 400,
           err
         });
        }
      });

    }).catch((err) => {
      log(err);
      return res.status(400).json({
       status: 400,
       err
     });
    })
  }

}


export default Package;
