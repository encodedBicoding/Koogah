import express from 'express';
import VerifyMe from '../controllers/verifyme.controller';

const verifyRoute = express();
const {
  verifyBVN,
  verifyNIN,
  submitAddressVerification
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
  '/address',
  submitAddressVerification,
);

export default verifyRoute;
