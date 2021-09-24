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
  companyGetWithdrawableWalletBalance,
  companyGetSingleDispatcherTracking,
  company_request_password_reset,
  company_reset_password,
  companyGetProfile,
  company_use_refresh,
  get_total_earnings,
  get_total_dispatchers_overview,
  get_total_deliveries_overview,
  get_new_dispatchers_count
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
  '/me',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  companyGetProfile,
);
companyRoute.get(
  '/me/refresh',
  company_use_refresh,
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
  '/accounts/wallet/withdrawable',
  passport.authenticate('bearer', { session: false }),
  companyCheckSession,
  isCompanyLoggedIn,
  companyGetWithdrawableWalletBalance,
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

companyRoute.get(
  '/total_earnings',
  companyCheckSession,
  isCompanyLoggedIn,
  get_total_earnings
);

companyRoute.get(
  '/total_dispatchers/overview',
  companyCheckSession,
  isCompanyLoggedIn,
  get_total_dispatchers_overview
);

companyRoute.get(
  '/total_deliveries/overview',
  companyCheckSession,
  isCompanyLoggedIn,
  get_total_deliveries_overview
)
companyRoute.get(
  '/dispatchers/new',
  companyCheckSession,
  isCompanyLoggedIn,
  get_new_dispatchers_count,
)

export default companyRoute;
