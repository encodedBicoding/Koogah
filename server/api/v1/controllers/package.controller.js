/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import Sequelize from 'sequelize';
import distanceApi from 'google-distance-matrix';
import log from 'fancy-log';
import uuid from 'uuid/v4';
import { config } from 'dotenv';
import moment from 'moment';
import checkType from '../helpers/check.type';
import calc_delivery_price from '../helpers/calc.price';
import generate_ref from '../helpers/ref.id';
import {
  Packages,
  Couriers,
  Notifications,
  Customers,
  PackagesTrackings,
  Transactions,
  HistoryTransactions,
  Companies,
  sequelize
} from '../../../database/models';
import PushNotify from '../../../PushNotifications';

import geoPackageDestination from '../helpers/geo-package-destination';
import Notifier from '../helpers/notifier';
import eventEmitter from '../../../EventEmitter';
import sendDeliverySMS from '../helpers/delivery_sms';
import { 
  sendNewPackageNotification,
  sendNewInterestInPackageNotification,
  sendInterestApprovedOrDeclinedNotification,
  sendDispatcherDeclinedPickupNotification,
  sendDispatcherStartsDispatchNotification,
  sendPackageDeliveredNotification
} from '../helpers/slack';
import sendMail, { createCompanyDispatcherApproveOrDecline, createDeliveryReceipt } from '../helpers/mail';
import { getCorporatePriceSlashed, getIndividualPriceSlashed } from '../helpers/slashed_delivery_price';

const cron = require('node-cron');

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
    let { weight, delivery_price, distance, value, ...data } = req.body;
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
    // calculate the distance between package pickup location
    // and package dropoff location
    return Promise.try(async () => {
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
      }else {
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
         value,
         distance,
         delivery_price,
         package_id,
         delivery_key,
         ...data,
       });
      const message = {
        pickup_state: data.from_state.split(',')[0],
        notification_id: Math.floor(Math.random() * 1234 * 60),
        detail: `new ${data.is_express_delivery ? 'EXPRESS' : ''} pickup @ ${data.from_town} area of ${data.from_state}. You might want to pick it up, do check it out!.`
      };
      const task = cron.schedule('1 * * * * *', () => {
        Package.sendNewPackageCreationToDispatchers(message, task);
      });
      sendNewPackageNotification(package_detail, user, data);

      // push event to all companies;
      let comp_m = `New ${data.is_express_delivery ? 'EXPRESS' : ''} pickup @ ${data.from_town} area of ${data.from_state}`;
      eventEmitter.emit('company_new_package_creation', {
        message: comp_m,
      })
      return res.status(200).json({
        status: 200,
        message: 'Package created successfully. Please wait, dispatchers will reach out to you soon',
        data: package_detail,
      });
    }).catch((error) => {
      log(error);
      return res.status(400).json({
       status: 400,
       error
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
          error: 'You have already indicated interest for this package. Please wait for the owner to approve you.',
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
          title: 'Interested dispatcher for package',
          entity_id: package_id,
          is_viewable: true,
          message: _package.pending_dispatchers.length <= 1 ? `A dispatcher is interested in your package with id: ${package_id} \nPlease ensure you checkout the dispatcher\'s profile first, before approving them.` : `Another dispatcher is interested in your package with id: ${package_id}. \nPlease ensure you checkout the dispatcher\'s profile first, before approving them.`,
          action_link: (isProduction) ? `${process.env.SERVER_APP_URL}/profile/courier/pv/${user.id}` : `http://localhost:4000/v1/profile/courier/pv/${user.id}`, // ensure customer is logged in
        };

        const _notification = await Notifications.create({ ...NEW_NOTIFICATION });

        // get all user unread notifications;
        let timestamp_benchmark = moment().subtract(5, 'months').format();

        let all_notifications = await Notifications.findAll({
          where: {
            [Op.and]: [{ email: customer.email }, { type: 'customer' }],
            created_at: {
              [Op.gte]:timestamp_benchmark
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
          customer,
          'customer',
          device_notify_obj,
          _notification
        );
        sendNewInterestInPackageNotification(package_id, user, customer)
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
      let MSG_OBJ;
      let company;
      if (response === 'approve') {
        const date_time = new Date().toLocaleString();
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
        NEW_NOTIFICATION.message = 'A customer has approved you to dispatch their package. \nPlease ensure you meet them at a safe zone or outside their doors and/or gate';
        NEW_NOTIFICATION.title = 'New Dispatch Approval';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
        eventEmitter.emit('package_approval', {
          dispatcherWSId: `dispatcher:${dispatcher.email}:${dispatcher.id}`,
          packageId: package_id,
          event: 'package_dispatch_approval'
        });
        if (dispatcher.is_cooperate === true) {
           company = await Companies.findOne({
            where: {
              id: dispatcher.company_id
            }
          });
          MSG_OBJ = {
            event: 'PICKUP',
            dispatcher: dispatcher,
            _package: _package,
            company: company,
          };
        }
      }
      if (response === 'decline') {
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
          eventEmitter.emit('package_after_pickup_decline', {
            dispatcherWSId: `dispatcher:${dispatcher.email}:${dispatcher.id}`,
            packageId: package_id,
            event: 'package_after_pickup_decline'
          });
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
        NEW_NOTIFICATION.desc='CD011';
        NEW_NOTIFICATION.message = `A customer has declined your request to dispatch their package with id: ${package_id}.`;
        NEW_NOTIFICATION.title = 'New Dispatch Decline';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in

        if (dispatcher.is_cooperate === true) {
          MSG_OBJ = {
            event: 'DECLINE',
            dispatcher: dispatcher,
            _package: _package,
            company: company,
          };
        }
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
        title: `${NEW_NOTIFICATION.title}`,
        body: `${NEW_NOTIFICATION.message}`,
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
      const res_message = `Successfully ${response === 'approve' ? 'approved' : 'declined'} dispatcher request`;
      sendInterestApprovedOrDeclinedNotification(response === 'approve', package_id, dispatcher);

      if (dispatcher.is_cooperate === true) {
        let msg = createCompanyDispatcherApproveOrDecline(MSG_OBJ);
        sendMail(msg);
        // create an inapp notification for company.
        const COMPANY_IN_APP_NOTIFICATION = {
          type: 'company',
          title: NEW_NOTIFICATION.title,
          desc: MSG_OBJ.event === 'DECLINE' ? 'CD011' : 'CD005',
          entity_id: package_id,
          is_viewable: true,
          email: company.email,
          message: `Your dispatcher: ${dispatcher.first_name} ${dispatcher.last_name} \n, has just been ${MSG_OBJ.event === 'DECLINE' ? 'Declined from delivering a package' : 'Approved to deliver a package'}`
        }

        await Notifications.create({ ...COMPANY_IN_APP_NOTIFICATION });

        let all_company_notifications = await Notifications.findAll({
          where: {
            [Op.and]: [
              {
                email: company.email,
              },
              {
                is_read: false,
              },
              {
                type: 'company'
              }
            ],
            created_at: {
              [Op.gte]: timestamp_benchmark
            }
          }
        })

        eventEmitter.emit('new_company_notification', {
          companyWSId: `company:${company.email}:${company.id}`,
          event: 'new_company_notification',
          data: all_company_notifications,
        });

      }
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
          error: 'You are not allowed to perform this action',
        });
      }
      const new_delivery_price = calc_delivery_price(
        _package.type_of_dispatch,
        new_weight,
        _package.distance,
        _package.value
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
          entity_id: package_id,
          is_viewable: true,
          type: 'customer',
          desc: 'CD006',
          message: `The approved dispatcher for package with id: ${package_id} has requested a change of weight for this package`,
          title: 'New weight change',
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
      // validate delivery key;
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
          error: 'Invalid delivery key'
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
          error: 'Delivery key is wrong, please contact the person who requested the delivery'
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
      if (!user.is_currently_dispatching) { 
        return res.status(400).json({
          status: 400,
          error: 'You cannot deliver a package, when you are not dispatching any'
        })
      }

      const customer = await Customers.findOne({
        where: {
          id: _package.customer_id,
        },
      });

      const sms_charge = 50;
      const transfer_charge = 10;
      const user_new_delivery_count = parseInt(user.deliveries, 10) + 1;
      const user_new_pending_count = parseInt(user.pending, 10) - 1;
      let fees = 0;
      if (user.is_cooperate) {
        fees = (Number(_package.delivery_price) * Number(process.env.COMPANY_PACKAGE_DELIVERY_FEE)) + sms_charge + transfer_charge;
      } else {
        fees = (Number(_package.delivery_price) * Number(process.env.PACKAGE_DELIVERY_FEE)) + sms_charge + transfer_charge;
      }
      const total_amount_payable = Number(_package.delivery_price) - Math.ceil(fees);
      const dispatcher_new_balance = Number(user.virtual_balance) + total_amount_payable;

      const transaction_details = {
        customer_id: customer.id,
        dispatcher_id: user.id,
        amount_paid: _package.delivery_price,
        reason: 'dispatch-payment',
        fees,
        payment_mode: 'in-app',
        package_id: _package.package_id
      };

      // pay the dispatcher
      if (_package.payment_mode === 'virtual_balance') {
        const customer_remaining_balance = Number(customer.virtual_balance) - Number(_package.delivery_price);
        const customer_remaining_allocated_balance = Number(customer.virtual_allocated_balance) - Number(_package.delivery_price);
        await Customers.update({
          virtual_balance: customer_remaining_balance,
          virtual_allocated_balance: customer_remaining_allocated_balance
        },
        {
          where: {
            email: customer.email,
          },
        });

      } else if (_package.payment_mode === 'koogah_coin') {
        const KOOGAH_COIN_WORTH = process.env.KOOGAH_COIN_WORTH;
        const customer_koogah_coin_balance = Number(KOOGAH_COIN_WORTH) * Number(customer.koogah_coin);
        const customer_allocated_kc_balance = Number(KOOGAH_COIN_WORTH) * Number(customer.virtual_allocated_kc_balance);
        let customer_remaining_kc_balance = Math.floor(Number(customer_koogah_coin_balance) - Number(_package.delivery_price));
        customer_remaining_kc_balance = Math.floor(customer_remaining_kc_balance / KOOGAH_COIN_WORTH);

        let customer_remaining_alloc_kc_balance = Number(customer_allocated_kc_balance) - Number(_package.delivery_price);
        customer_remaining_alloc_kc_balance = Number(customer_remaining_alloc_kc_balance) / KOOGAH_COIN_WORTH;

        await Customers.update({
          koogah_coin: customer_remaining_kc_balance,
          virtual_allocated_kc_balance: customer_remaining_alloc_kc_balance
        }, {
          where: {
            email: customer.email
          }
        });
      }
      
      await Couriers.update({
        deliveries: user_new_delivery_count,
        pending: user_new_pending_count,
        is_currently_dispatching: false,
        virtual_balance: dispatcher_new_balance,
      },
      {
        where: {
          email: user.email,
        },
      });

      // end pay dispatcher
      const date_time = new Date().toLocaleString();
      await Packages.update({
        status: 'delivered',
        is_currently_tracking: false,
        is_paid_for: true,
        dropoff_time: date_time,
        pending_dispatchers: [],
      },
      {
        where: {
          package_id,
        },
        });
      await PackagesTrackings.destroy({
        where: {
          package_id,
        }
      })
      
      const new_transaction = await Transactions.create({ ...transaction_details });
      const history_customer = {
        amount: _package.delivery_price,
        type: 'debit',
        title: 'Payment for delivery',
        description: `Package ID: ${_package.package_id} delivery payment`,
        user_type: 'customer',
        user_id: customer.id,
        transaction_id: new_transaction.id,
        image_url: _package.image_urls[0]
      };
      const history_dispatcher = {
        amount: total_amount_payable,
        type: 'credit',
        title: 'Payment for delivery',
        description: `Package ID: ${_package.package_id} delivery payment`,
        user_type: 'dispatcher',
        user_id: user.id,
        transaction_id: new_transaction.id,
        image_url: _package.image_urls[0]
      };

      await HistoryTransactions.create({ ...history_customer });
      await HistoryTransactions.create({ ...history_dispatcher });

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
              'is_verified',
              'is_currently_dispatching'
            ],
          },
        ],
      });
      const NEW_NOTIFICATION = {
        email: customer.email,
        type: 'customer',
        desc: 'CD008',
        entity_id: package_id,
        is_viewable: true,
        message: `Package with ID:${package_id} has been delivered, you have also been debited`,
        title: 'New Package Delivered',
        action_link: (isProduction) ? `${process.env.SERVER_APP_URL}/package/owner/view/${package_id}` : `http://localhost:4000/v1/package/owner/view/${package_id}`, // ensure customer is logged in TODO: fix action link
      };

      const NEW_DELIVERY_NOTIFICATION = {
        email: user.email,
        type: 'courier',
        desc: 'CD003',
        entity_id: null,
        is_viewable: true,
        message: `You have successfully delivered package with ID: ${package_id}, and you have been credited.`,
        title: 'New payment for delivery',
        action_link: (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`,
      };
      const _notification = await Notifications.create({ ...NEW_NOTIFICATION });
      const _deliveryNotification = await Notifications.create({ ...NEW_DELIVERY_NOTIFICATION });
      // get all user unread notifications;
      let timestamp_benchmark = moment().subtract(5, 'months').format();
      let all_notifications = await Notifications.findAll({
        where: {
          [Op.and]: [{ email: customer.email }, { type: 'customer' }],
          created_at: {
            [Op.gte]: timestamp_benchmark
          }
        }
      });
      let all_dispatcher_notifications = await Notifications.findAll({
        where: {
          [Op.and]: [{ email: user.email }, { type: 'dispatcher' }],
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
      const dispatcher_device_notify_obj = {
        title: NEW_DELIVERY_NOTIFICATION.title,
        body: NEW_DELIVERY_NOTIFICATION.message,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        icon: 'ic_launcher'
      };
      await Notifier(
        all_notifications,
        customer,
        'customer',
        device_notify_obj,
        _notification
      );
      await Notifier(
        all_dispatcher_notifications,
        user,
        'dispatcher',
        dispatcher_device_notify_obj,
        _deliveryNotification
      );
      eventEmitter.emit('unsubscribe', {
        userType: 'customer',
        userId: customer.id,
        channel: `customer:${package_id}:${customer.email}`,
        connectionId: `customer:${customer.email}:${customer.id}`,
        event: 'unsubscribe_from_package'
      });
      eventEmitter.emit('unsubscribe', {
        userType: 'dispatcher',
        userId: user.id,
        channel: `customer:${package_id}:${customer.email}`,
        connectionId: `dispatcher:${user.email}:${user.id}`,
        event: 'unsubscribe_from_package'
      });
      sendPackageDeliveredNotification(package_id, user, customer);
      if (user.is_cooperate === true) {
        const company = await Companies.findOne({
          where: {
            id: user.company_id,
          }
        });
        let MSG_OBJ = {
          event: 'PAYMENT',
          company,
          dispatcher: user,
          _package: updated_package,
        }
        let msg = createCompanyDispatcherApproveOrDecline(MSG_OBJ);
        sendMail(msg);

        // create an inapp notification for company.
        const COMPANY_IN_APP_NOTIFICATION = {
          type: 'company',
          title: NEW_NOTIFICATION.title,
          desc: 'CD008',
          entity_id: package_id,
          is_viewable: true,
          email: company.email,
          message: `Your dispatcher ${user.first_name} ${user.last_name} \n, has just completed a delivery.`,
        }
        await Notifications.create({ ...COMPANY_IN_APP_NOTIFICATION });

        let all_company_notifications = await Notifications.findAll({
          where: {
            [Op.and]: [
              {
                email: company.email,
              },
              {
                is_read: false,
              },
              {
                type: 'company'
              }
            ],
            created_at: {
              [Op.gte]: timestamp_benchmark
            }
          }
        })

        eventEmitter.emit('new_company_notification', {
          companyWSId: `company:${company.email}:${company.id}`,
          event: 'new_company_notification',
          data: all_company_notifications,
        });
        
      }

      // send receipt to customer;
      let receipt_obj = {
        customer,
        _package: updated_package,
        dispatcher: user,
      };

      let receipt_msg = createDeliveryReceipt(receipt_obj);
      sendMail(receipt_msg);

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
        return res.status(401).json({
          status: 401,
          error: 'You are not authorized to view this package details',
        });
      }
      // work on delivery price response;
      const packageRes = {
        ..._package.dataValues,
        main_delivery_price: _package.delivery_price,
        delivery_price: user.is_cooperate ? getCorporatePriceSlashed(_package.delivery_price) : getIndividualPriceSlashed(_package.delivery_price),
      }
      return res.status(200).json({
        status: 200,
        message: 'Package retreived successfully',
        data: packageRes,
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
        data: _package,
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
    let { status, offset } = req.query;
    return Promise.try(async () => {
      let all_packages;
      if (!offset) {
        offset = 0;
      }
      if (status === undefined  || status == 'all') {
        all_packages = await Packages.findAll({
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
        all_packages = await Packages.findAll({
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
          all_package_in_marketplace = await Packages.findAll({
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
                    to_state: {
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
          all_package_in_marketplace = await Packages.findAll({
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
            all_package_in_marketplace = await Packages.findAll({
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
          all_package_in_marketplace = await Packages.findAll({
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
           all_package_in_marketplace = await Packages.findAll({
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
          all_package_in_marketplace = await Packages.findAll({
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
       return res.status(200).json({
         status: 200,
         message: 'packages retrieved successfully',
         data: all_package_in_marketplace,
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

      // remove user from the package pending dispatchers.
      let pending_dispatchers = isFound.pending_dispatchers;
      const idx = pending_dispatchers.findIndex((d) => d === user.id);
      pending_dispatchers.splice(idx, 1);

      await Packages.update({
        dispatcher_id: null,
        status: 'not-picked',
        pickup_time: null,
        pickup_decline_cause: decline_cause,
        pending_delivery_price: null,
        pending_dispatchers,
      }, {
        where: {
        package_id
      }})

      NEW_NOTIFICATION.email = customer.email;
      NEW_NOTIFICATION.desc = 'CD009';
      NEW_NOTIFICATION.entity_id = package_id;
      NEW_NOTIFICATION.is_viewable = true;
      NEW_NOTIFICATION.message = `A dispatcher just declined pickup for package with id: ${package_id}`,
      NEW_NOTIFICATION.title = 'New pickup decline';
      NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in

      const _notification = await Notifications.create({ ...NEW_NOTIFICATION });
      // get all user unread notifications;
      let timestamp_benchmark = moment().subtract(5, 'months').format();
      let all_notifications = await Notifications.findAll({
        where: {
          [Op.and]: [{ email: customer.email }, { type: 'customer' }],
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
        customer,
        'customer',
        device_notify_obj,
        _notification
      );
      sendDispatcherDeclinedPickupNotification(package_id, decline_cause, user)
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
        error: 'Oops, seems this package doesn\'t exist anymore'
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
            data: pending_dispatchers.sort((a, b) => (a.is_currently_dispatching > b.is_currently_dispatching) ? 1 : -1),
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
      } = req.params;

      const {
        dispatcher_lat,
        dispatcher_lng
      } = req.body;
      
      const { user } = req.session;
      let timestamp_benchmark = moment().subtract(5, 'months').format();

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
        error: 'Oops, seems package doesn\'t exist anymore'
      });

      if (_package.dispatcher_id !== user.id) {
        return res.status(400).json({
          status: 400,
          error: 'Sorry, cannot dispatch package you didn\'t pick up'
        })
      }
      if (_package.status === 'delivered') {
        return res.status(400).json({
          status: 400,
          error: 'Sorry, this package has already been delivered'
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
          error: 'Oops, seems the customer doesn\'t exist anymore'
        })
      }
      const result = await geoPackageDestination(_package);
 
      destination_lat = result[0].latitude;
      destination_lng = result[0].longitude;

      NEW_NOTIFICATION.email = customer.email;
      NEW_NOTIFICATION.desc = 'CD010';
      NEW_NOTIFICATION.entity_id = package_id;
      NEW_NOTIFICATION.is_viewable = true;
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
        }
      });
      await Couriers.update({
        is_currently_dispatching: true,
      }, {
        where: {
          email: user.email,
        }
      })
      if (user.is_cooperate === true) {
        const company = await Companies.findOne({
          where: {
            id: user.company_id,
          }
        });
        const COMPANY_IN_APP_NOTIFICATION = {
          type: 'company',
          title: 'New Dispatch started',
          desc: 'CD010',
          entity_id: package_id,
          is_viewable: true,
          email: company.email,
          message: `Your dispatcher ${user.first_name} ${user.last_name}\nJust started a new dispatch`,
        };

        await Notifications.create({ ...COMPANY_IN_APP_NOTIFICATION });
        let all_company_notifications = await Notifications.findAll({
          where: {
            [Op.and]: [
              {
                email: company.email,
              },
              {
                is_read: false,
              },
              {
                type: 'company'
              }
            ],
            created_at: {
              [Op.gte]: timestamp_benchmark
            }
          }
        });
        eventEmitter.emit('new_company_notification', {
          companyWSId: `company:${company.email}:${company.id}`,
          data: all_company_notifications,
        });

        eventEmitter.emit('new_company_dispatcher_tracking', {
          companyId: company.id,
        });
      }
      const _notification = await Notifications.create({ ...NEW_NOTIFICATION });
      // get all user unread notifications;

      let all_notifications = await Notifications.findAll({
        where: {
          [Op.and]: [{ email: customer.email }, { type: 'customer' }],
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
        customer,
        'customer',
        device_notify_obj,
        _notification
      );

      const dataResponse = {
        package_id,
        dispatcher_lat,
        dispatcher_lng,
        customer_id: _package.customer_id,
      }
      sendDispatcherStartsDispatchNotification(package_id, user, _package)
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
          error: 'Cannot delete a package that is currenty tracking or picked up'
        })
      }

      // if package can be deleted...
      // ensure it's removal from ws connected channel;

      // package channel id;
      let user_ws_channels = user.ws_connected_channels;
      const channel_id = `customer:${_package.package_id}:${user.email}`;
      const p_idx = user_ws_channels.findIndex((c) => c === channel_id);
      if (p_idx !== -1) {
        user_ws_channels.splice(p_idx, 1);
      }

      if (_package.status === 'not-picked') {
        const delivery_price = _package.delivery_price;
        if (_package.payment_mode === 'virtual_balance') {
          const updated_V_A_B = Number(user.virtual_allocated_balance) - Number(delivery_price);
          await Customers.update({
            virtual_allocated_balance: updated_V_A_B,
            ws_connected_channels: user_ws_channels
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
            virtual_allocated_kc_balance: updated_V_A_KC_B,
            ws_connected_channels: user_ws_channels
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
              const delivery_price = calc_delivery_price(type, data.weight, distance, data.value);
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

               
              } else if (payment_mode === 'koogah_coin') {
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
                });
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

    }).catch((err) => {
      log(err);
      return res.status(400).json({
       status: 400,
       error: err,
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
      distanceApi.matrix([origins], [destinations] , async function (err, result) { 
        try { 
          if (err) {
            throw new Error(err);
          } else {
            try { 
              const distance_in_km = result.rows[0].elements[0].distance.text;
              const distance = Math.ceil(Number(distance_in_km.split(' ')[0].replace(',', '')));
              const delivery_price = data.is_express_delivery ? Math.ceil(calc_delivery_price(type, data.weight, distance, data.value) * 2.5) : calc_delivery_price(type, data.weight, distance, data.value);
              if (!delivery_price) {
                return res.status(400).json({
                  status: 400,
                  error: 'Weight must match one of ["0-5","6-10", "11-15", "16-25", "26-40", "50-100", "101-200", "201-300", "301-400", "401-500", "501>"],',
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
            } catch (err) {
              log(err);
              return res.status(400).json({
               status: 400,
               error: 'An error occurred, please try again',
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
      });

    }).catch((err) => {
      log(err);
      return res.status(400).json({
       status: 400,
        error: err,
     });
    })
  }

  /**
   * @method singleTracking
   * @memberof Package
   * @params req, res
   * @description Couriers can get a package they are currently dispatching/tracking
   * @return JSON object
   */

  static async singleTracking(req, res) {
    return Promise.try(async () => { 
      const { user } = req.session;
      const { package_id } = req.params;
      const _package = await PackagesTrackings.findOne({
        where: {
          [Op.and]: [{ package_id }, {dispatcher_id: user.id}]
        },
        include: [
          {
            model: Customers,
            as: 'customer',
            attributes: [
              'id',
              'first_name',
              'last_name',
              'profile_image',
              'mobile_number_one',
              'mobile_number_two',
              'rating',
              'email',

            ]
          }
        ]
      });

      if (!_package) {
        return res.status(400).json({
          status: 400,
          error: 'No tracking package found with this id'
        })
      }
      return res.status(200).json({
        status: 200,
        message: 'Package retrieved successfully',
        data: _package
      })

    }).catch((err) => {
      log(err);
      return res.status(400).json({
       status: 400,
        error: err,
     });
    })
  }

  /**
   * @method allTrackingPackages
   * @memberof Package
   * @params req, res
   * @description Customers app get all tracking packages
   * @return JSON object
   */

  static async allTrackingPackages(req, res) { 
    return Promise.try(async () => {
      const { user } = req.session;
      const allTrackings = await PackagesTrackings.findAll({
        where: {
          customer_id: user.id
        }
      });

      return res.status(200).json({
        status: 200,
        data: allTrackings,
        message: 'Packages retrieved successfully'
      })
    }).catch((err) => { 
      log(err);
      return res.status(400).json({
       status: 400,
        error: err,
     });
    });
  }

  /**
   * @method sendDeliverySMSAction
   * @memberof Package
   * @params req, res
   * @description Customers send delivry key to dispatcher.
   * @return JSON object
   */

  static async sendDeliverySMSAction(req, res) {
    return Promise.try(async () => {
      const {
        delivery_key,
        mobile_number,
      } = req.body;
      const message = `New package delivery key:\n${delivery_key}`;
      await sendDeliverySMS(mobile_number, message);
      return res.status(200).json({
        status: 200,
        message: 'Delivery key has been sent to dispatcher'
      })
    }).catch((err) => { 
      log(err);
      return res.status(400).json({
       status: 400,
        error: err,
     });
    });
  }

  /**
   * @method sendNewPackageCreationToDispatchers
   * @memberof Package
   * @params req, res
   * @description Customers new package creation to dispatcher.
   * @return JSON object
   */
  static sendNewPackageCreationToDispatchers(msg, task) {
    return Promise.try(async() => {
      const allDispatchers = await Couriers.findAll({
        where: {
          is_verified: true,
          is_active: true,
          is_approved: true,
          state: msg.pickup_state,
        }
      });
      let timestamp_benchmark = moment().subtract(5, 'months').format();
      allDispatchers.forEach(async (dispatcher) => {
        let all_notifications = await Notifications.findAll({
          where: {
            [Op.and]: [{ email: dispatcher.email }, { type: 'courier' }],
            created_at: {
              [Op.gte]:timestamp_benchmark
            }
          }
        });
        const device_notify_obj = {
          title: 'New Pickup - Koogah',
          body: `Hi ${dispatcher.first_name.trim().toUpperCase()}, ${msg.detail}`,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          icon: 'ic_launcher'
        };
        const _notification = {
          email: dispatcher.email,
          desc: 'CD012',
          message: `Hi ${dispatcher.first_name.trim().toUpperCase()}, ${msg.detail}`,
          title: 'New Pickup - Koogah',
          action_link: '',
          id: msg.notification_id,
        };
        await Notifier(
          all_notifications,
          dispatcher,
          'dispatcher',
          device_notify_obj,
          _notification
        );
        if (dispatcher.id === allDispatchers[allDispatchers.length - 1].id) {
          console.log('done');
          task.stop();
        }
      });
    }).catch(err => {
      log(err);
    });
   }
}


export default Package;
