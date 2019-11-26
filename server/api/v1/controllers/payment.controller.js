/* eslint-disable max-len */
/* eslint-disable camelcase */
import fetch from 'node-fetch';
import log from 'fancy-log';
import Sequelize from 'sequelize';
import { config } from 'dotenv';
import {
  Customers, Transactions, Couriers, Packages, Notifications,
} from '../../../database/models';
import client from '../../../redis/redis.client';

config();
const isProduction = process.env.NODE_ENV === 'production';
const { Op } = Sequelize;
/**
 * @class Payment
 * @description Defines methods to allow a customer pay for services and credit their account.
 */
class Payment {
  /**
   * @method topup_virtual_balance_StepOne
   * @memberof Payment
   * @params req, res
   * @description this method allows a customer add money to their virtual balance
   * @return JSON object
   */

  static topup_virtual_balance_StepOne(req, res) {
    // initializes paystack transaction.
    // returns access code to be used by the paystack React native module
    // returns amount
    // returns user email
    // get payment details first.
    const { user } = req.session;
    const { amount } = req.body;
    if (parseInt(amount, 10) < 500.00) {
      return res.status(400).json({
        status: 400,
        error: 'You cannot deposit amount below 500 Naira',
      });
    }
    const paystack_kobo_amount = parseInt(amount, 10) * 100;

    const data = {
      amount: JSON.stringify(paystack_kobo_amount),
      email: user.email,
    };
    return Promise.try(() => {
      fetch('https://api.paystack.co/transaction/initialize/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_TEST_SECRET_KEY}`,
          'Content-type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then((resp) => resp.json())
        .then((result) => {
          client.set(`${result.data.reference}`, amount);
          return res.status(200).json({
            status: 200,
            message: 'Authorization URL created',
            data: {
              amount,
              customer_email: user.email,
              ...result.data,
            },
          });
        })
        .catch((err) => {
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
   * @method topup_virtual_balance_StepTwo
   * @memberof Payment
   * @params req, res
   * @description this method allows a customer add money to their virtual balance
   * @return JSON object
   */

  static topup_virtual_balance_StepTwo(req, res) {
    // use access code sent in step one
    // pay with RN chargeCardWithAccessCode
    // before calling this endpoint
    const { user } = req.session;
    const { reference } = req.query;
    return Promise.try(async () => client.get(`${reference}`, async (err, result) => {
      if (!result) {
        return res.status(404).json({
          status: 404,
          error: 'No transaction started with that reference',
        });
      }
      const amount = result;
      const top_up_data = {
        customer_id: user.id,
        amount_paid: amount,
        reason: 'top-up',
        fees: 0.00,
        reference_id: reference,
      };
        // check if the transaction already exists
      const isFound = await Transactions.findOne({
        where: {
          reference_id: reference,
        },
      });
      if (isFound) {
        return res.status(400).json({
          status: 400,
          error: 'Your account has already been credited',
        });
      }
      let refering_user;
      let virtual_balance;
      const total_user_balance = parseInt(user.virtual_balance, 10) + parseInt(amount, 10);
      // if the customer was referred by another user
      // first check if the user is a customer
      // if not, check if the user is a courier
      if (user.refered_by !== null) {
        refering_user = await Customers.findOne({
          where: {
            referal_id: user.refered_by,
          },
        });
        if (!refering_user) {
          refering_user = await Couriers.findOne({
            where: {
              referal_id: user.refered_by,
            },
          });
          if (refering_user) {
            virtual_balance = parseInt(refering_user.virtual_balance, 10) + 200.00;
            await Couriers.update({
              virtual_balance,
            },
            {
              where: {
                referal_id: user.refered_by,
              },
            });
            await Customers.update({
              refered_by: null,
            },
            {
              where: {
                email: user.email,
              },
            });
          }
        } else {
          virtual_balance = parseInt(refering_user.virtual_balance, 10) + 200.00;
          await Customers.update({
            virtual_balance,
          },
          {
            where: {
              referal_id: user.refered_by,
            },
          });
          await Customers.update({
            refered_by: null,
          },
          {
            where: {
              email: user.email,
            },
          });
        }
      }
      // update virtual balance of customer who paid in money
      await Customers.update({
        virtual_balance: total_user_balance,
      }, {
        where: {
          email: user.email,
        },
      });
      const transaction_detail = await Transactions.create({ ...top_up_data });
      // send a notification to koogah business email address
      // informing them a customer just paid to their paystack account
      const NEW_NOTIFICATION = {
        type: 'customer',
        email: user.email,
        message: `Your top-up of N${amount} was successfull.`,
        title: 'New successfull topup',
      };
      await Notifications.create({ ...NEW_NOTIFICATION });
      return res.status(200).json({
        status: 200,
        message: 'Balance top up successful',
        transaction_detail,
      });
    })).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method pay_dispatcher
   * @memberof Payment
   * @params req, res
   * @description this method allows a customer to pay a dispatcher for their services.
   * @return JSON object
   */

  static pay_dispatcher(req, res) {
    const { user } = req.session;
    const {
      package_id,
    } = req.params;
    return Promise.try(async () => {
      const isFound = await Transactions.findOne({
        where: {
          [Op.and]: [{ package_id }],
        },
      });
      if (isFound) {
        return res.status(400).json({
          status: 400,
          error: 'Oops, seems you have already paid this dispatcher for this package',
        });
      }
      const is_package_valid = await Packages.findOne({
        where: {
          package_id,
        },
      });
      if (!is_package_valid) {
        return res.status(404).json({
          status: 404,
          error: 'No package found with the specified id',
        });
      }
      if (parseInt(user.virtual_balance, 10) < parseInt(is_package_valid.delivery_price, 10)) {
        return res.status(400).json({
          status: 400,
          error: 'Insufficient balance. Please top-up your account',
        });
      }
      const customer_remaining_balance = parseInt(user.virtual_balance, 10) - parseInt(is_package_valid.delivery_price, 10);
      // get dispatcher to update their account + minus the 20 percent charge.
      const dispatcher = await Couriers.findOne({
        where: {
          id: is_package_valid.dispatcher_id,
        },
      });
      if (!dispatcher) {
        return res.status(404).json({
          status: 404,
          error: 'Oops, seems this dispatcher doesn\'t exists anymore...',
        });
      }
      const fees = parseInt(is_package_valid.delivery_price, 10) * 0.2;
      const total_amount_payable = parseInt(is_package_valid.delivery_price, 10) - fees;
      const dispatcher_new_balance = parseInt(dispatcher.virtual_balance, 10) + total_amount_payable;

      const transaction_details = {
        customer_id: user.id,
        dispatcher_id: is_package_valid.dispatcher_id,
        amount_paid: is_package_valid.delivery_price,
        reason: 'dispatch-payment',
        fees,
        payment_mode: 'in-app',
        package_id,
      };

      await Customers.update({
        virtual_balance: customer_remaining_balance,
      },
      {
        where: {
          email: user.email,
        },
      });

      await Couriers.update({
        virtual_balance: dispatcher_new_balance,
      },
      {
        where: {
          email: dispatcher.email,
        },
      });
      const NEW_NOTIFICATION = {
        email: dispatcher.email,
        type: 'courier',
        message: `A customer just paid you N${is_package_valid.delivery_price} to deliver a package with id: ${package_id}`,
        title: 'New payment for delivery',
        action_link: (isProduction) ? `https://api.koogah.com/v1/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`, // ensure courier is logged in
      };
      await Notifications.create({ ...NEW_NOTIFICATION });
      const new_transaction = await Transactions.create({ ...transaction_details });
      return res.status(200).json({
        status: 200,
        message: 'Dispatcher paid sucessfully',
        data: new_transaction,
      });
    })
      .catch((err) => {
        log(err);
        return res.status(400).json({
          status: 400,
          error: err,
        });
      });
  }
}

export default Payment;
