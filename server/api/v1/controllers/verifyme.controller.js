import log from 'fancy-log';
import fetch from 'node-fetch';
import Crypto from 'crypto';

import { sendEmergencyContactAddressVerification } from '../helpers/slack';
class VerifyMe {
  /**
   * @method verifyBVN
   * @memberof VerifyMe
   * @description This method verifies user Bank Verification Number
   * @params req, res
   * @return JSON object
   */

  static verifyBVN(req, res) {
    return Promise.try(async () => {
      const { bvn, lastName, firstName } = req.body;
      const { auth } = req.query;
      if (auth !== process.env.KOOGAH_VERIFYME_AUTH) {
        return res.status(401).json({
          status: 401,
          error:'Not Authorized'
        });
      }
      const VERIFYME_BASE_URL = process.env.VERIFYME_BASE_URL;
      const url = `${VERIFYME_BASE_URL}/v1/verifications/identities/bvn/${bvn}`;
      const API_SECRET = process.env.NODE_ENV === 'production' ? process.env.VERIFYME_LIVE_SECRET : process.env.VERIFYME_TEST_SECRET;
      let response = await fetch(
        url,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_SECRET}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
            {
              lastname: lastName,
              firstname: firstName,
            }
          ),
        }
      );
      let statusCode = response.status;
      let statusText = response.statusText;
      response = await response.json();
      if (statusCode === 201) {
        return res.status(statusCode).json({
          status: statusCode,
          message: 'BVN data returned successfully',
          data: response.data,
        })
      } else {
        return res.status(statusCode).json({
          status: statusCode,
          error: statusText
        })
      }
    }).catch((err) => {
      log(err);
      return;
    });
  }

  /**
   * @method verifyNIN
   * @memberof VerifyMe
   * @description This method verifies user National Identity Number
   * @params req, res
   * @return JSON object
   */

  static verifyNIN(req, res) {
    return Promise.try(async () => {
      const { nin, lastName, firstName } = req.body;
      const { auth } = req.query;
      if (auth !== process.env.KOOGAH_VERIFYME_AUTH) {
        return res.status(401).json({
          status: 401,
          error:'Not Authorized'
        });
      }
      const VERIFYME_BASE_URL = process.env.VERIFYME_BASE_URL;
      const url = `${VERIFYME_BASE_URL}/v1/verifications/identities/nin/${nin}`;
      const API_SECRET = process.env.NODE_ENV === 'production' ? process.env.VERIFYME_LIVE_SECRET : process.env.VERIFYME_TEST_SECRET;
      let response = await fetch(
        url,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_SECRET}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
            {
              lastname: lastName,
              firstname: firstName,
            }
          ),
        }
      );
      let statusCode = response.status;
      let statusText = response.statusText;
      response = await response.json();
      if (statusCode === 201) {
        return res.status(statusCode).json({
          status: statusCode,
          message: 'NIN data returned successfully',
          data: response.data,
        })
      } else {
        return res.status(statusCode).json({
          status: statusCode,
          error: statusText
        })
      }
    }).catch((err) => {
      log(err);
      return;
    })
  }
  /**
   * @method submitAddressVerification
   * @memberof VerifyMe
   * @description This method submits address verification to VerifyMe
   * @params req, res
   * @return JSON object
   */
  static submitAddressVerification(req, res) {
    return Promise.try(async () => {
      const {
        lga,
        state,
        street,
        firstName,
        lastName,
        idNumber
      } = req.body;
      const { auth } = req.query;
      if (auth !== process.env.KOOGAH_VERIFYME_AUTH) {
        return res.status(401).json({
          status: 401,
          error:'Not Authorized'
        });
      }
      const VERIFYME_BASE_URL = process.env.VERIFYME_BASE_URL;
      const url = `${VERIFYME_BASE_URL}/v1/verifications/addresses`;
      const API_SECRET = process.env.NODE_ENV === 'production' ? process.env.VERIFYME_LIVE_SECRET : process.env.VERIFYME_TEST_SECRET;
      let response = await fetch(
        url,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_SECRET}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(
            {
              lga,
              state,
              street,
              applicant: {
                firstname: firstName,
                lastname: lastName,
                idType: 'KYC',
                idNumber: idNumber,
              }
            
            }
          ),
        }
      );
      let statusCode = response.status;
      let statusText = response.statusText;
      response = await response.json();
      if (statusCode === 201) {
        return res.status(statusCode).json({
          status: statusCode,
          message: 'Address queued successfully',
          data: response.data,
        })
      } else {
        return res.status(statusCode).json({
          status: statusCode,
          error: statusText
        })
      }
    }).catch((err) => {
      log(err);
      return;
    });
  }

  /**
   * @method addressVerificationWebhook
   * @memberof VerifyMe
   * @description This method is a webhook.
   * @params req, res
   * @return JSON object
   */

  static addressVerificationWebhook(req, res) {
    return Promise.try(async () => {
      const API_SECRET = process.env.NODE_ENV === 'production' ? process.env.VERIFYME_LIVE_SECRET : process.env.VERIFYME_TEST_SECRET;
      const signature = Crypto.createHmac('sha512', API_SECRET).update(JSON.stringify(req.body)).digest('hex');
      if (signature === req.headers['x-verifyme-signature']) {
        sendEmergencyContactAddressVerification(req.body.data);
        return res.status(200).json({
          status: 200,
          message: 'Message received and sent'
        });
      } else {
        return res.status(400).json({
          status: 400,
          message: 'UnAuthorized'
        })
      }
    }).catch(err => {
      log(err);
      return;
    })
  }
}

export default VerifyMe;