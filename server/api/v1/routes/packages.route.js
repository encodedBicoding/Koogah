/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import Package from '../controllers/package.controller';
import checkSession, { isCourierLoggedIn, isCustomerLoggedIn } from '../../../middlewares/session';
import Validate from '../../../middlewares/validate';
import {
  multiple_upload,
  multipleMulter,
} from '../helpers/upload.image';

const {
  request_dispatch,
  show_interest,
  approve_or_decline,
  change_weight,
  approve_or_decline_weight_change,
  mark_package_as_delivered,
  courier_preview_package,
  customer_view_package,
  customer_view_all_package,
  courier_view_all_package,
  courier_view_packages_in_marketplace
} = Package;

const {
  create_package,
  check_package_id,
  check_response,
  check_weight,
  check_delivery_type,
  check_package_status,
} = Validate;

const packageRoute = express();

packageRoute.route('/:type')
  .post(
    passport.authenticate('bearer', { session: false }),
    checkSession,
    isCustomerLoggedIn,
    check_delivery_type,
    create_package,
    request_dispatch,
  );
packageRoute.patch(
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

packageRoute.patch(
  '/courier/deliver/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_package_id,
  mark_package_as_delivered,
);

packageRoute.get(
  '/preview/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_package_id,
  courier_preview_package,
);
packageRoute.get(
  '/owner/view/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_package_id,
  customer_view_package,
);
packageRoute.get(
  '/owner/p/all',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_package_status,
  customer_view_all_package,
);

packageRoute.get(
  '/courier/p/all',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_package_status,
  courier_view_all_package,
);
packageRoute.get(
  '/courier/marketplace',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  courier_view_packages_in_marketplace,
)
packageRoute.put(
  '/customer/upload/multiple',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  multipleMulter,
  multiple_upload,
);

export default packageRoute;
