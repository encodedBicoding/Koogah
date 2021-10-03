/* eslint-disable camelcase */
import BearerStrategy from 'passport-http-bearer';
import jwt from '../api/v1/helpers/jwt';
import {
  Couriers,
  Customers,
  Companies,
} from '../database/models';

class Auth {
  static bearerStrategy() {
    return new BearerStrategy(async (token, done) => {
      const payload = await jwt.verify(token);

      if (!payload) return done(false, {});

      let is_found_user = await Couriers.findOne({
        where: {
          email: payload.email,
        },
      });
      if (is_found_user) {
        return done(null, is_found_user);
      }

      if (!is_found_user) {
        // check main users table
        is_found_user = await Customers.findOne({
          where: {
            email: payload.email,
          },
        });
        if (is_found_user) {
          return done(null, is_found_user);
        }
      }
      if (!is_found_user) {
         // check main company table
        is_found_user = await Companies.findOne({
          where: {
            email: payload.email,
          }
        });
        if (is_found_user) {
          return done(null, is_found_user);
        }
      }
      if (!is_found_user) {
        return done({ status: 401, error: 'Unauthorized' }, false);
      }
    });
  }
}

export default Auth;
