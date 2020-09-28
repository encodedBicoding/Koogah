/* eslint-disable curly */
/* eslint-disable prefer-destructuring */
/* eslint-disable camelcase */
import { config } from 'dotenv';
import client from '../redis/redis.client';
import jwt from '../api/v1/helpers/jwt';
import { Couriers, Customers } from '../database/models';

config();

const isProduction = process.env.NODE_ENV === 'production';

const checkSession = function checkSession(req, res, next) {
  let token;
  if (!req.headers.authorization) {
    return res.status(401).json({
      status: 401,
      error: 'Authentication error',
    });
  }
  if (req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else {
    token = req.headers.authorization;
  }
  return Promise.try(async () => {
    const request_payload = await jwt.verify(token);
    const user_type = request_payload.is_courier ? 'COURIER' : 'CUSTOMER';
    return client.get(`${request_payload.email}:${user_type}`, async (err, result) => {
      try {
        if (result) {
          const current_token = result;
          const actual_payload = await jwt.verify(current_token);
          if (actual_payload.iat !== request_payload.iat
              || actual_payload.exp !== request_payload.exp
          ) {
            return res.status(400).json({
              status: 400,
              error: 'Session expired. Please log in again',
            });
          }
          req.session.user = {};
          req.session.user.token = token;
          return next();
        }
        return res.status(401).json({
          status: 401,
          error: 'Not Authorized. Please contact support on support@koogah.com',
        });
      } catch (error) {
        return res.status(500).json({
          status: 500,
          error,
        });
      }
    });
  }).catch((err) => res.status(400).json({
    status: 400,
    error: err,
  }));
};

export const isCourierLoggedIn = function isCourierLoggedIn(req, res, next) {
  const { token } = req.session.user;
  return Promise.try(async () => {
    const payload = await jwt.verify(token);
    const isFound = await Couriers.findOne({
      where: {
        email: payload.email,
      },
    });
    if (!isFound) return res.status(401).json({
      status: 401,
      error: 'Not Authorized. Please contact support to lay complains. contact support@koogah.com',
    });
    if (!isFound.is_approved) return res.status(401).json({
      status: 401,
      error: 'Cannot perform this action until your account is approved by our team',
    });
    if (!payload.is_courier) {
      return res.status(401).json({
        status: 401,
        error: 'You are not allowed to access this resource',
      });
    }
    delete req.session.user.token;
    req.session.user = isFound.getSafeDataValues();
    return next();
  }).catch((err) => res.status(400).json({
    status: 400,
    error: err,
  }));
};
export const isCustomerLoggedIn = function isCustomerLoggedIn(req, res, next) {
  const { token } = req.session.user;
  return Promise.try(async () => {
    const payload = await jwt.verify(token);
    const isFound = await Customers.findOne({
      where: {
        email: payload.email,
      },
    });
    if (!isFound) return res.status(404).json({
      status: 401,
      error: 'Not Authorized. Please contact support to lay complains. contact support@koogah.com',
    });
    if (!isFound.is_verified) return res.status(401).json({
      status: 401,
      error: 'Cannot perform this action until you have verified your account. Please check your email for a verification link sent to you, or',
      resend_link: (isProduction) ? `https://koogah.herokuapp.com/v1/user/customer/verify/email?key=${isFound.verify_token}&code=CUSTOMER` : `http://localhost:4000/v1/user/customer/verify/email?key=${isFound.verify_token}&code=CUSTOMER`,
    });
    if (payload.is_courier) {
      return res.status(401).json({
        status: 401,
        error: 'You are not allowed to access this resource',
      });
    }
    delete req.session.user.token;
    req.session.user = isFound.getSafeDataValues();
    return next();
  }).catch((err) => res.status(400).json({
    status: 400,
    error: err,
  }));
};
export default checkSession;
