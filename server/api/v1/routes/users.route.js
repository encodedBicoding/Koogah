/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import UserController from '../controllers/users.controller';
import checkSession, { isCustomerLoggedIn, isCourierLoggedIn } from '../../../middlewares/session';
import Validate from '../../../middlewares/validate';
import validateEmail from '../../../middlewares/email-validator';
import { saveDBToSpreadSheet } from '../helpers/spreadsheet.save';

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
  request_password_reset,
  reset_password,
  use_refresh,
  is_session_valid,
  change_password,
  has_rated_dispatcher,
  send_approval_mail_to_courier,
  signUpCustomer_StepThree_Mobile,
  signUpCustomer_StepTwo_Mobile,
  covert_coin_to_balance,
} = UserController;

const {
  courierSignup,
  courierApproveAccount,
  validateMobileCode,
  customerSignup,
  check_sign_in,
  check_courier_rating_params,
  check_customer_rating_params,
  check_rating,
  check_report,
  check_profile_id,
  check_password_reset_request,
  check_reset_password,
  check_refresh_token,
  check_change_password,
} = Validate;

const userRoute = express();

userRoute.post(
  '/courier/signup',
  courierSignup,
  // validateEmail,
  signUpCourier_StepOne,
);

userRoute.post(
  '/customer/signup',
  customerSignup,
  // validateEmail,
  signupCustomer_StepOne,
);

userRoute.post(
  '/verify/email',
  signUpCourier_StepTwo,
);

userRoute.post(
  '/customer/verify/email',
  signUpCustomer_StepTwo,
);
userRoute.post(
  '/customer/verify/email/app',
  signUpCustomer_StepTwo_Mobile,
);

userRoute.post(
  '/verify/mobile',
  validateMobileCode,
  signUpCourier_StepThree,
);

userRoute.post(
  '/customer/verify/mobile',
  validateMobileCode,
  signupCustomer_StepThree,
);
userRoute.post(
  '/customer/verify/mobile/app',
  validateMobileCode,
  signUpCustomer_StepThree_Mobile,
);

userRoute.post(
  '/approved/welcome',
  courierApproveAccount,
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

userRoute.post(
  '/refresh/token',
  use_refresh
)

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
  isCourierLoggedIn,
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
userRoute.post(
  '/password-reset/request',
  check_password_reset_request,
  request_password_reset
);
userRoute.post(
  '/reset/password',
  check_reset_password,
  reset_password,
);

userRoute.post(
  '/customer/change/password',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  check_change_password,
  change_password
);

userRoute.get(
  '/customer/valid/session',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  is_session_valid
);

userRoute.get(
  '/courier/valid/session',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCourierLoggedIn,
  is_session_valid
);

userRoute.get(
  '/customer/rated/:package_id/:dispatcher_id',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  has_rated_dispatcher
)
userRoute.post(
  '/courier/send/approval',
  send_approval_mail_to_courier,
)

userRoute.post(
  '/spreadsheet/save',
  saveDBToSpreadSheet,
);

userRoute.post(
  '/customer/coin/convert',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  covert_coin_to_balance,
);
export default userRoute;
