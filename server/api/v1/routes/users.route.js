/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
import express from 'express';
import passport from 'passport';
import UserController from '../controllers/users.controller';
import checkSession, { isCustomerLoggedIn } from '../../../middlewares/session';
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
} = UserController;

const {
  courierSignup,
  validateMobileCode,
  customerSignup,
  check_sign_in,
  check_package_id,
  check_dispatcher_id,
  check_rating,
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
  validateMobileCode,
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
  check_package_id,
  check_dispatcher_id,
  check_rating,
  rate_a_courier,
);
export default userRoute;
