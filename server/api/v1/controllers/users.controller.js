/* eslint-disable no-underscore-dangle */
/* eslint-disable max-len */
/* eslint-disable import/no-cycle */
/* eslint-disable camelcase */
import { config } from 'dotenv';
import log from 'fancy-log';
import Sequelize from 'sequelize';
import {
  Couriers, Awaitings, Customers, Packages, Notifications, Reports,
} from '../../../database/models';
import sendSMS from '../helpers/sms';
import gen_verify_code from '../helpers/verify.code';
import jwt from '../helpers/jwt';
import sendMail, { 
    createVerificationMail, 
    createCourierApprovalMail,
    createApprovalMailToCourier
  } from '../helpers/mail';
import client from '../../../redis/redis.client';
import generate_ref from '../helpers/ref.id';


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
        address,
      } = req.body;
      const { ref } = req.query;

      const VERIFY_TOKEN = await jwt.sign({
        email,
        bvn,
        first_name,
        mobile_number,
      });
      // link hint: https://api.koogah.com
      // this should be the frontend link based on the registering user
      // not the SERVER_APP_URL
      const VERIFY_LINK = (isProduction) ? `${process.env.SERVER_APP_URL}/user/verify/email?key=${VERIFY_TOKEN}&code=COURIER` : `http://localhost:4000/v1/user/verify/email?key=${VERIFY_TOKEN}&code=COURIER`;
  
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
        password,
        mobile_number,
        sex,
        bvn,
        nationality,
        verify_token: VERIFY_TOKEN,
        state,
        town,
        address,
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
  
      const MOBILE_REDIRECT_LINK = `https://mobile_redirect_link?key=${key}&live=${!!key}`;
  
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
        message: 'Please insert the verification code sent to the mobile number you provided on registeration',
        mobile: MOBILE_REDIRECT_LINK,
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
        resend_link: (isProduction) ? `${process.env.SERVER_APP_URL}/user/verify/email?key=${key}&code=COURIER` : `http://localhost:4000/v1/user/verify/email?key=${key}&code=COURIER`,
      });
    }

    payload = {
      email: verifying_user.email,
      bvn: verifying_user.bvn,
      first_name: verifying_user.first_name,
      mobile_number: verifying_user.mobile_number,
      is_courier: verifying_user.is_courier,
    };

    const APPROVAL_TOKEN = await jwt.sign(payload, '9000h');
    const APPROVAL_LINK = (isProduction) ? `${proces.env.SERVER_APP_URL}/user/approved/welcome?key=${APPROVAL_TOKEN}&code=APPROVED` : `http://localhost:4000/v1/user/approved/welcome?key=${APPROVAL_TOKEN}&code=APPROVED`;

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

    return Promise.all(
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
              [Op.and]: [{ email: payload.email }, { bvn: payload.bvn }],
            },
          },
        ),
        Awaitings.create(AWAITING_USER_OBJ),
      ],
    )
      .then((result) => Promise.resolve(result))
      .then(() => Promise.try(() => sendMail(MSG_OBJ)).then(() => res.status(200).json({
        status: 200,
        message: 'Registration complete, your account is now awaiting approval.',
      })).catch((err) => {
        log(err);
        return res.status(400).json({
          status: 400,
          error: err,
        });
      }))
      .catch((err) => {
        log(err);
        return res.send({ error: err });
      });
  }

  /**
   * @method signUpCourier_StepFour
   * @description This method approves a courier and sets them up to use the app. Admin Endpoint
   * @memberof UserController
   * @params req, res
   * @return JSON object
   */

  static async signUpCourier_StepFour(req, res) {
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

    return Promise.all(
      [
        Couriers.update(
          {
            is_approved: true,
            approval_code: null,
            is_active: true,

          },
          {
            where: {
              email: payload.email,
            },
          },
        ),
        Awaitings.destroy({
          where: {
            user_email: payload.email,
          },
        }),
      ],
    )
      .then(async () => {
        try{
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

        res.status(200).json({
          status: 200,
          message: 'Account approved successfully',
          user,

        });

        }catch(err){
          log(err);
          return res.status(400).json({
            status: 400,
            error: err,
          });
        }

      })
      .catch((err) => {
        log(err);
        return res.status(400).json({
          status: 400,
          error: err,
        });
      });
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
      mobile_number_one,
      country_code,
      email,
      password,
    } = req.body;

    const { ref } = req.query;

    const VERIFY_TOKEN = await jwt.sign({
      email,
      first_name,
      mobile_number_one,
      last_name,
      is_courier: false,
    });

    const VERIFY_LINK = (isProduction) ? `${process.env.SERVER_APP_URL}/user/customer/verify/email?key=${VERIFY_TOKEN}&code=CUSTOMER` : `http://localhost:4000/v1/user/customer/verify/email?key=${VERIFY_TOKEN}&code=CUSTOMER`;

    const USR_OBJ = {
      first_name,
      last_name,
      verify_link: VERIFY_LINK,
    };
    const REFERAL_ID = generate_ref('referal');

    const codes = [
      {
        code: '+234',
        value: 'nigerian'
      }
    ]
    const user_nationality = codes.find((c) => c.code === country_code).value;

    const NEW_USER = {
      first_name,
      last_name,
      mobile_number_one,
      email,
      password,
      nationality: user_nationality,
      verify_token: VERIFY_TOKEN,
      referal_id: REFERAL_ID,
      refered_by: ref ? ref : null,
    };

    const MSG_OBJ = createVerificationMail(email, USR_OBJ, 'customer');

    const isFound = await Customers.findOne({
      where: {
        email,
      },
    });

    if (isFound) {
      return res.status(400).json({
        status: 400,
        message: 'A user with the given email already exists',
      });
    }
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

    const MOBILE_REDIRECT_LINK = `https://mobile_redirect_link?key=${key}&live=${!!key}`;

    // this function should redirect the user to the Mobile App page
    // That contains the form so they can insert the code sent to their mobile phones
    await sendSMS(payload.mobile_number, SMS_MESSAGE);
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
      message: 'Please insert the verification code sent to the mobile number you provided on registeration',
      mobile: MOBILE_REDIRECT_LINK,
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
    })
    const NEW_NOTIFICATION = {
      email: verifying_user.email,
      type: 'customer',
      desc: 'CD001',
      message: 'Hi, we at Koogah are glad to have you with us \n Remember to top-up your account and refer other users \n refering other users can earn you upto N200',
      title: 'Welcome to Koogah',
    };
    return Promise.try(async () => {
      await Customers.update(
        {
          verification_code: null,
          verify_token: null,
          is_verified: true,
          is_active: true,
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
        ...approved_user.getSafeDataValues(),
        token: SESSION_TOKEN,
      };
      res.status(200).json({
        status: 200,
        message: 'Account created successfully',
        user,
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
      const isFound = await Couriers.findOne({
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
      const SESSION_USER = {
        first_name: isFound.first_name,
        last_name: isFound.last_name,
        email: isFound.email,
        bvn: isFound.bvn,
        is_courier: isFound.is_courier,
        is_admin: isFound.is_admin,
      };

      SESSION_TOKEN = await jwt.sign(SESSION_USER, '24h');
      const user = isFound.getSafeDataValues();
      user.token = SESSION_TOKEN;
      client.set(`${user.email}:COURIER`, SESSION_TOKEN);
      return res.status(200).json({
        status: 200,
        message: 'Logged in successfully',
        user,
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
      const isFound = await Customers.findOne({
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
      const SESSION_USER = {
        first_name: isFound.first_name,
        last_name: isFound.last_name,
        email: isFound.email,
        mobile_number_one: isFound.mobile_number_one,
        is_courier: isFound.is_courier,
        is_admin: isFound.is_admin,
      };

      SESSION_TOKEN = await jwt.sign(SESSION_USER, '24h');
      const user = isFound.getSafeDataValues();
      user.token = SESSION_TOKEN;
      client.set(`${user.email}:CUSTOMER`, SESSION_TOKEN);
      return res.status(200).json({
        status: 200,
        message: 'Logged in successfully',
        user,
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

      const customer = await Customers.findOne({
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
      const dispatcher = await Couriers.findOne({
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
      const new_rate_value = ((Number(dispatcher.rating) * parseInt(dispatcher.no_of_raters, 10) + parseInt(rating, 10)) / current_number_of_raters).toPrecision(2)
      await Couriers.update({
        rating: new_rate_value,
        no_of_raters: current_number_of_raters,
      },
      {
        where: {
          id: dispatcher_id,
        },
      });
      return res.status(200).json({
        status: 200,
        message: `You successfully rated ${dispatcher.first_name} ${dispatcher.last_name}:, ${rating}`,
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
    client.del(`${user.email}:${type}`);
    delete req.session.user;
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
}

export default UserController;
