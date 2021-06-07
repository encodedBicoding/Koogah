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
  const options = {
    to: [mobile_number],
    message,
    from: 'Koogah'
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
