/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
import { config } from 'dotenv';
import log from 'fancy-log';
import Sequelize from 'sequelize';
import {
  Notifications,
  Customers,
  Transactions,
} from '../../../database/models';
const cron = require('node-cron');
import moment from 'moment';
import Notifier from '../helpers/notifier';
import generatePromoCode from '../helpers/generate_promo_code';

const { Op } = Sequelize;
config();

const isProduction = process.env.NODE_ENV === 'production';
/**
 * @class PromoController
 */
// also used for global customer notification sending.
class PromoController {
  /**
   * @method globalPromo
   * @memberof Package
   * @params req, res
   * @description this method create a global promo code for all customers.
   * @return JSON object
   */

  static globalPromo(req, res) {
    return Promise.try(async () => {
      let {
        new_users_email,
        code,
        promo_message,
        promo_title,
        type, // promo or broadcast
        amount } = req.body;
      if (!type) {
        type = 'promo';
      }
      if (!code) {
        code = '';
      }
      if (!amount) {
        amount = 0.0;
      }
      const task = cron.schedule('1 * * * * *', async () => {
        if (new_users_email) {
          if (new_users_email.length > 0) {
            new_users_email.forEach(async (user_email) => {
              const u = await Customers.findOne({
                where: {
                  email: user_email,
                }
              });
              if (u) {
                // update the user promo code
                if (type === 'promo') {
                  if (!u.promo_code) {
                    await Customers.update(
                      {
                        promo_code: code,
                        promo_code_amount: amount
                      },
                      {
                        where: {
                          email: u.email,
                        }
                      }
                    );
                    // send the user notifications.
                    let NEW_NOTIFICATION = {};
                    NEW_NOTIFICATION.email = u.email;
                    NEW_NOTIFICATION.desc = 'CD013';
                    NEW_NOTIFICATION.message = `Hello ${u.first_name.toUpperCase()}, ${promo_message}`;
                    NEW_NOTIFICATION.title = promo_title;
                    NEW_NOTIFICATION.action_link = null;
                    NEW_NOTIFICATION.entity_id = null;
                    NEW_NOTIFICATION.is_viewable = false;
                    NEW_NOTIFICATION.type = 'customer';
                    const _notification = await Notifications.create({ ...NEW_NOTIFICATION });
                    // get all user unread notifications;
                    let timestamp_benchmark = moment().subtract(5, 'months').format();
                    let all_notifications = await Notifications.findAll({
                      where: {
                        [Op.and]: [{ email: u.email }, { type: 'customer' }],
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
                      u,
                      'customer',
                      device_notify_obj,
                      _notification,
                    );
                  }
                } else {
                  // send the user notifications.
                  let NEW_NOTIFICATION = {};
                  NEW_NOTIFICATION.email = u.email;
                  NEW_NOTIFICATION.desc = 'CD013';
                  NEW_NOTIFICATION.message = `Hello ${u.first_name.toUpperCase()}, ${promo_message}`;
                  NEW_NOTIFICATION.title = promo_title;
                  NEW_NOTIFICATION.action_link = null;
                  NEW_NOTIFICATION.entity_id = null;
                  NEW_NOTIFICATION.is_viewable = false;
                  NEW_NOTIFICATION.type = 'customer';
                  const _notification = await Notifications.create({ ...NEW_NOTIFICATION });
                    // get all user unread notifications;
                  let timestamp_benchmark = moment().subtract(5, 'months').format();
                  let all_notifications = await Notifications.findAll({
                    where: {
                      [Op.and]: [{ email: u.email }, { type: 'customer' }],
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
                    u,
                    'customer',
                    device_notify_obj,
                    _notification,
                  );
                }
              }
              if (u.email === new_users_email[new_users_email.length - 1]) {
                console.log('completed tasks');
                task.stop();
              }
            });
            return res.status(200).json({
              status: 200,
              message: 'Promo message scheduled for sending'
            })
          } else {
            return res.status(400).json({
              status: 400,
              message: 'Please insert proper data, or contact someone who can'
            })
          }
        }else {
          const all_customers = await Customers.findAll({
            where: {
              is_active: true,
            }
          });
          all_customers.forEach(async (u) => {
            if (u) {
              // update the user promo code
              if (type === 'promo') {
                if (!u.promo_code) {
                  await Customers.update(
                    {
                      promo_code: code,
                      promo_code_amount: amount
                    },
                    {
                      where: {
                        email: u.email,
                      }
                    }
                  );
                  // send the user notifications.
                  let NEW_NOTIFICATION = {};
                  NEW_NOTIFICATION.email = u.email;
                  NEW_NOTIFICATION.desc = 'CD013';
                  NEW_NOTIFICATION.message = `Hello ${u.first_name.toUpperCase()}, ${promo_message}`;
                  NEW_NOTIFICATION.title = promo_title;
                  NEW_NOTIFICATION.action_link = null;
                  NEW_NOTIFICATION.entity_id = null;
                  NEW_NOTIFICATION.is_viewable = false;
                  NEW_NOTIFICATION.type = 'customer';
                  const _notification = await Notifications.create({ ...NEW_NOTIFICATION });
                  // get all user unread notifications;
                  let timestamp_benchmark = moment().subtract(5, 'months').format();
                  let all_notifications = await Notifications.findAll({
                    where: {
                      [Op.and]: [{ email: u.email }, { type: 'customer' }],
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
                    u,
                    'customer',
                    device_notify_obj,
                    _notification,
                  );
                }
              } else {
              // send the user notifications.
              let NEW_NOTIFICATION = {};
              NEW_NOTIFICATION.email = u.email;
              NEW_NOTIFICATION.desc = 'CD013';
              NEW_NOTIFICATION.message = `Hello ${u.first_name.toUpperCase()}, ${promo_message}`;
              NEW_NOTIFICATION.title = promo_title;
              NEW_NOTIFICATION.action_link = null;
              NEW_NOTIFICATION.entity_id = null;
              NEW_NOTIFICATION.is_viewable = false;
              NEW_NOTIFICATION.type = 'customer';
              const _notification = await Notifications.create({ ...NEW_NOTIFICATION });
              // get all user unread notifications;
              let timestamp_benchmark = moment().subtract(5, 'months').format();
              let all_notifications = await Notifications.findAll({
                where: {
                  [Op.and]: [{ email: u.email }, { type: 'customer' }],
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
                u,
                'customer',
                device_notify_obj,
                _notification,
              );
              }
              if (u.email === all_customers[all_customers.length - 1].email) {
                console.log('completed tasks');
                task.stop();
              }
            }
          });
        }
      })
      return res.status(200).json({
        status: 200,
        message: 'Promo message scheduled for sending'
      })
    }).catch(err => {
      log(err);
        res.status(400).json({
          status: 400,
          error: err,
        });
    })
  }

  /**
   * @method individualPromo
   * @memberof Package
   * @params req, res
   * @description this method create an individual promo code for certain customers using their previous week top-ups.
   * @return JSON object
   */

  static individualPromo(req, res) {
    return Promise.try(async () => {
      const task = cron.schedule('1 * * * * *', async () => {
        const all_customers = await Customers.findAll({
          where: {
            is_active: true,
          }
        })
        all_customers.forEach(async (u) => {
          if (!u.promo_code) {
            // get their previous week top-ups
            const this_week_start = moment().clone().startOf('isoweek').format();
            const last_week_start = moment(this_week_start).subtract(1, 'week').format();
            let total_amount_paid = 0;
            const prev_week_top_ups = await Transactions.findAll({
              where: {
                [Op.and]: [
                  {
                    customer_id: u.id,
                  },
                  {
                    reason: 'top-up'
                  },
                  {
                    created_at: {
                      [Op.and]: [
                        {
                          [Op.gte]: last_week_start
                        },
                        {
                          [Op.lt]: this_week_start,
                        }
                      ]
                    }
                  }
                ]
              }
            });
            if (prev_week_top_ups.length > 0) {
              total_amount_paid = prev_week_top_ups.reduce((acc, curr) => {
                acc += Number(curr.amount_paid);
                return acc;
              }, 0)
              // get % off
              const promo_amount = total_amount_paid * process.env.INDIVIDUAL_PROMO_PERCENT_OFF;
              const promo_code = generatePromoCode();

              await Customers.update(
                {
                  promo_code: promo_code,
                  promo_code_amount: promo_amount,
                },
                {
                  where: {
                    email: u.email,
                  }
                }
              );

              // send the user notifications.
              let NEW_NOTIFICATION = {};
              NEW_NOTIFICATION.email = u.email;
              NEW_NOTIFICATION.desc = 'CD013';
              NEW_NOTIFICATION.message = `Congratulations!. Your weekly FREE delivery credit has arrived. Use it to make FREE deliveries today!. Enjoy!`;
              NEW_NOTIFICATION.title = 'Your weekly FREE delivery credit is here!. tap to see.';
              NEW_NOTIFICATION.action_link = null;
              NEW_NOTIFICATION.entity_id= null;
              NEW_NOTIFICATION.is_viewable = false;
              NEW_NOTIFICATION.type = 'customer';
              const _notification = await Notifications.create({ ...NEW_NOTIFICATION });
              // get all user unread notifications;
              let timestamp_benchmark = moment().subtract(5, 'months').format();
              let all_notifications = await Notifications.findAll({
                where: {
                  [Op.and]: [{ email: u.email }, { type: 'customer' }],
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
                u,
                'customer',
                device_notify_obj,
                _notification,
              );
            }
          }
          if (u.email === all_customers[all_customers.length - 1].email) {
            task.stop();
          }
        })
      })
      return res.status(200).json({
        status: 200,
        message: 'Promo messages scheduled for sending'
      })
    }).catch(err => {
      log(err);
      res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

  /**
   * @method usePromoCode
   * @memberof Package
   * @params req, res
   * @description this method allows a customer user their promo code
   * @return JSON object
   */

  static usePromoCode(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const { promo_code } = req.body;
      if (!promo_code) return res.status(400).json({
        status: 400,
        error: 'Promo code cannot be empty',
      });
      if (!user.promo_code) {
        return res.status(400).json({
          status: 400,
          error: 'You currently do not have any ongoing promo',
        });
      }
      if (user.promo_code !== promo_code) {
        return res.status(401).json({
          status: 401,
          error: 'You are not authorized to use this promo code',
        });
      }
      const new_updated_virtual_balance = Number(user.virtual_balance) + Number(user.promo_code_amount);
      await Customers.update(
        {
          virtual_balance: new_updated_virtual_balance,
          promo_code: '',
          promo_code_amount: 0.0
        },
        {
          where: {
            email: user.email,
          }
        }
      );
      return res.status(200).json({
        status: 200,
        message: `Your wallet has been credited with ₦${Intl.NumberFormat('en-IN').format(Number(user.promo_code_amount))}`,
      })
    }).catch(err => {
      log(err);
      res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

}

export default PromoController;