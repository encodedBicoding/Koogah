/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import Notify from '../controllers/notify.controller';
import checkSession, { isCourierLoggedIn, isCustomerLoggedIn } from '../../../middlewares/session';
import Validate from '../../../middlewares/validate';

const notifyRoutes = express();

const {
  get_all_notifications,
  read_notification,
  store_device_token,
  get_device_state,
  update_device_state
} = Notify;

const {
  check_notify_id,
} = Validate;

notifyRoutes.get(
  '/customer/all',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  get_all_notifications,
);
notifyRoutes.get(
  '/courier/all',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  get_all_notifications,
);
notifyRoutes.post(
  '/customer/read',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_notify_id,
  read_notification,
);
notifyRoutes.post(
  '/courier/read',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_notify_id,
  read_notification,
);
notifyRoutes.post(
  '/token/:userId/:userType/:platform',
  checkSession,
  store_device_token,
)
notifyRoutes.route('/device-state')
  .get(
    passport.authenticate('bearer', { session: false }),
    checkSession,
    get_device_state)
  .post(
    passport.authenticate('bearer', { session: false }),
    checkSession,
    update_device_state)
  
export default notifyRoutes;
