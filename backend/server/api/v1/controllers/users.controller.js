import { config } from 'dotenv';
import { Couriers, Awaitings, Customers } from '../../../../database/models';
import sendSMS from '../helpers/sms';
import gen_verify_code from '../helpers/verify.code';
import jwt from '../helpers/jwt';
import sendMail, { createVerificationMail, createCourierApprovalMail } from '../helpers/mail';
import log from 'fancy-log';
import Sequelize from 'sequelize';

const Op = Sequelize.Op;

config()

const isProduction = process.env.NODE_ENV === 'production';

/**
 * @class UserController
 */
class UserController {
  /**
   * @method signUpCourier_StepOne
   * @memberof UserController
   * @description This method sends a verification link to the courier's email
   * @params req, res
   * @return JSON object
   */
  static async signUpCourier_StepOne(req, res) {
    const { 
      first_name, 
      last_name,
      email,
      password,
      mobile_number,
      sex,
      bvn,
      nationality,
      state,
      town,
      address 
    } = req.body;

    let VERIFY_LINK, VERIFY_TOKEN, USR_OBJ, MSG_OBJ, NEW_USER;

    VERIFY_TOKEN = await jwt.sign({
      email,
      bvn,
      first_name,
      mobile_number,
    });

    VERIFY_LINK = (isProduction) ? `https://koogah-staging.herokuapp.com/v1/user/verify/email?key=${VERIFY_TOKEN}&code=COURIER` : `http://localhost:4000/v1/user/verify/email?key=${VERIFY_TOKEN}&code=COURIER`;
    
    USR_OBJ = {
      first_name,
      last_name,
      verify_link: VERIFY_LINK
    }

    NEW_USER = {
      first_name,
      last_name,
      email,
      password,
      mobile_number,
      sex,
      bvn,
      nationality,
      verify_token: VERIFY_TOKEN,
      state,
      town,
      address
    }
  
    MSG_OBJ = createVerificationMail(email, USR_OBJ, 'dispatcher');

    const isFound = await Couriers.findOne({
      where: {
        [Op.or]: [
          { email }, { bvn }
        ]
      }
    });

    if(isFound) return res.status(409).json({
      status: 409,
      error: 'A user with the given email already exists'
    });

    Promise.all([Couriers.create(NEW_USER), sendMail(MSG_OBJ)])
    .then((result) => {
      return Promise.resolve(result)
    })
    .then(
      () => res.status(200).json({
      status: 200,
      message: 'A verificaton link has been sent to your email address',
    }))
    .catch(err => {
      log(err);
      res.status(400).json({
        status: 400,
        error: err
      })
    });
  };

   /**
   * @method signUpCourier_StepTwo
   * @description This method sends verification code to the user's mobile number
   * @memberof UserController
   * @params req, res
   * @return JSON object
   */

   static async signUpCourier_StepTwo(req, res) {
     const { key } = req.query;
     const payload = await jwt.verify(key);
     if(!payload) return res.status(400).json({
       status: 400,
       error: 'Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com'
     });

     let verifying_user = await Couriers.findOne({
       where: {
         [Op.and]: [ {email: payload.email}, { bvn: payload.bvn } ]
       }
     });

     if(!verifying_user) return res.status(404).json({
      status: 404,
      error: 'You currently cannot perform this action. Please contact our help support and report the scenerio to them. mailto:support@koogah.com'
    });

     if(!verifying_user.verify_token) return res.status(400).json({
       status: 400,
       error: 'Oops, seems you have already verified your email and mobile number.'
     });

     const MOBILE_VERIFY_CODE = gen_verify_code();

     let SMS_MESSAGE = `Your verification code is: \n${MOBILE_VERIFY_CODE}`;

     let MOBILE_REDIRECT_LINK = `https://mobile_redirect_link?key=${key}&live=${key ? true : false}`

     // this function should redirect the user to the Mobile App page
     // That contains the form so they can insert the code sent to their mobile phones

     Promise.all(
       [
         sendSMS(payload.mobile_number, SMS_MESSAGE), 
         Couriers.update(
            { 
             verification_code: MOBILE_VERIFY_CODE,
            },
            {
              where: {
                [Op.and]: [ { email: payload.email }, { bvn: payload.bvn } ]
              }
            }
          )
       ]
      ).then((result) => {
        return Promise.resolve(result)
      })
      .then(() => {
       return res.status(200).json({
        status: 200,
        message: 'Please insert the verification code sent to the mobile number you provided on registeration',
        mobile: MOBILE_REDIRECT_LINK
       })
      })
      .catch((err) => {
        log(err);
        return res.status(400).json({
          status: 400,
          error: err
        });
      })

   }

  /**
   * @method signUpCourier_StepThree
   * @description This method allows a user confirm the code sent to their mobile device. and generates approval link
   * @memberof UserController
   * @params req, res
   * @return JSON object
   */

   static async signUpCourier_StepThree(req, res) {
     const { key } = req.query;
     const { code } = req.body;

     let APPROVAL_LINK, APPROVAL_TOKEN, AWAITING_USER_OBJ, MSG_OBJ;

     let payload = await jwt.verify(key);

     if(!payload) return res.status(400).json({
      status: 400,
      error: 'Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com'
    });

    const verifying_user = await Couriers.findOne({ 
      where: {
        [Op.and]: [{email: payload.email}, {bvn: payload.bvn}]
      }
    });

    if(!verifying_user) return res.status(404).json({
      status: 404,
      error: 'You currently cannot perform this action. Please contact our help support and report the scenerio to them. mailto:support@koogah.com'
    });

     if(!verifying_user.verification_code) return res.status(400).json({
      status: 400,
      error: 'Oops, seems you have already verified your email and mobile number.'
    });

    if(verifying_user.verification_code !== code) return res.status(400).json({
      status: 400,
      error: 'The code you supplied do not match the code you received. Please try again or resend code',
      resend_link: (isProduction) ? `https://koogah-staging.herokuapp.com/v1/user/verify/email?key=${key}&code=COURIER` : `http://localhost:4000/v1/user/verify/email?key=${key}&code=COURIER`
    });

    payload = {
      email: verifying_user.email,
      bvn: verifying_user.bvn,
      first_name: verifying_user.first_name,
      mobile_number: verifying_user.mobile_number
    };

    APPROVAL_TOKEN = await jwt.sign(payload, '1440h');
    APPROVAL_LINK = (isProduction) ? `https://koogah-staging.herokuapp.com/v1/user/approved/welcome?key=${APPROVAL_TOKEN}&code=APPROVED` : `http://localhost:4000/v1/user/approved/welcome?key=${APPROVAL_TOKEN}&code=APPROVED`;
    
    AWAITING_USER_OBJ = {
      first_name: payload.first_name,
      last_name: verifying_user.last_name,
      user_email: payload.email,
      mobile_number: payload.mobile_number,
      sex: verifying_user.sex,
      approval_link: APPROVAL_LINK,
    }

    // Drop the user in the awaiting user's db.
    // send the user details as mail to the company.
    
    MSG_OBJ = createCourierApprovalMail(AWAITING_USER_OBJ);

    Promise.all(
      [
        Couriers.update(
          { 
            verification_code: null,
            verify_token: null,
            is_verified: true,
            approval_code: APPROVAL_TOKEN,
          }, 
          { 
          where: {
            [Op.and]: [{email: payload.email}, {bvn: payload.bvn}]
          }
          }),
          Awaitings.create(AWAITING_USER_OBJ)
      ]
    )
    .then((result) => {
      return Promise.resolve([sendMail(MSG_OBJ), result]);

    })
    .then(() => res.status(200).json({
      status: 200,
      message: 'Verification code confirmed successfully. \nWe would verify your registeration and get back to you \nthis usually takes a day, or two'
    }))
    .catch(err => {
      log(err);
      return res.send({ error: err });
    })


   }

  /**
   * @method signUpCourier_StepFour
   * @description This method approves a courier and sets them up to use the app.
   * @memberof UserController
   * @params req, res
   * @return JSON object
   */

   static async signUpCourier_StepFour(req, res) {
     const { key } = req.query;
     //make a cleanup of this scenerio
     const payload = await jwt.verify(key);

     if(!payload) return res.status(400).json({
      status: 400,
      error: 'Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com'
    });
    
     const isFound = await Couriers.findOne({
       where: {
         email: payload.email
       }
     });

     if(!isFound) return res.status(404).json({
      status: 404,
      error: 'You currently cannot perform this action. Please contact our help support and report the scenerio to them. mailto:support@koogah.com'
    });

    if(!isFound.approval_code) return res.status(400).json({
      status: 400,
      error: 'Oops, seems you are already approved by our team'
    });

    Promise.all(
      [
        Couriers.update(
          {
            is_approved: true,
            approval_code: null,
            is_active: true,

          },
          {
            where: {
              email: payload.email
          }
        }
        ),
        Awaitings.destroy({
          where: {
            user_email: payload.email
          }
        })
      ]
      )
      .then(async () => {
        let approved_user = await Couriers.findOne({
          where: {
            email: payload.email
          }
        });

        req.session.user = approved_user.getSafeDataValues();

        res.status(200).json({
          status: 200,
          message: 'Account approved successfully',
          user: req.session.user
        })
      })
      .catch((err) => {
        log(err);
        return res.status(400).json({ 
          status: 400,
          error: err 
        });
      })

  }

  /**
   * @method signUpCustomer_stepOne
   * @memberof UserController
   * @description This method sends a verification link to the customer's email
   * @params req, res
   * @return JSON object
   */

   static async signupCustomer_StepOne(req, res) {
     const {
       first_name,
       last_name,
       business_name,
       has_business,
       mobile_number_one,
       mobile_number_two,
       address,
       state,
       town,
       email,
       password
     } = req.body;

     let VERIFY_LINK, VERIFY_TOKEN, USR_OBJ, MSG_OBJ, NEW_USER;

     VERIFY_TOKEN = await jwt.sign({
      email,
      first_name,
      mobile_number_one,
      last_name
    });

    VERIFY_LINK = (isProduction) ? `https://koogah-staging.herokuapp.com/v1/user/customer/verify/email?key=${VERIFY_TOKEN}&code=CUSTOMER` : `http://localhost:4000/v1/user/customer/verify/email?key=${VERIFY_TOKEN}&code=CUSTOMER`;

    USR_OBJ = {
      first_name,
      last_name,
      verify_link: VERIFY_LINK
    }

    NEW_USER = {
      first_name,
      last_name,
      business_name,
      has_business,
      mobile_number_one,
      mobile_number_two,
      address,
      state,
      town,
      email,
      password,
      verify_token: VERIFY_TOKEN
    }

    MSG_OBJ = createVerificationMail(email, USR_OBJ, 'customer');

    let isFound = await Customers.findOne({ 
       where: {
         email
       }
      });

      if(isFound) return res.status(400).json({
        status: 400,
        message: 'A user with the given email already exists'
      });

      Promise.all(
        [
          Customers.create(NEW_USER),
          sendMail(MSG_OBJ)
        ]
      ).then((result) => {
        return Promise.resolve(result)
      })
      .then(() => res.status(200).json({
        status: 200,
        message: 'A verification link has been sent to your email address',
      }))
      .catch( err => {
        log(err);
        res.status(400).json({
          status: 400,
          error: err
        })
      })

   }

  /**
   * @method signUpCustomer_StepTwo
   * @description This method sends verification code to the user's mobile number
   * @memberof UserController
   * @params req, res
   * @return JSON object
   */
  static async signUpCustomer_StepTwo(req, res) {
    const { key } = req.query;
    const payload = await jwt.verify(key);
    if(!payload) return res.status(400).json({
      status: 400,
      error: 'Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com'
    });

    let verifying_user = await Customers.findOne({
      where: {
        email: payload.email
      }
    });

    if(!verifying_user) return res.status(404).json({
     status: 404,
     error: 'You currently cannot perform this action. Please contact our help support and report the scenerio to them. mailto:support@koogah.com'
   });

    if(!verifying_user.verify_token) return res.status(400).json({
      status: 400,
      error: 'Oops, seems you have already verified your email and mobile number.'
    });

    const MOBILE_VERIFY_CODE = gen_verify_code();

    let SMS_MESSAGE = `Your verification code is: \n${MOBILE_VERIFY_CODE}`;

    let MOBILE_REDIRECT_LINK = `https://mobile_redirect_link?key=${key}&live=${key ? true : false}`

    // this function should redirect the user to the Mobile App page
    // That contains the form so they can insert the code sent to their mobile phones

    Promise.all(
      [
        sendSMS(payload.mobile_number, SMS_MESSAGE), 
        Customers.update(
           { 
            verification_code: MOBILE_VERIFY_CODE,
           },
           {
             where: {
               email: payload.email 
             }
           }
         )
      ]
     ).then((result) => {
       return Promise.resolve(result)
     })
     .then(() => {
      return res.status(200).json({
       status: 200,
       message: 'Please insert the verification code sent to the mobile number you provided on registeration',
       mobile: MOBILE_REDIRECT_LINK
      })
     })
     .catch((err) => {
       log(err);
       return res.status(400).json({
         status: 400,
         error: err
       });
     })

  }

  /**
   * @method signUpCustomer_StepThree
   * @description This method allows a user confirm the code sent to their mobile device.
   * @memberof UserController
   * @params req, res
   * @return JSON object
   */

   static async signupCustomer_StepThree(req, res) {
     const { key } = req.query;
     const { code } = req.body;

     const payload = await jwt.verify(key);

     if(!payload) return res.status(400).json({
      status: 400,
      error: 'Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com'
    });

    const verifying_user = await Customers.findOne({ 
      where: {
        email: payload.email
      }
    });

    if(!verifying_user) return res.status(404).json({
      status: 404,
      error: 'You currently cannot perform this action. Please contact our help support and report the scenerio to them. mailto:support@koogah.com'
    });

    if(!verifying_user.verification_code) return res.status(400).json({
      status: 400,
      error: 'Oops, seems you have already verified your email and mobile number.'
    });

    if(verifying_user.verification_code !== code) return res.status(400).json({
      status: 400,
      error: 'The code you supplied do not match the code you received. Please try again or resend code',
      resend_link: (isProduction) ? `https://koogah-staging.herokuapp.com/v1/user/verify/email?key=${key}&code=COURIER` : `http://localhost:4000/v1/user/verify/email?key=${key}&code=COURIER`
    });

    Promise.resolve(Customers.update(
      {
        verification_code: null,
        verify_token: null,
        is_verified: true
      },
      {
        where: {
          email: payload.email
        }
      }
    ))
    .then(async () => {
      let approved_user = await Customers.findOne({
        where: {
          email: payload.email
        }
      });

      req.session.user = approved_user.getSafeDataValues();

      res.status(200).json({
        status: 200,
        message: 'Account created successfully',
        user: req.session.user
      })

    })
    .catch((err) => {
      log(err);
      return res.status(400).json({ 
        status: 400,
        error: err 
      });
    });

   }

}

export default UserController;