import express from 'express';
import passport from 'passport';
import History from '../controllers/history.controller';

import checkSession, { isCourierLoggedIn, isCustomerLoggedIn } from '../../../middlewares/session';

const historyRoute = express();

const { 
  get_all_user_history,
} = History; 

historyRoute.get(
  '/customer/all',
  passport.authenticate('bearer', { session: false }),
  checkSession,
  isCustomerLoggedIn,
  get_all_user_history
)

export default historyRoute;