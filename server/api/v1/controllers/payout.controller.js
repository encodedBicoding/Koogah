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
      if (parseInt(amount, 10) < 5000.00) {
        return res.status(400).json({
          status: 400,
          error: 'Cannot request payout for amount less than N5000.00',
        });
      }
      if (parseInt(amount, 10) > parseInt(user_current_balance, 10)) {
        return res.status(400).json({
          status: 400,
          error: 'Amount requested is more than what you have. Please reduce the requested amount',
        });
      }
      const dispatcher_new_balance = parseInt(user_current_balance, 10) - parseInt(amount, 10);

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
      await Couriers.update({
        virtual_balance: dispatcher_new_balance,
        last_payout: parseInt(amount, 10),
      },
      {
        where: {
          email: user.email,
        },
      });
      const dispatcher = await Couriers.findOne({
        where: {
          email: user.email,
        },
      });
      // eslint-disable-next-line max-len
      const new_total_payouts = parseInt(dispatcher.last_payout, 10) + parseInt(dispatcher.total_payouts, 10);
      await Couriers.update({
        total_payouts: new_total_payouts,
      },
      {
        where: {
          email: user.email,
        },
      });
      const payout_link = (isProduction) ? `https://koogah.herokuapp.com/v1/payout/pay/${new_payout.reference_id}` : `http://localhost:4000/v1/payout/pay/${new_payout.reference_id}`;
      // send a mail to the company informing them
      // of such payout.
      // the mail should contain the payout details and payout link
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
}
export default Payout;