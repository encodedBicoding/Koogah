/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import checkSession, { isCourierLoggedIn } from '../../../middlewares/session';
import Payout from '../controllers/payout.controller';
import Validate from '../../../middlewares/validate';

const payoutRoutes = express();

const {
  request_payout,
} = Payout;

const {
  check_payout_amount,
} = Validate;
// validate query params for amount
payoutRoutes.put(
  '/request',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_payout_amount,
  request_payout,
);

export default payoutRoutes;
