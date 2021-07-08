/* eslint-disable camelcase */
import log from 'fancy-log';
import { config } from 'dotenv';
import generate_ref from '../helpers/ref.id';
import { Payouts, Couriers } from '../../../database/models';
import fetch from 'node-fetch';

config();

const isProduction = process.env.NODE_ENV === 'production';

/**
 * @class Payout
 * @description Defines methods to allow a courier/dispatcher request payout for sevices.
 */
class Payout {
  /**
   * @method request_payout
   * @memberof Payout
   * @params req, res
   * @description this method allows a courier request payout
   * @return JSON object
   */

  static request_payout(req, res) {
    const { user } = req.session;
    const { amount } = req.query;
    const { bank_code } = req.body;
    return Promise.try(async () => {
      const user_current_balance = user.virtual_balance;
      if (Number(amount) < 1000.00) {
        return res.status(400).json({
          status: 400,
          error: 'Cannot request payout for amount less than N 1000.00',
        });
      }
      if (Number(amount) > Number(user_current_balance)) {
        return res.status(400).json({
          status: 400,
          error: 'Amount requested is more than what you have. Please reduce the requested amount',
        });
      }

      let response = await fetch(
        'https://api.paystack.co/transferrecipient',
        {
          method: 'POST',
          body: JSON.stringify(
            {
              type: 'nuban',
              name: `${user.first_name} ${user.last_name}`,
              account_number: user.account_number,
              bank_code: bank_code,
              currency: 'NGN'
            }
          ),
          headers: {
            'Authorization': `Bearer ${process.env['PAYSTACK_LIVE_SECRET_KEY']}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.status !== 201 || response.status !== 200) {
        return res.status(response.status).json({
          status: response.status,
          error: 'An error occured, Please retry'
        });
      }

      response = await response.json();

      const recipient_code = response.data.recipient_code;

      let t_res = await fetch(
        'https://api.paystack.co/transfer',
        {
          method: 'POST',
          body: JSON.stringify(
            {
              source: 'balance',
              amount: (parseInt(amount, 10) * 100),
              recipient: recipient_code,
              reason: 'Payout for package delivery'
            }
          ),
          headers: {
            'Authorization': `Bearer ${process.env['PAYSTACK_LIVE_SECRET_KEY']}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (t_res.status !== 200 || t_res.status !== 201) {
        return res.status(400).json({
          status: 400,
          error: 'An error occured, Please retry'
        })
      }

      t_res = await t_res.json();

      const transfer_code = t_res.data.transfer_code;
      
      const dispatcher_new_balance = Number(user_current_balance) - Number(amount);

      const payout_details = {
        dispatcher_first_name: user.first_name,
        dispatcher_last_name: user.last_name,
        dispatcher_email: user.email,
        amount_requested: amount,
        dispatcher_account_number: user.account_number,
        dispatcher_bank_name: user.bank_name,
        status: 'paid',
        reference_id: transfer_code,
      };
      const new_payout = await Payouts.create({ ...payout_details });
      const new_total_payouts = Number(amount) + Number(user.total_payouts);
      
      await Couriers.update({
        virtual_balance: dispatcher_new_balance,
        last_payout: Number(amount),
        total_payouts: new_total_payouts,
      },
      {
        where: {
          email: user.email,
        },
      });
      return res.status(200).json({
        status: 200,
        message: 'Payout successful, you will be credited shortly',
        data: new_payout,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  static payout_summary(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const all_payouts = await Payouts.findAll({ where: { dispatcher_email: user.email, status: 'paid' } });
      let total_payouts = null;
      let total_paydate = null;
      let last_payout = null;
      let last_paydate = null;

      if (all_payouts && all_payouts.length > 0) {
        total_payouts = all_payouts.reduce((acc, curr) => {
          acc = acc + Number(curr.amount_requested);
          return acc;
        }, 0);
        total_paydate = all_payouts[0].updatedAt;
        last_payout = all_payouts[all_payouts.length - 1].amount_requested;
        last_paydate = all_payouts[all_payouts.length - 1].updatedAt
      }
      return res.status(200).json({
        status: 200,
        message: 'payout summary retrieved successfully',
        data: {
          all_payouts,
          has_payouts: all_payouts && all_payouts.length > 0 ? true : false,
          total_payouts,
          total_paydate,
          last_payout,
          last_paydate
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
}
export default Payout;
