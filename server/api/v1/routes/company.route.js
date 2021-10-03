import express from 'express';
import passport from 'passport';
import CompanyController from '../controllers/company.controller';
import Payout from '../controllers/payout.controller';
import { companyCheckSession, isCompanyLoggedIn } from '../../../middlewares/session';
import Validate from '../../../middlewares/validate';


const {
  signInCompany,
  signUpCompany_StepFour,
  signUpCompany_StepOne,
  signUpCompany_StepThree,
  signUpCompany_StepTwo,
  companyRegisterDispatcherStepOne,
  companyRegisterDispatcherTwo,
  companyRegisterDispatcherStepThree,
  companyRegisterDispatcherStepFour,
  companyRegisterDispatcherStepFive,
  companyGetAllDispatchers,
  companyGetSingleDispatcher,
  companyGetWalletBalance,
  companyGetSingleDispatcherTracking,
  company_request_password_reset,
  company_reset_password,
} = CompanyController;

const {
  company_request_payout,
} = Payout;
const {
  check_company_signup,
  validateMobileCode,
  courierApproveAccount,
  check_sign_in,
  check_email,
  check_email_and_code,
  check_company_reg_dispatcher_step_three,
  check_company_reg_dispatcher_step_five,
  check_email_and_mobile_code,
  check_company_payout_amount,
  check_profile_id,
  check_reset_password
} = Validate;

const companyRoute = express();

companyRoute.post(
  '/signup',
  check_company_signup,
  signUpCompany_StepOne
);

companyRoute.post(
  '/verify/email',
  signUpCompany_StepTwo
);

companyRoute.post(
  '/verify/mobile',
  validateMobileCode,
  signUpCompany_StepThree
);

companyRoute.post(
  '/approved/welcome',
  courierApproveAccount,
  signUpCompany_StepFour,
);

companyRoute.post(
  '/signin',
  check_sign_in,
  signInCompany,
);

companyRoute.post(
  '/dispatcher/signup/email',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  check_email,
  companyRegisterDispatcherStepOne,
);
companyRoute.post(
  '/dispatcher/verify/code/email',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  check_email_and_code,
  companyRegisterDispatcherTwo,
);

companyRoute.post(
  '/dispatcher/signup/mobile',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  check_company_reg_dispatcher_step_three,
  companyRegisterDispatcherStepThree,
);
companyRoute.post(
  '/dispatcher/verify/code/mobile',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  check_email_and_mobile_code,
  companyRegisterDispatcherStepFour,
);

companyRoute.post(
  '/dispatcher/registration/complete',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  check_company_reg_dispatcher_step_five,
  companyRegisterDispatcherStepFive,
);

companyRoute.get(
  '/dispatcher/all',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  companyGetAllDispatchers,
);

companyRoute.get(
  '/dispatcher/single/:id',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  check_profile_id,
  companyGetSingleDispatcher,
);

companyRoute.get(
  '/accounts/wallet',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  companyGetWalletBalance
);

companyRoute.post(
  '/accounts/payout',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  check_company_payout_amount,
  company_request_payout
);

companyRoute.get(
  '/dispatcher/tracking/:id',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  check_profile_id,
  companyGetSingleDispatcherTracking
);

companyRoute.post(
  '/password-reset/request',
  check_email,
  company_request_password_reset,
);
companyRoute.post(
  '/reset/password',
  check_reset_password,
  company_reset_password,
);


export default companyRoute;
