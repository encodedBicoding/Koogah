import express from 'express';
import PromoController from '../controllers/promo.controller';
import Validate from '../../../middlewares/validate';
import checkSession, { isCustomerLoggedIn } from '../../../middlewares/session';

const promoRoute = express();
const {
  globalPromo,
  individualPromo,
  usePromoCode,
} = PromoController;

const { promoCodeSend } = Validate;

promoRoute.post(
  '/promo/global',
  promoCodeSend,
  globalPromo,
)

promoRoute.post(
  '/promo/individual',
  individualPromo,
);

promoRoute.post(
  '/promo/use',
  checkSession,
  isCustomerLoggedIn,
  usePromoCode,
);

export default promoRoute;
