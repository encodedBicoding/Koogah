import express from 'express';
import VerifyMe from '../controllers/verifyme.controller';

const verifyRoute = express();
const {
  verifyBVN,
  verifyNIN,
  submitAddressVerification,
  addressVerificationWebhook,
  verifyDriverLicense,
} = VerifyMe;

verifyRoute.post(
  '/bvn',
  verifyBVN,
);

verifyRoute.post(
  '/nin',
  verifyNIN,
);
verifyRoute.post(
  '/driver_license',
  verifyDriverLicense,
);

verifyRoute.post(
  '/address',
  submitAddressVerification,
);
verifyRoute.post(
  '/address/webhook',
  addressVerificationWebhook,
);
export default verifyRoute;
