/* eslint-disable camelcase */
import log from 'fancy-log';
import { config } from 'dotenv';
import generate_ref from '../helpers/ref.id';
import { Payouts, Couriers } from '../../../database/models';

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
    return Promise.try(async () => {
      const user_current_balance = user.virtual_balance;
      if (Number(amount) < 5000.00) {
        return res.status(400).json({
          status: 400,
          error: 'Cannot request payout for amount less than N5000.00',
        });
      }
      if (Number(amount) > Number(user_current_balance)) {
        return res.status(400).json({
          status: 400,
          error: 'Amount requested is more than what you have. Please reduce the requested amount',
        });
      }
      const dispatcher_new_balance = Number(user_current_balance) - Number(amount);

      const payout_details = {
        dispatcher_first_name: user.first_name,
        dispatcher_last_name: user.last_name,
        dispatcher_email: user.email,
        amount_requested: amount,
        dispatcher_account_number: user.account_number,
        dispatcher_bank_name: user.bank_name,
        status: 'unpaid',
        reference_id: generate_ref(),
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
      const payout_link = (isProduction) ? `${process.env.SERVER_APP_URL}/payout/pay/${new_payout.reference_id}` : `http://localhost:4000/v1/payout/pay/${new_payout.reference_id}`;
      // send a mail to the company informing them
      // of such payout.
      // the mail should contain the payout details and payout link
      // pay the user directly using the company payment merchant
      log(payout_link);
      return res.status(200).json({
        status: 200,
        message: 'Payout requested successfully',
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
          return cc;
        }, 0);
        total_paydate = all_payouts[0].updated_at;
        last_payout = all_payouts[all_payouts.length - 1].amount_requested;
        last_paydate = all_payouts[all_payouts.length - 1].updated_at
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
