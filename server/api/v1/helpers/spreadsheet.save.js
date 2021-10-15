import { GoogleSpreadsheet } from 'google-spreadsheet';
import log from 'fancy-log';
import { config } from 'dotenv';
import {
  Couriers,
  Customers,
  Companies,
} from '../../../database/models';

const cron = require('node-cron');

config();


export async function saveToSpreadsheet(userType, data) {
  return Promise.try(async () => {
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY
    });
    await doc.loadInfo();
    let sheet;
    switch (userType) {
      case 'customer':
        sheet = doc.sheetsById[process.env.CUSTOMER_GID];
        break;
      case 'courier':
        sheet = doc.sheetsById[process.env.DISPATCHER_GID];
        break;
      case 'company':
        sheet = doc.sheetsById[process.env.COMPANY_GID];
        break;
      default:
        sheet = doc.sheetsById[process.env.CUSTOMER_GID];
        break;
    }
    data.FirstName = toSentenceCase(data.FirstName);
    data.LastName = toSentenceCase(data.LastName);

    await sheet.addRow(data);
  }).catch(err => {
    log(err);
    return res.status(400).json({
      status: 400,
      error: err
    });
  })
}

export async function saveDBToSpreadSheet(req, res) {
  return Promise.try(async () => {
    const { userType } = req.query;
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    await doc.useServiceAccountAuth({
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY
    });
    await doc.loadInfo();
    let sheet;
    switch (userType) {
      case 'customer':
        sheet = doc.sheetsById[process.env.CUSTOMER_GID];
        break;
      case 'courier':
        sheet = doc.sheetsById[process.env.DISPATCHER_GID];
        break;
      case 'company':
        sheet = doc.sheetsById[process.env.COMPANY_GID];
        break;
      default:
        sheet = doc.sheetsById[process.env.CUSTOMER_GID];
        break;
    }
    let table = [];
    if (userType === 'customer') {
      table = await Customers.findAll();
    }
    if (userType === 'courier') {
      table = await Couriers.findAll();
    }
    if (userType === 'company') {
      table = await Companies.findAll();
    }
    const data = table.map((user) => {
       let d = {};
        d.FirstName = toSentenceCase(user.first_name);
        d.LastName = toSentenceCase(user.last_name);
        d.EmailAddress = user.email;
        d.PhoneNumber = user.phone || user.mobile_number_one || user.mobile_number;
  
        if (userType === 'company') {
          d.BusinessName = user.business_name
        }
      return d;
    })
    sheet.addRows(data);
    return res.status(200).json({
      status: 200,
      message: 'Data uploaded'
    })
  }).catch(err => {
    log(err);
    return res.status(400).json({
      status: 400,
      error: err
    });
  })
}


function toSentenceCase(s) {
  if (s) {
    return s[0].toUpperCase() + s.substring(1, s.length);
  }
  return '';
}
