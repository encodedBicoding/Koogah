/* eslint-disable camelcase */
import j_w_t from 'jsonwebtoken';
import { config } from 'dotenv';

config();

const jwt = {};
jwt.secret = process.env.SECRET_KEY;

jwt.sign = async function sign(payload, expiresIn) {
  return expiresIn ? j_w_t.sign(payload, this.secret, { expiresIn }) : j_w_t.sign(payload, this.secret);
};

jwt.verify = async function verify(token) {
  let decoded;
  try {
    decoded = j_w_t.verify(token, this.secret);
    return decoded;
  } catch (error) {
    return false;
  }
};

export default jwt;
