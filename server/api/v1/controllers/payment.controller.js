/* eslint-disable max-len */
/* eslint-disable camelcase */
import fetch from 'node-fetch';
import log from 'fancy-log';
import Sequelize from 'sequelize';
import { config } from 'dotenv';
import {
  Customers, Transactions, Couriers, Packages,
} from '../../../database/models';

config();
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
        .then((result) => res.status(200).json({
          status: 200,
          message: 'Authorization URL created',
          data: {
            amount,
            customer_email: user.email,
            ...result.data,
          },
        }))
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
    const { user } = req.session;
    const { amount, reference } = req.query;
    const top_up_data = {
      customer_id: user.id,
      amount_paid: amount,
      reason: 'top-up',
      fees: 0.00,
      reference_id: reference,
    };
    const total_user_balance = parseInt(user.virtual_balance, 10) + parseInt(amount, 10);
    return Promise.try(async () => {
      await Customers.update({
        virtual_balance: total_user_balance,
      }, {
        where: {
          email: user.email,
        },
      });
      const isFound = await Transactions.findOne({
        where: {
          reference_id: reference,
        },
      });
      if (isFound) {
        return res.status(400).json({
          status: 400,
          error: 'This transaction already exists',
        });
      }
      const transaction_detail = await Transactions.create({ ...top_up_data });
      // send a notification to koogah business email address
      // informing them a customer just paid to their paystack account
      return res.status(200).json({
        status: 200,
        message: 'Balance top up successful',
        transaction_detail,
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
   * @method pay_dispatcher
   * @memberof Payment
   * @params req, res
   * @description this method allows a customer to pay a dispatcher for their services.
   * @return JSON object
   */

  static pay_dispatcher(req, res) {
    const { user } = req.session;
    const {
      dispatcher_id,
      package_id,
      delivery_price,
    } = req.params;
    return Promise.try(async () => {
      if (parseInt(user.virtual_balance, 10) < parseInt(delivery_price, 10)) {
        return res.status(400).json({
          status: 400,
          error: 'Insufficient balance. Please top-up your account',
        });
      }
      const isFound = await Transactions.findOne({
        where: {
          [Op.and]: [{ package_id }, { dispatcher_id }],
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
      const customer_remaining_balance = parseInt(user.virtual_balance, 10) - parseInt(delivery_price, 10);
      // get dispatcher to update their account + minus the 20 percent charge.
      const dispatcher = await Couriers.findOne({
        where: {
          id: dispatcher_id,
        },
      });
      if (!dispatcher) {
        return res.status(404).json({
          status: 404,
          error: 'Oops, seems this dispatcher doesn\'t exists anymore...',
        });
      }
      const fees = parseInt(delivery_price, 10) * 0.2;
      const total_amount_payable = parseInt(delivery_price, 10) - fees;
      const dispatcher_new_balance = parseInt(dispatcher.virtual_balance, 10) + total_amount_payable;

      const transaction_details = {
        customer_id: user.id,
        dispatcher_id,
        amount_paid: delivery_price,
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
