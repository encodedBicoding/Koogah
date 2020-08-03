/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import Payment from '../controllers/payment.controller';
import checkSession, { isCustomerLoggedIn } from '../../../middlewares/session';
import Validate from '../../../middlewares/validate';

const paymentRoutes = express();

const {
  check_top_up_amount,
  check_top_up_amount_two,
  check_pay_dispatcher_query,
} = Validate;

const {
  topup_virtual_balance_StepOne,
  topup_virtual_balance_StepTwo,
  pay_dispatcher,
} = Payment;

paymentRoutes.route('/customer/topup')
  .post(
    passport.authenticate('bearer', { session: false }),
    checkSession,
    isCustomerLoggedIn,
    check_top_up_amount,
    topup_virtual_balance_StepOne,
  )
  .put(
    passport.authenticate('bearer', { session: false }),
    checkSession,
    isCustomerLoggedIn,
    check_top_up_amount_two,
    topup_virtual_balance_StepTwo,
  );
paymentRoutes.post(
  '/customer/pay/:package_id/:dispatcher_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_pay_dispatcher_query,
  pay_dispatcher,
);

export default paymentRoutes;
