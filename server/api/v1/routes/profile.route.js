/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import checkSession, { isCourierLoggedIn, isCustomerLoggedIn } from '../../../middlewares/session';
import Profile from '../controllers/profile.controller';
import Validate from '../../../middlewares/validate';

const {
  get_courier_profile,
  get_customer_profile,
  get_own_profile,
} = Profile;

const {
  check_profile_id,
} = Validate;

const profileRoutes = express();

profileRoutes.get(
  '/courier/pv/:id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_profile_id,
  get_courier_profile,
);
profileRoutes.get(
  '/customer/pv/:id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_profile_id,
  get_customer_profile,
);

profileRoutes.get(
  '/customer/me',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  get_own_profile,
);
profileRoutes.get(
  '/courier/me',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  get_own_profile,
);
export default profileRoutes;
