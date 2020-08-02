/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import UserController from '../controllers/users.controller';
import checkSession, { isCustomerLoggedIn, isCourierLoggedIn } from '../../../middlewares/session';
import Validate from '../../../middlewares/validate';

const {
  signUpCourier_StepOne,
  signUpCourier_StepTwo,
  signUpCourier_StepThree,
  signUpCourier_StepFour,
  signupCustomer_StepOne,
  signUpCustomer_StepTwo,
  signupCustomer_StepThree,
  signInCourier,
  signInCustomer,
  rate_a_courier,
  rate_a_customer,
  sign_out,
  report_user,
} = UserController;

const {
  courierSignup,
  validateMobileCode,
  customerSignup,
  check_sign_in,
  check_courier_rating_params,
  check_customer_rating_params,
  check_rating,
  check_report,
  check_profile_id,
} = Validate;

const userRoute = express();

userRoute.post(
  '/courier/signup',
  courierSignup,
  signUpCourier_StepOne,
);

userRoute.post(
  '/customer/signup',
  customerSignup,
  signupCustomer_StepOne,
);

userRoute.get(
  '/verify/email',
  signUpCourier_StepTwo,
);

userRoute.get(
  '/customer/verify/email',
  signUpCustomer_StepTwo,
);

userRoute.get(
  '/verify/mobile',
  validateMobileCode,
  signUpCourier_StepThree,
);

userRoute.get(
  '/customer/verify/mobile',
  validateMobileCode,
  signupCustomer_StepThree,
);

userRoute.get(
  '/approved/welcome',
  signUpCourier_StepFour,
);

userRoute.post(
  '/courier/signin',
  check_sign_in,
  signInCourier,
);

userRoute.post(
  '/customer/signin',
  check_sign_in,
  signInCustomer,
);

userRoute.put(
  '/customer/rate/:dispatcher_id/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_courier_rating_params,
  check_rating,
  rate_a_courier,
);
userRoute.put(
  '/courier/rate/:customer_id/:package_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_customer_rating_params,
  check_rating,
  rate_a_customer,
);
userRoute.post(
  '/customer/signout',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  sign_out,
);
userRoute.post(
  '/courier/signout',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  sign_out,
);
userRoute.post(
  '/report/customer/:id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  check_profile_id,
  check_report,
  report_user,
);
userRoute.post(
  '/report/courier/:id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_profile_id,
  check_report,
  report_user,
);
export default userRoute;
