/* eslint-disable camelcase */
import fetch from 'node-fetch';
import log from 'fancy-log';
import { config } from 'dotenv';
import { Customers, Transactions } from '../../../database/models';

config();
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
    log(total_user_balance);
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
}

export default Payment;