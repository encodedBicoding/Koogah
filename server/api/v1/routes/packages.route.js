/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import Package from '../controllers/package.controller';
import checkSession, { externalApiSession, isCourierLoggedIn, isCustomerLoggedIn } from '../../../middlewares/session';
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
  courier_get_package,
  customer_view_package,
  customer_view_all_package,
  courier_view_all_package,
  courier_view_packages_in_marketplace,
  declinePickup,
  allPackagePendingDispatchers,
  startDispatch,
  allCurrentlyTrackingPackages,
  deletePackage,
  editPackage,
  getEstimate,
  singleTracking,
} = Package;

const {
  create_package,
  check_package_id,
  check_response,
  check_weight,
  check_delivery_type,
  check_package_status,
  check_decline_pickup_body,
  check_decline_pickup_query,
  check_approve_decline_package,
  check_deliver_package,
  check_edit_package,
  check_start_dispatch
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
  '/customer/interest/:package_id/:dispatcher_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_approve_decline_package,
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
  '/courier/deliver/:package_id/:delivery_key',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_deliver_package,
  mark_package_as_delivered,
);

packageRoute.get(
  '/courier/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_package_id,
  courier_get_package,
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
  '/market/courier',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  courier_view_packages_in_marketplace,
);

packageRoute.post(
  '/courier/pickup/decline',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_decline_pickup_query,
  check_decline_pickup_body,
  declinePickup
);
packageRoute.get(
  '/dispatcher/all/pending/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_package_id,
  allPackagePendingDispatchers
);
packageRoute.put(
  '/courier/start/dispatch/:package_id/:dispatcher_lat/:dispatcher_lng',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_start_dispatch,
  startDispatch
);
packageRoute.get(
  '/all/active/tracking',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  allCurrentlyTrackingPackages
)
packageRoute.put(
  '/customer/upload/multiple',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  multipleMulter,
  multiple_upload,
);

packageRoute.delete(
  '/customer/delete/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_package_id,
  deletePackage
)

packageRoute.put(
  '/customer/edit/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_package_id,
  check_edit_package,
  editPackage
)

packageRoute.get(
  '/dispatcher/singletracking/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_package_id,
  singleTracking
)

packageRoute.post(
  '/estimate/:type',
  externalApiSession,
  check_delivery_type,
  check_edit_package,
  getEstimate
)


export default packageRoute;
