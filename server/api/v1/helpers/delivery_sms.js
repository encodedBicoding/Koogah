/* eslint-disable camelcase */
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

const whichSMSAPI = process.env.WHICH_SMS_API;
var accountSid = process.env.TWILIO_ACCOUNT_SID; // Your Account SID from www.twilio.com/console
var authToken = process.env.TWILIO_ACCOUNT_AUTH_TOKEN;

const credentials = {
  apiKey: process.env.AFRICAS_TALKING_API_KEY,
  username: 'koogah'
};

const AfricasTalking = require('africastalking')(credentials);

const sms = AfricasTalking.SMS;

async function sendDeliverySMS(mobile_number, message) {
  if (whichSMSAPI === 'AFRICASTALKING') {
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
  if (whichSMSAPI === 'BULKSMS') {
    const url = new URL('https://www.bulksmsnigeria.com/api/v1/sms/create');
    let params = {
      "api_token": process.env.BULK_SMS_API_TOKEN,
      "to": `${mobile_number}`,
      "from": "Koogah",
      "body": `${message}`,
      "gateway": "0",
      "append_sender": "0",
    };
    Object.keys(params)
    .forEach(key => url.searchParams.append(key, params[key]));
    fetch(
      url,
      {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        }
      }
    ).then(response => response.json())
  }
  if (whichSMSAPI === 'TWILIO') {
    try {
      var twilioClient = require('twilio')(accountSid, authToken);
      twilioClient.messages.create({
        body: message,
        from: '+19282385401',
        to: mobile_number,
      }).then(message => console.log(message.sid)).done();
    } catch (err) {
      console.log(err);
    }
  }
}
export default sendDeliverySMS;
