/* eslint-disable camelcase */
import express from 'express';
import NotifyV2 from '../controllers/notify.v2.controller';
import checkSession from '../../../middlewares/session';

const notifyRoutesV2 = express();

const {
  store_device_token_v2,
} = NotifyV2;

notifyRoutesV2.post(
  '/token/:userId/:userType/:platform',
  checkSession,
  store_device_token_v2,
);

export default notifyRoutesV2;