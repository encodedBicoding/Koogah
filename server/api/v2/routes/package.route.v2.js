/* eslint-disable camelcase */
import express from 'express'
import passport from 'passport'
import PackageV2 from '../controllers/package.v2.controller'
import MultipleDeliveriesController from '../controllers/multiple_delivery.controller'
import checkSession, {
  externalApiSession,
  isCourierLoggedIn,
  isCustomerLoggedIn,
} from '../../../middlewares/session'
import Validate from '../../../middlewares/validate'

const {
  request_dispatch_v2,
  get_estimate_v2,
  change_price,
  edit_package_v2,
  customer_view_all_package_v2,
  courier_view_packages_in_marketplace_v2,
} = PackageV2

const {create_package_of_multiple_delivery} = MultipleDeliveriesController

const {
  create_package,
  check_package_id,
  check_delivery_type,
  check_edit_package,
  check_price,
  create_single_package_of_multiple,
} = Validate

const packageRouteV2 = express()

packageRouteV2
  .route('/:type')
  .post(
    passport.authenticate('bearer', {session: false}),
    checkSession,
    isCustomerLoggedIn,
    check_delivery_type,
    create_package,
    request_dispatch_v2,
  )

packageRouteV2.post(
  '/estimate/:type',
  externalApiSession,
  check_delivery_type,
  check_edit_package,
  get_estimate_v2,
)

packageRouteV2.put(
  '/customer/edit/:package_id',
  passport.authenticate('bearer', {session: false}),
  checkSession,
  isCustomerLoggedIn,
  check_package_id,
  check_edit_package,
  edit_package_v2,
)

packageRouteV2.get(
  '/owner/p/all',
  passport.authenticate('bearer', {session: false}),
  checkSession,
  isCustomerLoggedIn,
  customer_view_all_package_v2,
)

packageRouteV2.get(
  '/market/courier',
  passport.authenticate('bearer', {session: false}),
  checkSession,
  isCourierLoggedIn,
  courier_view_packages_in_marketplace_v2,
)

packageRouteV2.post(
  '/courier/price/:package_id',
  passport.authenticate('bearer', {session: false}),
  checkSession,
  isCourierLoggedIn,
  check_package_id,
  check_price,
  change_price,
)

packageRouteV2.post(
  '/multiple-delivery/:type',
  passport.authenticate('bearer', {session: false}),
  checkSession,
  isCustomerLoggedIn,
  check_delivery_type,
  create_single_package_of_multiple,
  create_package_of_multiple_delivery,
)

export default packageRouteV2
