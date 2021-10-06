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
  '/global',
  promoCodeSend,
  globalPromo,
)

promoRoute.post(
  '/individual',
  individualPromo,
);

promoRoute.post(
  '/use',
  checkSession,
  isCustomerLoggedIn,
  usePromoCode,
);

export default promoRoute;
