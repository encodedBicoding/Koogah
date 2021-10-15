import { GoogleSpreadsheet } from 'google-spreadsheet';
import log from 'fancy-log';
import { config } from 'dotenv';
import {
  Couriers,
  Customers,
  Companies,
} from '../../../database/models';

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

    table.forEach(async (user) => {
      let data = {};
      data.FirstName = toSentenceCase(user.first_name);
      data.LastName = toSentenceCase(user.last_name);
      data.EmailAddress = user.email;
      data.PhoneNumber = user.phone || user.mobile_number_one || user.mobile_number;

      if (userType === 'company') {
        data.BusinessName = user.business_name
      }
      await sheet.addRow(data);
    });
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
