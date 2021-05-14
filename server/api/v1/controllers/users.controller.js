/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
import { config } from 'dotenv';
import j_w_t from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import log from 'fancy-log';
import Sequelize from 'sequelize';
import {
  Couriers,
  Awaitings,
  Customers,
  Packages,
  Notifications,
  Reports,
  Ratings
} from '../../../database/models';
import sendSMS from '../helpers/sms';
import gen_verify_code from '../helpers/verify.code';
import jwt from '../helpers/jwt';
import sendMail, { 
    createVerificationMail, 
    createCourierApprovalMail,
    createApprovalMailToCourier,
    createPasswordResetEmail
} from '../helpers/mail';
import client from '../../../redis/redis.client';
import generate_ref from '../helpers/ref.id';

const bcrypt = require('bcrypt');


const { Op } = Sequelize;

config();

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
    return Promise.try(async () => {
      let {
        first_name,
        last_name,
        email,
        mobile_number,
        sex,
        bvn,
        nationality,
        identification_number,
        country_code,
        state,
        town,
        address,
      } = req.body;
      const { ref, fromApp } = req.query;

      if (country_code === "+234") {
        var firstDigit = mobile_number[0].toString();
        if (firstDigit === '0') {
          mobile_number = mobile_number.substring(1, mobile_number.length);
         }
      }

      const VERIFY_TOKEN = await jwt.sign({
        email,
        bvn,
        first_name,
        mobile_number: `${country_code}${mobile_number}`,
      });
      // link hint: https://api.koogah.com
      // this should be the frontend link based on the registering user
      // not the SERVER_APP_URL
      let VERIFY_LINK = '';
      if (fromApp && fromApp === 'web') {
        VERIFY_LINK = `${isProduction ? 'https' : 'http'}://${process.env.LANDING_PAGE_APP_HOST}/verify_email?key=${VERIFY_TOKEN}&code=COURIER`;
      } else {
        VERIFY_LINK = `${isProduction ? 'https' : 'http'}://${process.env.DISPATCHER_MOBILE_APP_HOST}/verify_email?key=${VERIFY_TOKEN}&code=COURIER`;
      }
  
      const USR_OBJ = {
        first_name,
        last_name,
        verify_link: VERIFY_LINK,
      };
      const REFERAL_ID = generate_ref('referal');

      const NEW_USER = {
        first_name,
        last_name,
        email,
        mobile_number,
        sex,
        bvn,
        nationality,
        verify_token: VERIFY_TOKEN,
        state,
        town,
        address,
        identification_number,
        referal_id: REFERAL_ID,
        refered_by: ref ? ref : null,
      };
  
      const MSG_OBJ = createVerificationMail(email, USR_OBJ, 'dispatcher');
  
      const isFound = await Couriers.findOne({
        where: {
          [Op.or]: [
            { email }, { bvn },
          ],
        },
      });

      if (isFound) {
        return res.status(409).json({
          status: 409,
          error: 'A user with the given email and/or bvn already exists',
        });
      }
      await sendMail(MSG_OBJ);
      await  Couriers.create(NEW_USER);

      return res.status(200).json({
        status: 200,
        message: 'A verificaton link has been sent to your email address',
        verify_token: VERIFY_TOKEN,
      })
  

    }).catch((error) => {
      log(error);
      res.status(400).json({
        status: 400,
        error,
      });
    })

  }

  /**
   * @method signUpCourier_StepTwo
   * @description This method sends verification code to the user's mobile number
   * @memberof UserController
   * @params req, res
   * @return JSON object
   */

  static async signUpCourier_StepTwo(req, res) {
    return Promise.try( async () => {
      const { key } = req.query;
      const payload = await jwt.verify(key);
      if (!payload) {
        return res.status(400).json({
          status: 400,
          error: 'Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com',
        });
      }
  
      const verifying_user = await Couriers.findOne({
        where: {
          [Op.and]: [{ email: payload.email }, { bvn: payload.bvn }],
        },
      });
  
      if (!verifying_user) {
        return res.status(404).json({
          status: 404,
          error: 'You currently cannot perform this action. Please contact our help support and report the scenerio to them. mailto:support@koogah.com',
        });
      }
      const MOBILE_VERIFY_CODE = gen_verify_code();

      const SMS_MESSAGE = `Your verification code is: \n${MOBILE_VERIFY_CODE}`;
  
      const MOBILE_REDIRECT_LINK = `https://${process.env.SERVER_APP_URL}/verify/email?key=${key}&live=${!!key}`;
  
      // this function should redirect the user to the Mobile App page for Couriers
      // That contains the form so they can insert the code sent to their mobile phones
      if (!verifying_user.verify_token) {
        return res.status(400).json({
          status: 400,
          error: 'Oops, seems you have already verified your email and mobile number.',
        });
      }

      await sendSMS(payload.mobile_number, SMS_MESSAGE);
      await Couriers.update(
        {
          verification_code: MOBILE_VERIFY_CODE,
        },
        {
          where: {
            [Op.and]: [{ email: payload.email }, { bvn: payload.bvn }],
          },
        },
      );

        
      return res.status(200).json({
        status: 200,
        message: 'Please insert the verification code sent to the mobile number you provided on registration',
        data: {
          mobile_link: MOBILE_REDIRECT_LINK
        },
      })

    }).catch((err) => {
      log(err);
        return res.status(400).json({
          status: 400,
          error: err,
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

    let payload = await jwt.verify(key);

    if (!payload) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com',
      });
    }

    let verifying_user = await Couriers.findOne({
      where: {
        [Op.and]: [{ email: payload.email }, { bvn: payload.bvn }],
      },
    });

    if (!verifying_user) {
      return res.status(404).json({
        status: 404,
        error: 'You currently cannot perform this action. Please contact our help support and report the scenerio to them. mailto:support@koogah.com',
      });
    }

    if (!verifying_user.verification_code) {
      return res.status(400).json({
        status: 400,
        error: 'Oops, seems you have already verified your email and mobile number.',
      });
    }

    if (verifying_user.verification_code !== code) {
      return res.status(400).json({
        status: 400,
        error: 'The code you supplied do not match the code you received. Please try again or resend code',
        resend_link:`${isProduction ? 'https' : 'http'}://${process.env.SERVER_APP_URL}/verify/email?key=${key}&code=COURIER`,
      });
    }

    verifying_user = verifying_user.getSafeDataValues();

    payload = {
      email: verifying_user.email,
      bvn: verifying_user.bvn,
      first_name: verifying_user.first_name,
      mobile_number: verifying_user.mobile_number,
      is_courier: verifying_user.is_courier,
    };

    const APPROVAL_TOKEN = await jwt.sign(payload, '9000h');
    const APPROVAL_LINK = (isProduction) ? `https://${process.env.DISPATCHER_MOBILE_APP_HOST}/approval?key=${APPROVAL_TOKEN}&code=APPROVED` : `http://localhost:4000/approval?key=${APPROVAL_TOKEN}&code=APPROVED`;

    const AWAITING_USER_OBJ = {
      first_name: payload.first_name,
      bvn: payload.bvn,
      last_name: verifying_user.last_name,
      user_email: payload.email,
      mobile_number: payload.mobile_number,
      sex: verifying_user.sex,
      approval_link: APPROVAL_LINK,
    };

    // Insert the user in the awaiting user's db.
    // send the user details as mail to the company.

    const MSG_OBJ = createCourierApprovalMail(AWAITING_USER_OBJ);
    return Promise.try(async () => {
      await Couriers.update(
        {
          verification_code: null,
          verify_token: null,
          is_verified: true,
          approval_code: APPROVAL_TOKEN,
        },
        {
          where: {
            [Op.and]: [{ email: payload.email }, { bvn: payload.bvn }],
          },
        },
      );
      await Awaitings.create(AWAITING_USER_OBJ);
      await sendMail(MSG_OBJ);
      return res.status(200).json({
        status:200,
        message: 'Registration complete, your account is now awaiting approval.',
      })

    }).catch((err) => {
      log(err);
        return res.status(400).json({
          status: 400,
          error: err,
        });
    })
  }

  /**
   * @method signUpCourier_StepFour
   * @description This method approves a courier and sets them up to use the app. Admin Endpoint
   * @memberof UserController
   * @params req, res
   * @return JSON object
   */

  static async signUpCourier_StepFour(req, res) {
    const { password, bank_name, account_number } = req.body;
    const { key } = req.query;
    // make a cleanup of this scenerio
    const payload = await jwt.verify(key);

    if (!payload) {
      return res.status(400).json({
        status: 400,
        error: 'Oops, seems this token has expired',
      });
    }

    const isFound = await Couriers.findOne({
      where: {
        email: payload.email,
      },
    });

    if (!isFound) {
      return res.status(404).json({
        status: 404,
        error: 'This user doesn\t exists anymore',
      });
    }

    if (!isFound.approval_code) {
      return res.status(400).json({
        status: 400,
        error: 'Oops, seems this user has already been approved.',
      });
    }

    return Promise.try(async () => {
      const hashed_password = await bcrypt.hash(password, 8);
      await Couriers.update(
        {
          is_approved: true,
          approval_code: null,
          is_active: true,
          password: hashed_password,
          account_number,
          bank_name
        },
        {
          where: {
            email: payload.email,
          },
        },
      );
      await Awaitings.destroy({
        where: {
          user_email: payload.email,
        },
      });
      const approved_user = await Couriers.findOne({
        where: {
          email: payload.email,
        },
      });
      const user = {
        ...approved_user.getSafeDataValues(),
      };
      // send original courier a mail, telling them they have been approved.
      let APPROVED_USER_OBJ = {
        first_name: user.first_name,
        user_email: user.email,
        last_name: user.last_name
      }
      const msg_obj = createApprovalMailToCourier(APPROVED_USER_OBJ);
      await sendMail(msg_obj);

      return res.status(200).json({
        status: 200,
        message: 'Account approved successfully',
        data: user,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
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
    let {
      first_name,
      last_name,
      mobile_number_one,
      country_code,
      email,
      password,
    } = req.body;

    const { ref, fromApp } = req.query;

    if (country_code === "+234") {
      var firstDigit = mobile_number_one[0].toString();
      if (firstDigit === '0') {
        mobile_number_one = mobile_number_one.substring(1, mobile_number_one.length);
       }
    }

    const isFound = await Customers.findOne({
      where: {
        email
      },
    });

    if (isFound) {
      return res.status(400).json({
        status: 400,
        error: 'A user with the given email already exists',
      });
    }
    const VERIFY_TOKEN = await jwt.sign({
      email,
      first_name,
      mobile_number_one: `${country_code}${mobile_number_one}`,
      last_name,
      is_courier: false,
    });
    let VERIFY_LINK = '';
    if (fromApp && fromApp === 'web') {
      VERIFY_LINK = `https://${process.env.LANDING_PAGE_APP_HOST}/verify_email?key=${VERIFY_TOKEN}&code=CUSTOMER`;
    } else {
      VERIFY_LINK = `https://${process.env.CUSTOMER_MOBILE_APP_HOST}/verify_email?key=${VERIFY_TOKEN}&code=CUSTOMER`;
    }
    const USR_OBJ = {
      first_name,
      last_name,
      verify_link: VERIFY_LINK,
    };
    const REFERAL_ID = generate_ref('referal');

    const codes = [
      {
        code: '+234',
        value: 'nigeria'
      }
    ]
    const user_nationality = codes.find((c) => c.code === country_code).value;

    const NEW_USER = {
      first_name: first_name.toLowerCase(),
      last_name: last_name.toLowerCase(),
      mobile_number_one,
      email: email.toLowerCase(),
      password,
      nationality: user_nationality,
      verify_token: VERIFY_TOKEN,
      referal_id: REFERAL_ID,
      refered_by: ref ? ref : null,
    };

    const MSG_OBJ = createVerificationMail(email, USR_OBJ, 'customer');

    return Promise.try(async () => {
      await sendMail(MSG_OBJ);
      await Customers.create(NEW_USER);
      return res.status(200).json({
        status: 200,
        message: 'A verification link has been sent to your email address',
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method signUpCustomer_StepTwo
   * @description This method sends verification code to the user's mobile number
   * @memberof UserController
   * @params req, res
   * @return JSON object
   */
  static async signUpCustomer_StepTwo(req, res) {
    return Promise.try(async () => {
      const { key } = req.query;
      const payload = await jwt.verify(key);
      if (!payload) {
        return res.status(400).json({
          status: 400,
          error: 'Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com',
        });
      }

    const verifying_user = await Customers.findOne({
      where: {
        email: payload.email,
      },
    });

    if (!verifying_user) {
      return res.status(404).json({
        status: 404,
        error: 'You currently cannot perform this action. Please contact our help support and report the scenario to them. mailto:support@koogah.com',
      });
    }

    if (!verifying_user.verify_token) {
      return res.status(400).json({
        status: 400,
        error: 'Oops, seems you have already verified your email and mobile number.',
      });
    }
    const MOBILE_VERIFY_CODE = gen_verify_code();

    const SMS_MESSAGE = `Your verification code is: \n${MOBILE_VERIFY_CODE}`;

    const MOBILE_REDIRECT_LINK = `https://${process.env.SERVER_APP_URL}/customer/verify/email?key=${key}&live=${!!key}`;

    // this function should redirect the user to the Mobile App page
    // That contains the form so they can insert the code sent to their mobile phones
      
    await sendSMS(payload.mobile_number_one, SMS_MESSAGE);
    await Customers.update(
      {
        verification_code: MOBILE_VERIFY_CODE,
      },
      {
        where: {
          email: payload.email,
        },
      },
    );

    return res.status(200).json({
      status: 200,
      message: 'Please insert the verification code sent to the mobile number you provided on registration',
      data: {
        mobile_link:  MOBILE_REDIRECT_LINK
      },
    })

    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
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

    if (!payload) {
      return res.status(400).json({
        status: 400,
        error: 'Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com',
      });
    }

    const verifying_user = await Customers.findOne({
      where: {
        email: payload.email,
      },
    });

    if (!verifying_user) {
      return res.status(404).json({
        status: 404,
        error: 'You currently cannot perform this action. Please contact our help support and report the scenerio to them. mailto:support@koogah.com',
      });
    }

    if (!verifying_user.verification_code) {
      return res.status(400).json({
        status: 400,
        error: 'Oops, seems you have already verified your email and mobile number.',
      });
    }

    if (verifying_user.verification_code !== code) {
      return res.status(400).json({
        status: 400,
        error: 'The code you supplied do not match the code you received. Please try again or resend code',
        resend_link: (isProduction) ? `${process.env.SERVER_APP_URL}/user/customer/verify/email?key=${key}&code=CUSTOMER` : `http://localhost:4000/v1/user/customer/verify/email?key=${key}&code=CUSTOMER`,
      });
    }

    const { iat, exp, ...data } = payload;
    const SESSION_TOKEN = await jwt.sign({
      ...data,
    });
    const REFRESH_TOKEN = j_w_t.sign(data, process.env.SECRET_KEY);
    const NEW_NOTIFICATION = {
      email: verifying_user.email,
      type: 'customer',
      desc: 'CD001',
      message: 'Hi, we at Koogah are glad to have you with us \nRemember to top-up your account and refer other users. \nReferring other users can earn you upto N200',
      title: 'Welcome to Koogah',
    };
    return Promise.try(async () => {
      await Customers.update(
        {
          verification_code: null,
          verify_token: null,
          is_verified: true,
          is_active: true,
          koogah_coin: 10,
        },
        {
          where: {
            email: payload.email,
          },
        },
      );
      await Notifications.create({ ...NEW_NOTIFICATION });
      const approved_user = await Customers.findOne({
        where: {
          email: payload.email,
        },
      });
      client.set(`${approved_user.email}:CUSTOMER`, SESSION_TOKEN);
      const user = {
        token: SESSION_TOKEN,
        refresh_token: REFRESH_TOKEN,
        ...approved_user.getSafeDataValues(),
      };
      res.status(200).json({
        status: 200,
        message: 'Account created successfully',
        data: user,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method signInCourier
   * @memberof UserController
   * @description This method signs in a courier into session
   * @params req, res
   * @return JSON object
   */
  static signInCourier(req, res) {
    const { email, password } = req.body;
    let SESSION_TOKEN = '';
    return Promise.try(async () => {
      let isFound = await Couriers.findOne({
        where: {
          email,
        },
      });
      if (!isFound) {
        return res.status(404).json({
          status: 404,
          error: 'Found no dispatcher with the given email address',
        });
      }
      const do_password_match = await isFound.decryptPassword(password);
      if (!do_password_match) {
        return res.status(409).json({
          status: 409,
          error: 'Email and/or Password do not match',
        });
      }
      isFound = isFound.getSafeDataValues();
      const SESSION_USER = {
        first_name: isFound.first_name,
        last_name: isFound.last_name,
        email: isFound.email,
        bvn: isFound.bvn,
        is_courier: isFound.is_courier,
        is_admin: isFound.is_admin,
      };

      SESSION_TOKEN = await jwt.sign(SESSION_USER, '24h');
      const REFRESH_TOKEN = j_w_t.sign(SESSION_USER, process.env.SECRET_KEY);
      const user = isFound;
      user.token = SESSION_TOKEN;
      user.refresh_token = REFRESH_TOKEN;
      client.set(`${user.email}:COURIER`, SESSION_TOKEN);
      return res.status(200).json({
        status: 200,
        message: 'Logged in successfully',
        data: user,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method signInCustomer
   * @memberof UserController
   * @description This method signs in a customer into session
   * @params req, res
   * @return JSON object
   */
  static signInCustomer(req, res) {
    const { email, password } = req.body;
    let SESSION_TOKEN = '';
    return Promise.try(async () => {
      let isFound = await Customers.findOne({
        where: {
          email,
        },
      });
      if (!isFound) {
        return res.status(404).json({
          status: 404,
          error: 'Found no user with the given email address',
        });
      }
      const do_password_match = await isFound.decryptPassword(password);
      if (!do_password_match) {
        return res.status(409).json({
          status: 409,
          error: 'Email and/or Password do not match',
        });
      }
      if (!isFound.is_verified) {
        return res.status(404).json({
          status: 401,
          error: 'Cannot login until you have verified your account. Please check your email for a verification link sent to you',
        });
      }

      isFound = isFound.getSafeDataValues();

      const SESSION_USER = {
        first_name: isFound.first_name,
        last_name: isFound.last_name,
        email: isFound.email,
        mobile_number_one: isFound.mobile_number_one,
        is_courier: isFound.is_courier,
        is_admin: isFound.is_admin,
      };

      SESSION_TOKEN = await jwt.sign(SESSION_USER, '24h');
      const REFRESH_TOKEN = j_w_t.sign(SESSION_USER, process.env.SECRET_KEY);
      const user = isFound;
      user.token = SESSION_TOKEN;
      user.refresh_token = REFRESH_TOKEN;
      client.set(`${user.email}:CUSTOMER`, SESSION_TOKEN);
      return res.status(200).json({
        status: 200,
        message: 'Logged in successfully',
        data: user,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method use_refresh
   * @memberof UserController
   * @description This method allows a courier to rate a customer
   * @params req, res
   * @return JSON object
   */

  static use_refresh(req, res) {
    const { refresh_token } = req.query;
    let isFound = undefined;
    let user_type = undefined;
    return Promise.try(async () => {
      // verify token validity;
      const user = j_w_t.verify(refresh_token, process.env.SECRET_KEY);
      if (user) {
        let { iat, ...data } = user;
        // create a new token;
        const SESSION_TOKEN = await jwt.sign(data, '24h');
        if (user.is_courier) {
          user_type = 'COURIER';
          isFound = await Couriers.findOne({
            where: {
              email: user.email
            }
          })
        } else {
          user_type = 'CUSTOMER';
          isFound = await Customers.findOne({
            where: {
              email: user.email
            }
          })
        }

        if (!isFound) {
          return res.status(401).json({
            status: 401,
            error: 'User does not exist'
          })
        }

        const USER = isFound.getSafeDataValues();
        USER.token = SESSION_TOKEN;
        USER.refresh_token = refresh_token;
        client.set(`${USER.email}:${user_type}`, SESSION_TOKEN);

        return res.status(200).json({
          status: 200,
          message: 'Refresh Login successful',
          data: USER
        })

      } else {
        return res.status(401).json({
          status: 401,
          error: 'Not Authorized'
        })
      }
    }).catch((err) => {
    log(err);
    return res.status(400).json({
      status: 400,
      error: err,
    });
    })
  }
  
  /**
   * @method rate_a_customer
   * @memberof UserController
   * @description This method allows a courier to rate a customer
   * @params req, res
   * @return JSON object
   */
  static rate_a_customer(req, res) {
    const { user } = req.session;
    const { customer_id, package_id } = req.params;
    const { rating } = req.body;
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          [Op.and]: [{ dispatcher_id: user.id }, { customer_id }, { package_id }],
        },
      });

      if (!_package) {
        return res.status(400).json({
          status: 400,
          error: 'You cannot rate a customer you didn\t dispatch goods and/or services for',
        });
      }

      let customer = await Customers.findOne({
        where: {
          id: customer_id
        }
      })
      if (!customer) {
        return res.status(404).json({
          status: 404,
          error: 'Oops, seems the customer doesn\'t exists anymore',
        });
      }

      customer = customer.getSafeDataValues();

      const current_number_of_raters = (parseInt(customer.no_of_raters, 10) + 1);
      const new_rate_value = ((Number(customer.rating) * parseInt(customer.no_of_raters, 10) + parseInt(rating, 10)) / current_number_of_raters).toPrecision(2)
      await Customers.update({
        rating: new_rate_value,
        no_of_raters: current_number_of_raters
      },
      {
        where: {
          id: customer_id
        }
      }
      )

      return res.status(200).json({
        status: 200,
        message: `You successfully rated ${customer.first_name} ${customer.last_name}:, ${rating}`,
      });

    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

  /**
   * @method rate_a_courier
   * @memberof UserController
   * @description This method allows a customer to rate the service of a courier
   * @params req, res
   * @return JSON object
   */

  static rate_a_courier(req, res) {
    const { user } = req.session;
    const { dispatcher_id, package_id } = req.params;
    const { rating } = req.body;
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          [Op.and]: [{ customer_id: user.id }, { dispatcher_id }, { package_id }],
        },
      });
      if (!_package) {
        return res.status(400).json({
          status: 400,
          error: 'You cannot rate a dispatcher unless they currently or have dispatched for you',
        });
      }
      let dispatcher = await Couriers.findOne({
        where: {
          id: dispatcher_id,
        },
      });
      if (!dispatcher) {
        return res.status(404).json({
          status: 404,
          error: 'Oops, seems the dispatcher doesn\'t exists anymore',
        });
      }
      const current_number_of_raters = (parseInt(dispatcher.no_of_raters, 10) + 1);
      const new_rate_value = ((Number(dispatcher.rating) * parseInt(dispatcher.no_of_raters, 10) + parseInt(rating,10)) / current_number_of_raters).toPrecision(2)
      await Couriers.update({
        rating: new_rate_value,
        no_of_raters: current_number_of_raters,
      },
      {
        where: {
          id: dispatcher_id,
        },
      });
      dispatcher = dispatcher.getSafeDataValues();

      const new_ratings = {
        package_id,
        dispatcher_id,
        customer_id: user.id,
        rate_value: parseInt(rating, 10),
        user_type: 'customer'
      }

      await Ratings.create({ ...new_ratings });
      
      return res.status(200).json({
        status: 200,
        message: `You successfully rated ${dispatcher.first_name} ${dispatcher.last_name}: ${rating}`,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method sign_out
   * @memberof UserController
   * @description This method allows a user to signout
   * @params req, res
   * @return JSON object
   */

  static sign_out(req, res) {
    const { user } = req.session;
    const type = user.is_courier ? 'COURIER' : 'CUSTOMER';
    delete req.session.user;
    client.del(`${user.email}:${type}`);
    return Promise.try(() => res.status(200).json({
      status: 200,
      message: 'Logged out successfully',
    })).catch((error) => {
      log(error);
      return res.status(400).json({
        status: 400,
        error,
      });
    });
  }
  /**
   * @method report_customer
   * @memberof UserController
   * @description This method allows a courier to report a customer
   * @params req, res
   * @return JSON object
   */

  static report_user(req, res) {
    // reporting user in session
    const { user } = req.session;
    const { id } = req.params;
    const { report } = req.body;
    const type = user.is_courier ? 'courier' : 'customer';
    return Promise.try(async () => {
      let reported_user;
      if (type === 'courier') {
        reported_user = await Customers.findOne({
          where: {
            id,
          },
        });
      }
      if (type === 'customer') {
        reported_user = await Couriers.findOne({
          where: {
            id,
          },
        });
      }
      if (!reported_user) {
        return res.status(404).json({
          status: 404,
          error: `No ${type === 'courier' ? 'customer' : 'courier'} found with that ID`,
        });
      }
      reported_user = reported_user.getSafeDataValues();

      const NEW_REPORT = {
        email: reported_user.email,
        first_name: reported_user.first_name,
        last_name: reported_user.last_name,
        type: user.is_courier ? 'customer' : 'courier',
        report,
        reporter_email: user.email,
        reported_by: `${user.first_name} ${user.last_name}`,
        reporter_type: type,
      };
      const report_data = await Reports.create({ ...NEW_REPORT });
      // send a notification to Koogah email.
      // reports@koogah.com
      return res.status(200).json({
        status: 200,
        message: 'Report submitted successfully!',
        data: report_data,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }
  /**
   * @method request_password_reset
   * @memberof UserController
   * @description This method allows a user request password reset
   * @params req, res
   * @return JSON object
   */

  static request_password_reset(req, res) {
    const { email, account_type } = req.body;
    return Promise.try(async () => { 
      if (account_type === 'courier') {
        const isFound = await Couriers.findOne({
          where: {
            email
          }
        });
        if (!isFound) {
          return res.status(400).json({
            status: 400,
            error: 'No account associated with the provided email address'
          })
        }

        const PASSWORD_RESET_TOKEN = await jwt.sign({
          email,
          bvn: isFound.bvn,
          first_name: isFound.first_name,
          last_name: isFound.last_name,
          account_type,
        });

        // based on the account type, 
        // determine what frontend application to send the user to.
        const PASSWORD_RESET_LINK = `${isProduction ? 'https' : 'http'}://${process.env.DISPATCHER_MOBILE_APP_HOST}/password_reset?token=${PASSWORD_RESET_TOKEN}&code=COURIER`;

        const user_msg_obj = {
          first_name: isFound.first_name,
          last_name: isFound.last_name,
          user_email: email,
          password_reset_link: PASSWORD_RESET_LINK,
          account_type,
        };
        const MSG_OBJ = createPasswordResetEmail(user_msg_obj);

        await sendMail(MSG_OBJ);

        await Couriers.update({
          password_reset_token: PASSWORD_RESET_TOKEN
        }, {
          where: {
            email,
          }
        });
      } else if (account_type === 'customer') {
        const isFound = await Customers.findOne({
          where: {
            email,
          }
        });
        if (!isFound) {
          return res.status(400).json({
            status: 400,
            error: 'No account associated with the provided email address'
          })
        };
        const PASSWORD_RESET_TOKEN = await jwt.sign({
          email,
          bvn: isFound.mobile_number_one,
          first_name: isFound.first_name,
          last_name: isFound.last_name,
          account_type,
        });
        // based on the account type, 
        // determine what frontend application to send the user to.
        const PASSWORD_RESET_LINK = `${isProduction ? 'https' : 'http'}://${process.env.CUSTOMER_MOBILE_APP_HOST}/password_reset?token=${PASSWORD_RESET_TOKEN}&code=CUSTOMER`;
        const user_msg_obj = {
          first_name: isFound.first_name,
          last_name: isFound.last_name,
          user_email: email,
          password_reset_link: PASSWORD_RESET_LINK,
          account_type,
        };
        const MSG_OBJ = createPasswordResetEmail(user_msg_obj);

        await sendMail(MSG_OBJ);
        await Customers.update({
          password_reset_token: PASSWORD_RESET_TOKEN
        }, {
          where: {
            email,
          }
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'A password reset link has been sent to your email address'
      })
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

  /**
   * @method reset_password
   * @memberof UserController
   * @description This method allows a user reset their password
   * @params req, res
   * @return JSON object
   */
  static reset_password(req, res) {
    const { new_password } = req.body;
    const { token } = req.query;
    return Promise.try(async () => { 
      const USER = await jwt.verify(token);
      if (!USER) {
        return res.status(400).json({
          status: 400,
          error: 'Reset link expired, please request for a new password reset link'
        })
      }
      let isFound;

      if (USER.account_type === 'courier') {
        isFound = await Couriers.findOne({
          where: {
            email: USER.email
          }
        });
      } else if (USER.account_type === 'customer') {
        isFound = await Customers.findOne({
          where: {
            email: USER.email
          }
        });
      }
      if (!isFound) {
        return res.status(400).json({
          status: 400,
          error: 'Oops, user not found'
        })
      }
      if (!isFound.password_reset_token) {
        return res.status(400).json({
          status: 400,
          error: 'No password reset started for this user'
        })
      }
      if (isFound.password_reset_token !== token) {
        return res.status(400).json({
          status: 400,
          error: 'Invalid reset link, please request for a new password reset link'
        })
      }
      const saltRounds = 8;
      const ENCRYPTED_NEW_PASSWORD = await bcrypt.hash(new_password, saltRounds);
      
      if (USER.account_type === 'courier') {
        await Couriers.update({
          password: ENCRYPTED_NEW_PASSWORD,
          password_reset_token: null,
        }, {
          where: {
            email: USER.email
          }
        })
      } else if (USER.account_type === 'customer') {
        await Customers.update({
          password: ENCRYPTED_NEW_PASSWORD,
          password_reset_token: null,
        }, {
          where: {
          email: USER.email
        }})
      }
      return res.status(200).json({
        status: 200,
        message: 'Password reset successful'
      })
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

  /**
   * @method is_session_valid
   * @memberof UserController
   * @description This method allows us check if a user session is valid
   * @params req, res
   * @return JSON object
   */

  static is_session_valid(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      return res.status(200).json({
        status: 200,
        data: { ...user },
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

   /**
   * @method change_password
   * @memberof UserController
   * @description This method allows us check if a user session is valid
   * @params req, res
   * @return JSON object
   */

  static change_password(req, res) { 
    return Promise.try(async () => {
      const bcrypt = require('bcrypt');
      const { user } = req.session;
      const { old_password, new_password } = req.body;
  
      // confirm the old password
      let main_user;
      if (user.is_courier) { 
        main_user = await Couriers.findOne({
          where: {
            email: user.email
          }
        });

        if (!main_user) return res.status(400).json({
          status: 400,
          error: 'Oops, no user found here'
        });
        const is_old_password_valid = await main_user.decryptPassword(old_password)

        if (!is_old_password_valid) { 
          return res.status(409).json({
            status: 409,
            error: 'Old password is incorrect'
          })
        }
        

        const hashed_password = await bcrypt.hash(new_password, 8);

        await Couriers.update({
          password:hashed_password
        }, {
          where: {
            email: user.email
          }
        });

      } else {
        main_user = await Customers.findOne({
          where: {
            email: user.email
          }
        });
     

        if (!main_user) return res.status(400).json({
          status: 400,
          error: 'Oops, no user found here'
        });

        const is_old_password_valid = await main_user.decryptPassword(old_password)

        if (!is_old_password_valid) { 
          return res.status(409).json({
            status: 409,
            error: 'Old password is incorrect'
          })
        }

        const hashed_password = await bcrypt.hash(new_password, 8);

        await Customers.update({
          password:hashed_password
        }, {
          where: {
            email: user.email
          }
        });
      }

      return res.status(200).json({
        status: 200,
        message: 'Password changed successfully',
      })
    }).catch(error => {
      log(error);
      return res.status(400).json({
        status: 400,
        error
      })
    }) 
  }

   /**
   * @method has_rated_dispatcher
   * @memberof UserController
   * @description This method checks if a customer has rated a dispatcher
   * @params req, res
   * @return JSON object
   */


  static has_rated_dispatcher(req, res) {
    return Promise.try(async () => { 
      const { user } = req.session;
      const { dispatcher_id, package_id } = req.params;
      const hasRated = await Ratings.findOne({
        where: {
          [Op.and]: [{ package_id }, { dispatcher_id }, { customer_id: user.id }, { user_type: 'customer' }]
        }
      });
      if (hasRated) { 
        return res.status(200).json({
          status: 200,
          message: 'rate data retrieved',
          data: {
            has_rated: true
          }
        });
      } else {
        return res.status(200).json({
          status: 200,
          message: 'rate data retrieved',
          data: {
            has_rated: false,
          }
        });
      }
    }).catch(error => {
      log(error);
      return res.status(400).json({
        status: 400,
        error
      });
    });
  }

}

export default UserController;
