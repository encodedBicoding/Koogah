/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import Notify from '../controllers/notify.controller';
import checkSession, { isCourierLoggedIn, isCustomerLoggedIn } from '../../../middlewares/session';
import Validate from '../../../middlewares/validate';

const notifyRoutes = express();

const {
  get_all_unreads,
  read_notification,
} = Notify;

const {
  check_notify_id,
} = Validate;

notifyRoutes.get(
  '/customer/all/unread',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  get_all_unreads,
);
notifyRoutes.get(
  '/courier/all/unread',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  get_all_unreads,
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
export default notifyRoutes;
