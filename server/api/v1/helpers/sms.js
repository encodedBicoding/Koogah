/* eslint-disable camelcase */
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function sendSMS(mobile_number, message) {
  const smsToken = process.env.BULK_SMS_API_TOKEN;
  return fetch(`https://www.bulksmsnigeria.com/api/v1/sms/create?api_token=${smsToken}&from=KoogahSMS&to=${mobile_number}&body=${message}&dnd=2`);
}
export default sendSMS;
