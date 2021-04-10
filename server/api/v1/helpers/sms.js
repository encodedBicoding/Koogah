/* eslint-disable camelcase */
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

const credentials = {
  apiKey: process.env.AFRICAS_TALKING_API_KEY,
  username: 'koogah'
};

const AfricasTalking = require('africastalking')(credentials);

const sms = AfricasTalking.SMS;

async function sendSMS(mobile_number, message) {
  // const smsToken = process.env.BULK_SMS_API_TOKEN;
  // return fetch(`https://www.bulksmsnigeria.com/api/v1/sms/create?api_token=${smsToken}&from=Koogah&to=${mobile_number}&body=${message}&dnd=2`);
  const options = {
    to: [mobile_number],
    message
  };
  sms.send(options)
    .then( response => {
        console.log(response);
    })
    .catch( error => {
        console.log(error);
    });
}
export default sendSMS;
