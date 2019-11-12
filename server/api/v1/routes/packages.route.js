/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import Package from '../controllers/package.controller';
import checkSession, { isCourierLoggedIn, isCustomerLoggedIn } from '../../../middlewares/session';
import Validate from '../../../middlewares/validate';

const {
  request_dispatch,
  show_interest,
  approve_or_decline,
  change_weight,
  approve_or_decline_weight_change,
} = Package;

const {
  create_package,
  check_package_id,
  check_response,
  check_weight,
} = Validate;

const packageRoute = express();

packageRoute.route('/:type')
  .post(
    passport.authenticate('bearer', { session: false }),
    checkSession,
    isCustomerLoggedIn,
    create_package,
    request_dispatch,
  );
packageRoute.post(
  '/courier/interest/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_package_id,
  show_interest,
);
packageRoute.patch(
  '/customer/interest/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_package_id,
  check_response,
  approve_or_decline,
);
packageRoute.post(
  '/courier/weight/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_package_id,
  check_weight,
  change_weight,
);
packageRoute.patch(
  '/customer/weight/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_package_id,
  check_response,
  approve_or_decline_weight_change,
);


export default packageRoute;
