/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
import express from 'express';
import UserController from '../controllers/users.controller';
import Validate from '../../../middlewares/validate';

const {
  signUpCourier_StepOne,
  signUpCourier_StepTwo,
  signUpCourier_StepThree,
  signUpCourier_StepFour,
  signupCustomer_StepOne,
  signUpCustomer_StepTwo,
  signupCustomer_StepThree,
} = UserController;

const {
  courierSignup,
  validateMobileCode,
  customerSignup,
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

export default userRoute;
