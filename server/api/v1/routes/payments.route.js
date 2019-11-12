/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import Payment from '../controllers/payment.controller';
import checkSession, { isCustomerLoggedIn } from '../../../middlewares/session';
import Validate from '../../../middlewares/validate';

const paymentRoutes = express();

const {
  check_top_up_amount,
} = Validate;

const {
  topup_virtual_balance_StepOne,
  topup_virtual_balance_StepTwo,
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
    topup_virtual_balance_StepTwo,
  );

export default paymentRoutes;
