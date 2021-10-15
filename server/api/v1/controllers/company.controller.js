import sendSMS from '../helpers/sms';
import gen_verify_code from '../helpers/verify.code';
import jwt from '../helpers/jwt';
import client from '../../../redis/redis.client';
import j_w_t from 'jsonwebtoken';
import { config } from 'dotenv';
import bcrypt from 'bcrypt';
import log from 'fancy-log';
import Sequelize from 'sequelize';
import generate_ref from '../helpers/ref.id';
import calculage_daterange_percentage from '../helpers/calc.date_range_percentage';

import sendMail, { 
  createVerificationMail,
  createEmergencyContactMail,
  createCompanyApprovalMail,
  createKoogahWelcomeMailToCompany,
  createCompanyDispatcherVerificationMail,
  createPasswordResetEmail,
} from '../helpers/mail';

import {
  Companies,
  CompanyAwaitings,
  Couriers,
  PackagesTrackings,
  Packages,
  Transactions,
} from '../../../database/models';
import { sendUnApprovedCompanyNotification } from '../helpers/slack';
import moment from 'moment';
import { saveToSpreadsheet } from '../helpers/spreadsheet.save';


const { Op } = Sequelize;

const isProduction = process.env.NODE_ENV === 'production';

config();

/**
 * @class CompanyController
 */

class CompanyController {
  /**
   * @method signUpCompany_StepOne
   * @memberof CompanyController
   * @description This method sends a verification link to the company email
   * @params req, res
   * @return JSON object
   */

  static async signUpCompany_StepOne(req, res) {
    return Promise.try(async () => {
      let {
        business_name,
        nin,
        first_name,
        last_name,
        country_code,
        email,
        phone,
        business_address,
        business_state,
        business_town,
        business_country
      } = req.body;

      if (country_code === "+234") {
        var firstDigit = phone[0].toString();
        if (firstDigit === '0') {
          phone = phone.substring(1, phone.length);
        }
      }

      const VERIFY_TOKEN = await jwt.sign({
        email,
        nin,
        first_name,
        phone: `${country_code}${phone}`,
        country_code: country_code
      }, '168h');

      let VERIFY_LINK = `${isProduction ? 'https' : 'http'}://${isProduction ? `www.${process.env.LANDING_PAGE_APP_HOST}` : 'localhost:8080'}/company/verify/email?key=${VERIFY_TOKEN}&code=COMPANY`;

      const USR_OBJ = {
        first_name,
        last_name,
        verify_link: VERIFY_LINK,
      };

      const NEW_COMPANY = {
        business_name,
        nin,
        first_name,
        last_name,
        email,
        phone,
        business_address,
        business_state,
        business_town,
        business_country
      };
      const MSG_OBJ = createVerificationMail(email, USR_OBJ, 'company');

      const isFound = await Companies.findOne({
        where: {
          [Op.or]: [
            {email}, {nin}
          ]
        }
      });

      if (isFound) {
        return res.status(409).json({
          status: 409,
          error: 'A user with the given email and/or nin already exists',
        });
      }
      await sendMail(MSG_OBJ);
      await Companies.create(NEW_COMPANY);
      const spreadsheet_data = {
        FirstName: NEW_COMPANY.first_name,
        LastName: NEW_COMPANY.last_name,
        EmailAddress: NEW_COMPANY.email,
        PhoneNumber: NEW_COMPANY.phone,
        BusinessName: NEW_COMPANY.business_name,
      };
      await saveToSpreadsheet('company', spreadsheet_data);
      return res.status(200).json({
        status: 200,
        message: 'You will receive a verification link in your provided email shortly.',
        verify_token: VERIFY_TOKEN,
      })

    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    }) ;
  }
  
  /**
   * @method signUpCompany_StepTwo
   * @memberof CompanyController
   * @description This method allows a company verify their email
   * @params req, res
   * @return JSON object
   */

  static async signUpCompany_StepTwo(req, res) {
    return Promise.try(async () => {
      const { key } = req.query;
      const payload = await jwt.verify(key);
      if (!payload) {
        return res.status(400).json({
          status: 400,
          error: 'Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com',
        });
      }
      const verifying_user = await Companies.findOne({
        where: {
          [Op.and]: [{email: payload.email}, {nin: payload.nin}],
        },
      });
      if (!verifying_user) {
        return res.status(404).json({
          status: 404,
          error: 'You currently cannot perform this action. Please contact our help support and report the scenerio to them. mailto:support@koogah.com',
        });
      }
      const MOBILE_VERIFY_CODE = gen_verify_code();
      const SMS_MESSAGE = `Your Koogah verification code is: \n${MOBILE_VERIFY_CODE}`;
      const MOBILE_REDIRECT_LINK = `${process.env.SERVER_APP_URL}/company/verify/email?key=${key}&live=${!!key}`;
      if (!verifying_user.verify_token) {
        return res.status(400).json({
          status: 400,
          error: 'Oops, seems you have already verified your email and mobile number.',
        });
      }
      await sendSMS(`${payload.country_code ? payload.country_code : '+234'}${verifying_user.phone}`, SMS_MESSAGE);

      await Companies.update(
        {
          verification_code: MOBILE_VERIFY_CODE,
        },
        {
          where: {
            [Op.and]: [{email: payload.email}, {nin: payload.nin}]
          }
        }
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
   * @method signUpCompany_StepThree
   * @memberof CompanyController
   * @description This method allows a company verify their mobile number
   * @params req, res
   * @return JSON object
   */

  static async signUpCompany_StepThree(req, res) {
    return Promise.try(async () => {
      const { key } = req.query;
      const { code } = req.body;

      let payload = await jwt.verify(key);

      if (!payload) {
        return res.status(400).json({
          status: 400,
          error: 'Invalid Token, Please contact our support team to lay any complains. mailto::support@koogah.com',
        });
      }

      let verifying_user = await Companies.findOne({
        where: {
          [Op.and]: [{email: payload.email}, {nin: payload.nin}],
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
          resend_link:`${process.env.SERVER_APP_URL}/company/verify/email?key=${key}&live=${!!key}`,
        });
      }

      verifying_user = verifying_user.getSafeDataValues();

      payload = {
        email: verifying_user.email,
        nin: verifying_user.nin,
        first_name: verifying_user.first_name,
        last_name: verifying_user.last_name,
        phone: verifying_user.phone,
      }
      const APPROVAL_TOKEN = await jwt.sign(payload, '9000h');
      const APPROVAL_LINK = (isProduction) ? `https://www.${process.env.LANDING_PAGE_APP_HOST}/company/approval?key=${APPROVAL_TOKEN}&code=APPROVED` : `http://localhost:4000/company/approval?key=${APPROVAL_TOKEN}&code=APPROVED&type=COMPANY`;

      const AWAITING_COMPANY_OBJ = {
        first_name: verifying_user.first_name,
        last_name: verifying_user.last_name,
        user_email: verifying_user.email,
        nin: verifying_user.nin,
        phone: verifying_user.phone,
        business_name: verifying_user.business_name,
        business_country: verifying_user.business_country,
        approval_link: APPROVAL_LINK,
      };
      const KOOGAH_MSG_OBJ = createCompanyApprovalMail(AWAITING_COMPANY_OBJ);
      const USER_MSG_OBJ = createEmergencyContactMail(verifying_user.email, verifying_user, 'Company');

      await Companies.update(
        {
          verification_code: null,
          verify_token: null,
          is_verified: true,
          approval_code: APPROVAL_TOKEN,
        },
        {
          where: {
            [Op.and]: [{email: verifying_user.email}, {nin: verifying_user.nin}]
          }
        }
      );

      await CompanyAwaitings.create(AWAITING_COMPANY_OBJ);
      await sendMail(KOOGAH_MSG_OBJ);
      await sendMail(USER_MSG_OBJ);
      sendUnApprovedCompanyNotification(AWAITING_COMPANY_OBJ);
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
   * @method signUpCompany_StepFour
   * @memberof CompanyController
   * @description This method allows a company complete their registration
   * @params req, res
   * @return JSON object
   */

  static async signUpCompany_StepFour(req, res) {
    return Promise.try(async () => {
      const { password, bank_name, account_number } = req.body;
      const { key } = req.query;
      const payload = await jwt.verify(key);
      if (!payload) {
        return res.status(400).json({
          status: 400,
          error: 'Oops, seems this token has expired',
        });
      }

      const isFound = await Companies.findOne({
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
      const hashed_password = await bcrypt.hash(password, 8);
      await Companies.update(
        {
          is_approved: true,
          approval_code: null,
          is_active: true,
          password: hashed_password,
          bank_account_name: bank_name,
          bank_account_number: account_number,
        },
        {
          where: {
            email: payload.email,
          },
        }
      );
      await CompanyAwaitings.destroy({
        where: {
          user_email: payload.email,
        },
      });

      const approved_company = await Companies.findOne({
        where: {
          email: payload.email,
        }
      });

      const user = {
        ...approved_company.getSafeDataValues(),
      };
      let APPROVED_USER_OBJ = {
        first_name: user.first_name,
        user_email: user.email,
        last_name: user.last_name
      }
      const msg_obj = createKoogahWelcomeMailToCompany(APPROVED_USER_OBJ);
      await sendMail(msg_obj);
      return res.status(200).json({
        status: 200,
        message: 'Account approved successfully, Proceed to login',
        data: user,
      });
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

  /**
   * @method signInCompany
   * @memberof CompanyController
   * @description This method signs in a courier into session
   * @params req, res
   * @return JSON object
   */

  static signInCompany(req, res) {
    return Promise.try(async () => {
      const { email, password } = req.body;
      let SESSION_TOKEN = '';
      let isFound = await Companies.findOne({
        where: {
          email,
        }
      });
      if (!isFound) {
        return res.status(404).json({
          status: 404,
          error: 'Found no company with the given email address',
        });
      }
      if (isFound.is_active == false) {
        return res.status(404).json({
          status: 401,
          error: 'Your account is not approved to proceed.',
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
        nin: isFound.nin,
      };
      SESSION_TOKEN = await jwt.sign(SESSION_USER, '168h');
      const REFRESH_TOKEN = j_w_t.sign(SESSION_USER, process.env.SECRET_KEY);

      const user = isFound;

      client.set(`${user.email}:COMPANY`, SESSION_TOKEN);
      return res.status(200).json({
        status: 200,
        message: 'Logged in successfully',
        data: user,
        token: SESSION_TOKEN,
        refresh_token: REFRESH_TOKEN
      });
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }
  
  /**
   * @method companyRegisterDispatcherStepOne
   * @memberof CompanyController
   * @description This method allows a company to register a dispatcher
   * @params req, res
   * @return JSON object
   */
  static companyRegisterDispatcherStepOne(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      let { email } = req.body;
      const EMAIL_VERIFY_CODE = gen_verify_code();
      const REFERAL_ID = generate_ref('referal');
      const isFound = await Couriers.findOne({
        where: {
          email,
        }
      });
      if (isFound && isFound.is_approved) {
        return res.status(409).json({
          status: 409,
          error: 'A dispatcher with the given email address already exists',
        });
      }
      const msg_obj = createCompanyDispatcherVerificationMail(email, user, EMAIL_VERIFY_CODE);
      const NEW_COMPANY_DISPATCHER = {
        company_id: user.id,
        is_cooperate: true,
        first_name: 'un_set',
        last_name: 'un_set',
        mobile_number: 'un_set',
        email,
        state: 'un_set',
        town: 'un_set',
        address: 'un_set',
        nationality: 'un_set',
        sex: 'un_set',
        profile_image: 'un_set',
        referal_id: REFERAL_ID,
        is_verified: false,
        verify_token: EMAIL_VERIFY_CODE.toString(),
        is_active: false,
        is_approved: false,
        owns_automobile: true,
        done_dispatch_before: true,
      };
      if (!isFound) {
        await Couriers.create(NEW_COMPANY_DISPATCHER);
      } else {
        await Couriers.update(
          {
            verify_token: EMAIL_VERIFY_CODE.toString(),
          },
          {
            where: {
              email: isFound.email
            }
          }
        );
      }
      await sendMail(msg_obj);
      return res.status(200).json({
        status: 200,
        message: 'Please enter the code sent to the email address provided'
      });
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method companyRegisterDispatcherTwo
   * @memberof CompanyController
   * @description This method allows a company to register a dispatcher
   * @params req, res
   * @return JSON object
   */

  static companyRegisterDispatcherTwo(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const {
        email_verify_code,
        email,
      } = req.body;
      const registering_dispatcher = await Couriers.findOne({
        where: {
          email,
          company_id: user.id
        }
      });
      if (!registering_dispatcher) {
        return res.status(404).json({
          status: 404,
          error: `No dispatcher with the email address ${email}, for company ${user.business_name}`,
        });
      }
      if (email_verify_code !== registering_dispatcher.verify_token) {
        return res.status(404).json({
          status: 404,
          error: 'The code supplied is wrong',
        });
      }
      await Couriers.update(
        {
          verify_token: null,
        },
        {
          where: {
            email,
            company_id: user.id
          }
        }
      )
      return res.status(200).json({
        status: 200,
        message: 'success'
      });

    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

  /**
   * @method companyRegisterDispatcherStepThree
   * @memberof CompanyController
   * @description This method allows a company to register a dispatcher
   * @params req, res
   * @return JSON object
   */

  static companyRegisterDispatcherStepThree(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      let { mobile_number, email, country_code } = req.body;
      if (country_code === "+234") {
        var firstDigit = mobile_number[0].toString();
        if (firstDigit === '0') {
          mobile_number = mobile_number.substring(1, mobile_number.length);
         }
      }
      const MOBILE_VERIFY_CODE = gen_verify_code();
      const isFound = await Couriers.findOne({
        where: {
          email,
          company_id: user.id,
        }
      });

      if (!isFound) return res.status(404).json({
        status: 404,
        error: 'Dispatcher not found',
      });
      await Couriers.update(
        {
          mobile_number,
          verification_code: MOBILE_VERIFY_CODE,
        },
        {
          where: {
            email,
          }
        }
      );
      const SMS_MESSAGE = `Your Koogah verification code is: \n${MOBILE_VERIFY_CODE}`;
      await sendSMS(`${country_code ? country_code : '+234'}${mobile_number}`, SMS_MESSAGE);
      return res.status(200).json({
        status: 200,
        message: 'Please insert the verification code sent to the mobile number you provided',
      })
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

  /**
   * @method companyRegisterDispatcherStepFour
   * @memberof CompanyController
   * @description This method allows a company to register a dispatcher
   * @params req, res
   * @return JSON object
   */

  static companyRegisterDispatcherStepFour(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const { email, mobile_verify_code } = req.body;
      const isFound = await Couriers.findOne({
        where: {
          email,
          company_id: user.id,
        }
      });
      if (!isFound) return res.status(404).json({
        status: 404,
        error: 'Dispatcher not found',
      });

      if (mobile_verify_code !== isFound.verification_code) {
        return res.status(400).json({
          status: 400,
          error: 'The code you supplied is wrong',
        });
      }

      await Couriers.update(
        {
          verification_code: null,
        },
        {
          where: {
            email,
            company_id: user.id,
          }
        }
      )
      return res.status(200).json({
        status: 200,
        message: 'success'
      });
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method companyRegisterDispatcherStepFive
   * @memberof CompanyController
   * @description This method allows a company to register a dispatcher
   * @params req, res
   * @return JSON object
   */

  static companyRegisterDispatcherStepFive(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      let {
        profile_image,
        first_name,
        last_name,
        email,
        password,
        state,
        town,
        address,
        nationality,
        sex,
      } = req.body;

      let isFound = await Couriers.findOne({
        where: {
          email,
          company_id: user.id,
        }
      });
      if (!isFound) {
        return res.status(409).json({
          status: 409,
          error: 'Dispatcher is not found',
        });
      }
      if (isFound.is_approved) {
        return res.status(409).json({
          status: 409,
          error: 'Dispatcher is already approved to dispatch on Koogah',
        });
      }
      const hashed_password = await bcrypt.hash(password, 8);
      await Couriers.update(
        {
          profile_image,
          first_name,
          last_name,
          state,
          town,
          address,
          password: hashed_password,
          nationality,
          sex,
          rating: 1,
          no_of_raters: 1,
          is_verified: true,
          is_approved: true,
          is_active: true,
          approval_code: null,
          owns_automobile: true,
          done_dispatch_before: true,
        },
        {
          where: {
            email,
            company_id: user.id,
          }
        }
      );
      const NEW_COMPANY_DISPATCHER = await Couriers.findOne({
        where: {
          company_id: user.id,
          email,
        }
      });
      const spreadsheet_data = {
        FirstName: NEW_COMPANY_DISPATCHER.first_name,
        LastName: NEW_COMPANY_DISPATCHER.last_name,
        EmailAddress: NEW_COMPANY_DISPATCHER.email,
        PhoneNumber: NEW_COMPANY_DISPATCHER.mobile_number,
      };
      await saveToSpreadsheet('courier', spreadsheet_data);
      return res.status(200).json({
        status: 200,
        message: 'Dispatcher created successfully, they can now log in',
      });
      
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method companyGetProfile
   * @memberof CompanyController
   * @description This method allows a company to get own profile
   * @params req, res
   * @return JSON object
   */
  static companyGetProfile(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const all_dispatchers = await Couriers.findAll({
        where: {
          [Op.and]: [
            { company_id: user.id },
            {
              virtual_balance: {
                [Op.gt]: 0,
              }
            }
          ]
        }
      });
      let totalWalletAmount = all_dispatchers.reduce((acc, curr) => {
        acc = acc + Number(curr.virtual_balance);
        return acc;
      }, 0);
      user.current_wallet_balance = totalWalletAmount;
      return res.status(200).json({
        status: 200,
        data:user,
      })
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method companyGetAllDispatchers
   * @memberof CompanyController
   * @description This method allows a company to get all dispatchers
   * @params req, res
   * @return JSON object
   */

  static companyGetAllDispatchers(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      let {
        orderBy,
        orderDir,
        field,
        fieldValue,
        page,
        limit,
      } = req.query;
      if (!orderBy) orderBy = 'created_at';
      if (!orderDir) orderDir = 'DESC';
      if (!field) field = 'is_active';
      if (!fieldValue) fieldValue = true;
      if (!page) page = 0;
      if (!limit) limit = 15;
      let offset = page * limit;
      const allDispatchers = await Couriers.findAndCountAll(
        {
          limit: limit,
          offset: offset,
          where: {
            [Op.and]: [
              {
                company_id: user.id,
              },
              {
                [field]: fieldValue,
              }
            ]
          },
          order: [
            [orderBy, orderDir]
          ],
          attributes: [
            'address',
            'created_at',
            'deliveries',
            'email',
            'first_name',
            'last_name',
            'id',
            'is_currently_dispatching',
            'mobile_number',
            'nationality',
            'pickups',
            'profile_image',
            'rating',
            'sex',
            'referal_id',
            'state',
            'town',
          ]
        }
      );
      let result = {
        count: allDispatchers.count,
        currentPage: Number(page) + 1,
        totalPages: Math.ceil(allDispatchers.count / limit),
        rows: allDispatchers.rows,

      }
      return res.status(200).json({
        status: 200,
        message: 'Data retrieved successfully',
        data: {
          ...result,
        }
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
   * @method getSingleDispatcherTotalMoneyMade
   * @memberof CompanyController
   * @description This method allows a company to get a single dispatcher total money made
   * @params req, res
   * @return JSON object
   */

  static getSingleDispatcherTotalMoneyMade(id) {
    return Promise.try(async () => {
      let result = {
        current_month: 0,
        last_month: 0,
        total_value: 0,
        increased: false,
        percent: 0.0,
      };
      let current_period_from;
      let current_period_to;
      let last_period_from;
      let last_period_to;

      current_period_from = moment().clone().startOf('month').format();
      current_period_to = moment().clone().endOf('month').format();
      last_period_from = moment(current_period_from).subtract(1, 'month').format();
      last_period_to = moment(current_period_to).subtract(1, 'month').format();

      const all_time_collection = await Transactions.findAll({
        where: {
          [Op.and]: [
            {
              dispatcher_id: id
            },
            {
              reason: 'dispatch-payment',
            },
          ]
        }
      });
      if (all_time_collection) {
        const all_time_amount = all_time_collection.reduce((acc, curr) => {
          acc = acc + Number(curr.amount_paid);
          return acc;
        }, 0);
  
        result.total_value = all_time_amount;
  
        const current_period_collection = await Transactions.findAll({
          where: {
            [Op.and]: [
              {
                dispatcher_id: id
              },
              {
                reason: 'dispatch-payment',
              },
              {
                created_at: {
                  [Op.and]: [
                    {
                      [Op.gte]: current_period_from,
                    },
                    {
                      [Op.lte]: current_period_to
                    }
                  ]
                }
              }
            ]
          }
        });
        const last_period_collection = await Transactions.findAll({
          where: {
            [Op.and]: [
              {
                dispatcher_id: id
              },
              {
                reason: 'dispatch-payment',
              },
              {
                created_at: {
                  [Op.and]: [
                    {
                      [Op.gte]: last_period_from,
                    },
                    {
                      [Op.lte]: last_period_to,
                    }
                  ]
                }
              }
            ]
          }
        });
        let current_period_num_value = 0;
        let last_period_num_value = 0;
        if (current_period_collection.length > 0 && last_period_collection.length <= 0) {
          current_period_num_value = current_period_collection.reduce((acc, curr) => {
            acc = acc + Number(curr.amount_paid);
            return acc;
          }, 0);
          // calculate percentage.
          let pc = calculage_daterange_percentage(current_period_num_value, 0);
          let increased = pc > 0 ? true : pc === 0 ? false : false;
          result = {
            ...result,
            current_month: current_period_num_value,
            last_month: 0,
            increased,
            percent: pc,
          };
        }
        if (current_period_collection.length <= 0 && last_period_collection.length > 0) {
            last_period_num_value = last_period_collection.reduce((acc, curr) => {
              acc = acc + Number(curr.amount_paid);
              return acc;
            }, 0);
            // calculate percentage.
            let pc = calculage_daterange_percentage(0, last_period_num_value);
            let increased = pc > 0 ? true : pc === 0 ? false : false;
            result = {
              ...result,
              current_month: 0,
              last_month: last_period_num_value,
              increased,
              percent: pc,
            };
          }
  
          if (current_period_collection.length >= 0 && last_period_collection.length >= 0) {
            current_period_num_value = current_period_collection.reduce((acc, curr) => {
              acc = acc + Number(curr.amount_paid);
              return acc;
            }, 0);
  
            last_period_num_value = last_period_collection.reduce((acc, curr) => {
              acc = acc + Number(curr.amount_paid);
              return acc;
            }, 0);
  
             // calculate percentage.
             let pc = calculage_daterange_percentage(current_period_num_value, last_period_num_value);
             let increased = pc > 0 ? true : pc === 0 ? false : false;
              result = {
               ...result,
               current_month: current_period_num_value,
               last_month: last_period_num_value,
               increased,
               percent: pc,
             };
          }
          return result;
      } else {
        return result;
      }


    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

  /**
   * @method getSingleDispatcherTotalDeliveries
   * @memberof CompanyController
   * @description This method allows a company to get a single dispatcher total delivery overview
   * @params req, res
   * @return JSON object
   */

  static getSingleDispatcherTotalDeliveries(id) {
    return Promise.try(async () => {
      let result = {
        current_month: 0,
        last_month: 0,
        increased: false,
        total_value: 0,
        percent: 0.0,
      };
      let current_period_from;
      let current_period_to;
      let last_period_from;
      let last_period_to;

      current_period_from = moment().clone().startOf('month').format();
      current_period_to = moment().clone().endOf('month').format();
      last_period_from = moment(current_period_from).subtract(1, 'month').format();
      last_period_to = moment(current_period_to).subtract(1, 'month').format();

      const all_time_collection = await Packages.findAndCountAll({
        where: {
          [Op.and]: [
            {
              dispatcher_id: id,
            },
            {
              status: 'delivered'
            }
          ]
        }
      });

      if (all_time_collection.count > 0) {
        result.total_value = all_time_collection.count;

        const current_period_collection = await Packages.findAll({
          where: {
            [Op.and]: [
              {
                dispatcher_id: id,
              },
              {
                status: 'delivered'
              },
              {
                created_at: {
                  [Op.and]: [
                    {
                      [Op.gte]: current_period_from,
                    },
                    {
                      [Op.lte]: current_period_to
                    }
                  ]
                }
              }
            ]
          },
        });

        const last_period_collection = await Packages.findAll({
          where: {
            [Op.and]: [
              {
                dispatcher_id: id,
              },
              {
                status: 'delivered'
              },
              {
                created_at: {
                  [Op.and]: [
                    {
                      [Op.gte]: last_period_from,
                    },
                    {
                      [Op.lte]: last_period_to,
                    }
                  ]
                }
              }
            ]
          }
        });
        let current_period_num_value = 0;
        let last_period_num_value = 0;
        if (current_period_collection.length > 0 && last_period_collection.length <= 0) {
          current_period_num_value = current_period_collection.length;
          // calculate percentage.
          let pc = calculage_daterange_percentage(current_period_num_value, 0);
          let increased = pc > 0 ? true : pc === 0 ? false : false;
          result = {
            ...result,
            current_month: current_period_num_value,
            last_month: 0,
            increased,
            percent: pc,
          };
        }
        if (current_period_collection.length <= 0 && last_period_collection.length > 0) {
            last_period_num_value = last_period_collection.length;
            // calculate percentage.
            let pc = calculage_daterange_percentage(0, last_period_num_value);
            let increased = pc > 0 ? true : pc === 0 ? false : false;
            result = {
              ...result,
              current_month: 0,
              last_month: last_period_num_value,
              increased,
              percent: pc,
            };
          }
  
          if (current_period_collection.length >= 0 && last_period_collection.length >= 0) {
            current_period_num_value = current_period_collection.length;
  
            last_period_num_value = last_period_collection.length;
  
             // calculate percentage.
             let pc = calculage_daterange_percentage(current_period_num_value, last_period_num_value);
             let increased = pc > 0 ? true : pc === 0 ? false : false;
              result = {
               ...result,
               current_month: current_period_num_value,
               last_month: last_period_num_value,
               increased,
               percent: pc,
             };
          }
          return result;
      } else {
        return result;
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
   * @method companyGetSingleDispatcher
   * @memberof CompanyController
   * @description This method allows a company to get a single dispatcher
   * @params req, res
   * @return JSON object
   */

  static companyGetSingleDispatcher(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const dispatcher_id = req.params.id;
      let result = {}
      const isFound = await Couriers.findOne({
        where: {
          [Op.and]: [
            { id: dispatcher_id },
            { company_id: user.id }]
        },
        attributes: [
          'address',
          'created_at',
          'deliveries',
          'email',
          'first_name',
          'last_name',
          'id',
          'is_currently_dispatching',
          'mobile_number',
          'nationality',
          'pickups',
          'profile_image',
          'rating',
          'sex',
          'referal_id',
          'state',
          'town',
        ]
      });
      if (!isFound) return res.status(404).json({
        status: 404,
        error: 'The dispatcher cannot be viewed by you, or does not exist.'
      });
      result.dispatcher = isFound;
      result.total_money_made_overview = await CompanyController.getSingleDispatcherTotalMoneyMade(isFound.id);
      result.total_delivery_overview = await CompanyController.getSingleDispatcherTotalDeliveries(isFound.id);
      return res.status(200).json({
        status: 200,
        message: 'Data retrieved successfully',
        data: result,
      });
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

  /**
   * @method companyGetWalletBalance
   * @memberof CompanyController
   * @description This method allows a company to get their wallet balance
   * @params req, res
   * @return JSON object
  */
  
  static companyGetWithdrawableWalletBalance(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const all_dispatchers = await Couriers.findAll({
        where: {
          [Op.and]: [
            { company_id: user.id },
            {
              virtual_balance: {
                [Op.gt]: 0,
              }
            },
            {
              is_currently_dispatching: false,
            }
          ]
        }
      });
      let amount = all_dispatchers.reduce((acc, curr) => {
        acc = acc + Number(curr.virtual_balance);
        return acc;
      }, 0);
      return res.status(200).json({
        status: 200,
        data: {
          withdrawable_balance: amount,
        }
      });
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
   }

  /**
   * @method companyGetSingleDispatcherTracking
   * @memberof CompanyController
   * @description This method allows a company to get tracking data of a dispatcher
   * @params req, res
   * @return JSON object
  */
  
  static companyGetSingleDispatcherTracking(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const dispatcher_id  = req.params.id;
      // check if dispatcher exists
      const isFound = await Couriers.findOne({
        where: {
          [Op.and]: [
            {
              id: dispatcher_id
            },
            {
              company_id: user.id
            }
          ]
        }
      });
      if (!isFound) return res.status(404).json({
        status: 404,
        error: 'Sorry, this dispatcher does not exists for your company'
      });
      // check if dispatcher is currently dispatching.
      if (!isFound.is_currently_dispatching) {
        return res.status(401).json({
          status: 401,
          error: 'Sorry, this dispatcher is not currently dispatching any package'
        });
      }
      // else, find the package the dispatcher is dispatching in currently tracking.
      const tracking_package = await PackagesTrackings.findOne({
        where: {
          dispatcher_id,
        }
      });
      return res.status(200).json({
        status: 200,
        message: 'Data retrieved successfully',
        data: {
          tracking_package: tracking_package,
          dispatcher: isFound.getSafeDataValues(),
        }
      });
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

   /**
   * @method company_request_password_reset
   * @memberof CompanyController
   * @description This method allows a company request password reset
   * @params req, res
   * @return JSON object
   */

  static company_request_password_reset(req, res) {
    return Promise.try(async () => {
      const { email } = req.body;
      const isFound = await Companies.findOne({
        where: {
          email,
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
        first_name: isFound.first_name,
        last_name: isFound.last_name,
      });
      const PASSWORD_RESET_LINK = `${isProduction ? 'https' : 'http'}://${process.env.LANDING_PAGE_APP_HOST}/customer/password_reset?token=${PASSWORD_RESET_TOKEN}&code=COMPANY`;

      const user_msg_obj = {
        first_name: isFound.first_name,
        last_name: isFound.last_name,
        user_email: email,
        password_reset_link: PASSWORD_RESET_LINK,
        account_type: 'company',
      };

      const MSG_OBJ = createPasswordResetEmail(user_msg_obj);
      await sendMail(MSG_OBJ);
      await Companies.update({
        password_reset_token: PASSWORD_RESET_TOKEN
      }, {
        where: {
          email,
        }
      });
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
   * @method company_reset_password
   * @memberof CompanyController
   * @description This method allows a company request password reset
   * @params req, res
   * @return JSON object
   */

  static company_reset_password(req, res) {
    return Promise.try(async () => {
      const { new_password } = req.body;
      const { token } = req.query;
      const USER = await jwt.verify(token);
      if (!USER) {
        return res.status(400).json({
          status: 400,
          error: 'Reset link expired, please request for a new password reset link'
        })
      }
      const isFound = await Companies.findOne(
        {
          where: {
            email: isFound.email
          }
        }
      );

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
      await Companies.update(
        {
          password: ENCRYPTED_NEW_PASSWORD,
          password_reset_token: null
        },
        {
          where: {
            email: isFound.email
          }
        }
      );
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
   * @method company_use_refresh
   * @memberof companyController
   * @description This method allows a company refresh their token to discourage numerous login
   * @params req, res
   * @return JSON object
   */

     static company_use_refresh(req, res) {
      const { refresh_token } = req.query;
      let isFound = undefined;

      return Promise.try(async () => {
        // verify token validity;
        const user = j_w_t.verify(refresh_token, process.env.SECRET_KEY);
        if (user) {
          let { iat, ...data } = user;
          // create a new token;
          const SESSION_TOKEN = await jwt.sign(data, '168h');
          isFound = await Companies.findOne({
            where: {
              email: user.email
            }
          })
  
          if (!isFound) {
            return res.status(401).json({
              status: 401,
              error: 'User does not exist'
            })
          }
  
          const USER = isFound.getSafeDataValues();
          const all_dispatchers = await Couriers.findAll({
            where: {
              [Op.and]: [
                { company_id: USER.id },
                {
                  virtual_balance: {
                    [Op.gt]: 0,
                  }
                }
              ]
            }
          });
          let totalWalletAmount = all_dispatchers.reduce((acc, curr) => {
            acc = acc + Number(curr.virtual_balance);
            return acc;
          }, 0);

          USER.current_wallet_balance = totalWalletAmount;
          
          client.set(`${USER.email}:COMPANY`, SESSION_TOKEN);
          return res.status(200).json({
            status: 200,
            message: 'Refresh Login successful',
            data: USER,
            token: SESSION_TOKEN,
            refresh_token: refresh_token
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
   * @method get_total_earnings
   * @memberof companyController
   * @description This method allows a company get their total earnings
   * @params req, res
   * @return JSON object
   */

  static get_total_earnings(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const { time_frame } = req.query;
      let current_period_from;
      let current_period_to;
      let last_period_from;
      let last_period_to;

      let current_period_collection = [];
      let last_period_collection = [];
      let result = {
        current_month: 0,
        last_month: 0,
        total_value: 0,
        increased: false,
        percent: 0.0,
      };
      // get all active dispatchers.
      const allDispatchers = await Couriers.findAll({
        where: {
          company_id: user.id,
          is_active: true,
        }
      });

      // total earnings is total payout + current balance.
      if (allDispatchers) {
        let currentBalance = allDispatchers.reduce((acc, curr) => {
          acc = acc + Number(curr.virtual_balance);
          return acc;
        }, 0);
        result.total_value = Number(user.total_payouts) + currentBalance;

        if (time_frame === 'days') {
          current_period_from = moment().clone().startOf('day').format();
          current_period_to = moment().clone().endOf('day').format();
          last_period_from = moment(current_period_from).subtract(1, 'day').format();
          last_period_to = moment(current_period_to).subtract(1, 'day').format();
        }
        if (time_frame === 'weeks') {
          current_period_from = moment().clone().startOf('isoweek').format();
          current_period_to = moment().clone().endOf('isoweek').format();
          last_period_from = moment(current_period_from).subtract(1, 'week').format();
          last_period_to = moment(current_period_to).subtract(1, 'week').format();
        }
        if (time_frame === 'months') {
          current_period_from = moment().clone().startOf('month').format();
          current_period_to = moment().clone().endOf('month').format();
          last_period_from = moment(current_period_from).subtract(1, 'month').format();
          last_period_to = moment(current_period_to).subtract(1, 'month').format();
        }
        let current_period_list= await Transactions.findAll({
          where: {
            [Op.and]: [
              {
                reason: 'dispatch-payment',
              },
              {
                created_at: {
                  [Op.and]: [
                    {
                      [Op.gte]: current_period_from,
                    },
                    {
                      [Op.lte]: current_period_to
                    }
                  ]
                }
              }
            ]
          }
        });
      let last_period_list = await Transactions.findAll({
          where: {
            [Op.and]: [
              {
                reason: 'dispatch-payment',
              },
              {
                created_at: {
                  [Op.and]: [
                    {
                      [Op.gte]: last_period_from,
                    },
                    {
                      [Op.lte]: last_period_to,
                    }
                  ]
                }
              }
            ]
          }
        });

        for(var i=0; i<allDispatchers.length; i++) {
          for(var j=0; j<current_period_list.length; j++) {
            if(allDispatchers[i].id == current_period_list[j].dispatcher_id) {
              current_period_collection.push(current_period_list[j])
            }
          }
        }

        for(var i=0; i<allDispatchers.length; i++) {
          for(var j=0; j<last_period_list.length; j++) {
            if(allDispatchers[i].id == last_period_list[j].dispatcher_id) {
              last_period_collection.push(current_period_list[j])
            }
          }
        }
        let current_period_num_value = 0;
        let last_period_num_value = 0;
        if (current_period_collection.length <= 0 && last_period_collection.length <=0 ) {
          return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: result,
          })
        }
        if (current_period_collection.length > 0 && last_period_collection.length <= 0) {
          current_period_num_value = current_period_collection.reduce((acc, curr) => {
            if (curr) {
              acc = acc + Number(curr.amount_paid);
              return acc;
            } else {
              return acc;
            }
          }, 0);
          // calculate percentage.
          let pc = calculage_daterange_percentage(current_period_num_value, 0);
          let increased = pc > 0 ? true : pc === 0 ? false : false;
          result = {
            ...result,
            current_month: current_period_num_value,
            last_month: 0,
            increased,
            percent: pc,
          };
          return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: result,
          })
        }
        if (current_period_collection.length <= 0 && last_period_collection.length > 0) {
          last_period_num_value = last_period_collection.reduce((acc, curr) => {
            if (curr) {
              acc = acc + Number(curr.amount_paid);
              return acc;
            } else {
              return acc;
            }
          }, 0);
          // calculate percentage.
          let pc = calculage_daterange_percentage(0, last_period_num_value);
          let increased = pc > 0 ? true : pc === 0 ? false : false;
          result = {
            ...result,
            current_month: 0,
            last_month: last_period_num_value,
            increased,
            percent: pc,
          };
          return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: result,
          })
        }
        if (current_period_collection.length >= 0 && last_period_collection.length >= 0) {
          current_period_num_value = current_period_collection.reduce((acc, curr) => {
            if (curr) {
              acc = acc + Number(curr.amount_paid);
              return acc;
            } else {
              return acc;
            }
          }, 0);

          last_period_num_value = last_period_collection.reduce((acc, curr) => {
            if (curr) {
              acc = acc + Number(curr.amount_paid);
              return acc;
            } else {
              return acc;
            }
          }, 0);

           // calculate percentage.
           let pc = calculage_daterange_percentage(current_period_num_value, last_period_num_value);
           let increased = pc > 0 ? true : pc === 0 ? false : false;
            result = {
             ...result,
             current_month: current_period_num_value,
             last_month: last_period_num_value,
             increased,
             percent: pc,
           };
           return res.status(200).json({
             status: 200,
             message: 'Data retrieved successfully',
             data: result,
           })
        }
      } else {
        return res.status(200).json({
          status: 200,
          message: 'Data retrieved successfully',
          data: result,
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
   * @method get_total_dispatchers_overview
   * @memberof companyController
   * @description This method allows a company get their total dispatchers overview
   * @params req, res
   * @return JSON object
   */

  static get_total_dispatchers_overview(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const { time_frame } = req.query;
      let current_period_from;
      let current_period_to;
      let last_period_from;
      let last_period_to;

      let current_period_collection = [];
      let last_period_collection = [];
      let result = {
        current_month: 0,
        last_month: 0,
        total_value: 0,
        increased: false,
        percent: 0.0,
      };
      const allDispatchers = await Couriers.findAndCountAll({
        where: {
          company_id: user.id,
          is_active: true,
        }
      });

      if (allDispatchers.count > 0) {
        result.total_value = allDispatchers.count;
        if (time_frame === 'days') {
          current_period_from = moment().clone().startOf('day').format();
          current_period_to = moment().clone().endOf('day').format();
          last_period_from = moment(current_period_from).subtract(1, 'day').format();
          last_period_to = moment(current_period_to).subtract(1, 'day').format();
        }
        if (time_frame === 'weeks') {
          current_period_from = moment().clone().startOf('isoweek').format();
          current_period_to = moment().clone().endOf('isoweek').format();
          last_period_from = moment(current_period_from).subtract(1, 'week').format();
          last_period_to = moment(current_period_to).subtract(1, 'week').format();
        }
        if (time_frame === 'months') {
          current_period_from = moment().clone().startOf('month').format();
          current_period_to = moment().clone().endOf('month').format();
          last_period_from = moment(current_period_from).subtract(1, 'month').format();
          last_period_to = moment(current_period_to).subtract(1, 'month').format();
        }
        current_period_collection = await Couriers.findAll({
          where: {
            [Op.and]: [
              {
                company_id: user.id,
              },
              {
                is_active: true,
              },
              {
                created_at: {
                  [Op.and]: [
                    {
                      [Op.gte]: current_period_from,
                    },
                    {
                      [Op.lte]: current_period_to
                    }
                  ],
                }
              }
            ]
          }
        });
        last_period_collection = await Couriers.findAll({
          where: {
            [Op.and]: [
              {
                company_id: user.id,
              },
              {
                is_active: true,
              },
              {
                created_at: {
                  [Op.and]: [
                    {
                      [Op.gte]: last_period_from,
                    },
                    {
                      [Op.lte]: last_period_to
                    }
                  ],
                }
              }
            ]
          }
        });
        let current_period_num_value = 0;
        let last_period_num_value = 0;
        if (current_period_collection.length <= 0 && last_period_collection.length <=0 ) {
          return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: result,
          })
        }
        if (current_period_collection.length > 0 && last_period_collection.length <= 0) {
          current_period_num_value = current_period_collection.length;
          // calculate percentage.
          let pc = calculage_daterange_percentage(current_period_num_value, 0);
          let increased = pc > 0 ? true : pc === 0 ? false : false;
          result = {
            ...result,
            current_month: current_period_num_value,
            last_month: 0,
            increased,
            percent: pc,
          };
          return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: result,
          })
        }
        if (current_period_collection.length <= 0 && last_period_collection.length > 0) {
          last_period_num_value = last_period_collection.length
          // calculate percentage.
          let pc = calculage_daterange_percentage(0, last_period_num_value);
          let increased = pc > 0 ? true : pc === 0 ? false : false;
          result = {
            ...result,
            current_month: 0,
            last_month: last_period_num_value,
            increased,
            percent: pc,
          };
          return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: result,
          })
        }
        if (current_period_collection.length >= 0 && last_period_collection.length >= 0) {
          current_period_num_value = current_period_collection.length;
          last_period_num_value = last_period_collection.length;

           // calculate percentage.
           let pc = calculage_daterange_percentage(current_period_num_value, last_period_num_value);
           let increased = pc > 0 ? true : pc === 0 ? false : false;
          result = {
             ...result,
             current_month: current_period_num_value,
             last_month: last_period_num_value,
             increased,
             percent: pc,
           };
           return res.status(200).json({
             status: 200,
             message: 'Data retrieved successfully',
             data: result,
           })
        }
      } else {
        return res.status(200).json({
          status: 200,
          message: 'Data retrieved successfully',
          data: result,
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
   * @method get_total_deliveries_overview
   * @memberof companyController
   * @description This method allows a company get their total dispatcher deliveries
   * @params req, res
   * @return JSON object
   */

  static get_total_deliveries_overview(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const { time_frame } = req.query;
      let current_period_from;
      let current_period_to;
      let last_period_from;
      let last_period_to;

      let current_period_collection = [];
      let last_period_collection = [];
      let result = {
        current_month: 0,
        last_month: 0,
        total_value: 0,
        increased: false,
        percent: 0.0,
      };

      // get all active dispatchers.
      const allDispatchers = await Couriers.findAll({
        where: {
          company_id: user.id,
          is_active: true,
        }
      });

      if (allDispatchers) {
        result.total_value = allDispatchers.reduce((acc, curr) => {
          acc = acc + Number(curr.deliveries);
          return acc;
        }, 0);

        if (time_frame === 'days') {
          current_period_from = moment().clone().startOf('day').format();
          current_period_to = moment().clone().endOf('day').format();
          last_period_from = moment(current_period_from).subtract(1, 'day').format();
          last_period_to = moment(current_period_to).subtract(1, 'day').format();
        }
        if (time_frame === 'weeks') {
          current_period_from = moment().clone().startOf('isoweek').format();
          current_period_to = moment().clone().endOf('isoweek').format();
          last_period_from = moment(current_period_from).subtract(1, 'week').format();
          last_period_to = moment(current_period_to).subtract(1, 'week').format();
        }
        if (time_frame === 'months') {
          current_period_from = moment().clone().startOf('month').format();
          current_period_to = moment().clone().endOf('month').format();
          last_period_from = moment(current_period_from).subtract(1, 'month').format();
          last_period_to = moment(current_period_to).subtract(1, 'month').format();
        }
        let current_period_list = [];
        let last_period_list = [];
        current_period_collection = await Packages.findAndCountAll({
          where: {
            [Op.and]: [
              {
                status: 'delivered'
              },
              {
                created_at: {
                  [Op.and]: [
                    {
                      [Op.gte]: current_period_from,
                    },
                    {
                      [Op.lte]: current_period_to
                    }
                  ]
                }
              }
            ]
          }
        })
        last_period_collection = await Packages.findAndCountAll({
          where: {
            [Op.and]: [
              {
                status: 'delivered'
              },
              {
                created_at: {
                  [Op.and]: [
                    {
                      [Op.gte]: last_period_from,
                    },
                    {
                      [Op.lte]: last_period_to
                    }
                  ]
                }
              }
            ]
          }
        });
        
        for(var i=0; i<allDispatchers.length; i++) {
          for (var j=0; j<current_period_collection.rows.length; j++) {
            if(allDispatchers[i].id == current_period_collection.rows[j].dispatcher_id){
              current_period_list.push(current_period_collection.rows[j])
            }
          }
        }

        for(var i=0; i<allDispatchers.length; i++) {
          for (var j=0; j<last_period_collection.rows.length; j++) {
            if(allDispatchers[i].id == last_period_collection.rows[j].dispatcher_id){
              last_period_list.push(last_period_collection.rows[j])
            }
          }
        }

        let current_period_num_value = 0;
        let last_period_num_value = 0;
        if (current_period_list.length <= 0 && last_period_list.length <=0 ) {
          return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: result,
          })
        }
        if (current_period_list.length > 0 && last_period_list.length <= 0) {
          current_period_num_value = current_period_list.length;
          // calculate percentage.
          let pc = calculage_daterange_percentage(current_period_num_value, 0);
          let increased = pc > 0 ? true : pc === 0 ? false : false;
          result = {
            ...result,
            current_month: current_period_num_value,
            last_month: 0,
            increased,
            percent: pc,
          };
          return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: result,
          })
        }
        if (current_period_list.length <= 0 && last_period_list.length > 0) {
          last_period_num_value = last_period_list.length;
          // calculate percentage.
          let pc = calculage_daterange_percentage(0, last_period_num_value);
          let increased = pc > 0 ? true : pc === 0 ? false : false;
          result = {
            ...result,
            current_month: 0,
            last_month: last_period_num_value,
            increased,
            percent: pc,
          };
          return res.status(200).json({
            status: 200,
            message: 'Data retrieved successfully',
            data: result,
          })
        }

        if (current_period_list.length >= 0 && last_period_list.length >= 0) {
          current_period_num_value = current_period_list.length;

          last_period_num_value = last_period_list.length;

           // calculate percentage.
           let pc = calculage_daterange_percentage(current_period_num_value, last_period_num_value);
           let increased = pc > 0 ? true : pc === 0 ? false : false;
            result = {
             ...result,
             current_month: current_period_num_value,
             last_month: last_period_num_value,
             increased,
             percent: pc,
           };
           return res.status(200).json({
             status: 200,
             message: 'Data retrieved successfully',
             data: result,
           })
        }
      } else {
        return res.status(200).json({
          status: 200,
          message: 'Data retrieved successfully',
          data: result,
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
   * @method get_new_dispatchers_count
   * @memberof companyController
   * @description This method allows a company get new dispatcher count.
   * @params req, res
   * @return JSON object
   */

  static get_new_dispatchers_count(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      let timestamp_benchmark = moment().subtract(4, 'days').format();
      const all_new_signups = await Couriers.findAndCountAll({
        where: {
          [Op.and]: [
            {
              company_id: user.id,
            },
            {
              is_cooperate: true,
            },
            {
              is_active: true,
            },
            {
              created_at: {
                [Op.gte]: timestamp_benchmark
              },
            }
          ],
        },
        attributes: [
          'address',
          'created_at',
          'deliveries',
          'email',
          'first_name',
          'last_name',
          'id',
          'is_currently_dispatching',
          'mobile_number',
          'nationality',
          'pickups',
          'profile_image',
          'rating',
          'sex',
          'referal_id',
          'state',
          'town',
        ]
      });
      return res.status(200).json({
        status: 200,
        message: 'Data retrieved successfully',
        data: all_new_signups,
      });
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method get_single_dispatcher_delivery_history
   * @memberof companyController
   * @description This method allows a company get a single dispatcher package delivery history.
   * @params req, res
   * @return JSON object
   */

  static get_single_dispatcher_delivery_history(req, res)  {
    return Promise.try(async () => {
      const { user } = req.session;
      const { id } = req.params;
      let { page, limit } = req.query;
      if (!page) page = 0;
      if (!limit) limit = 15;
      let offset = page * limit;
      // first get the dispatcher to be sure the user owns them.
      const dispatcher = await Couriers.findOne({
        where: {
          [Op.and]: [
            { company_id: user.id },
            {id: id}
          ]
        }
      });
      if (!dispatcher) {
        return res.status(404).json({
          status: 404,
          error: 'You are not allowed to view this dispatcher profile, or this profile doesnot exist'
        });
      }
      
      const delivery_history = await Packages.findAndCountAll({
        limit: limit,
        offset: offset,
        where: {
          dispatcher_id: id,
        },
        order: [
          ['status', 'DESC'],
          ['created_at', 'DESC']
        ],
        attributes: [
          'status',
          'package_id',
          'pickup_address',
          'dropoff_address',
          'description',
          'created_at',
          'delivery_price'
        ]
      });
      let result = {
        count: delivery_history.count,
        currentPage: Number(page) + 1,
        totalPages: Math.ceil(delivery_history.count / limit),
        rows: delivery_history.rows,
      }
      return res.status(200).json({
        status: 200,
        message: 'Data retrieved successfully',
        data: {
          ...result,
        }
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
   * @method edit_dispatcher_details
   * @memberof companyController
   * @description This method allows a company edit a single dispatcher details.
   * @params req, res
   * @return JSON object
   */

  static edit_dispatcher_details(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const { id } = req.params;
      const { ...data } = req.body;
      // first find the dispatcher...

      if (data.mobile_number) {
        var firstDigit = data.mobile_number[0].toString();
        if (firstDigit === '0') {
          data.mobile_number = data.mobile_number.substring(1, data.mobile_number.length);
        }
      }

      const isFound = await Couriers.findOne({
        where: {
          [Op.and]: [
            {
              company_id: user.id,
            },
            {
              id,
            },
            {
              is_active: true,
            }
          ]
        }
      });
      if (!isFound) {
        return res.status(404).json({
          status: 404,
          error: 'Dispatcher not found.'
        })
      }
      await Couriers.update(
        {
          ...data,
        },
        {
          where: {
            [Op.and]: [
              {
                company_id: user.id,
              },
              {
                id,
              }
            ]
          }
        }
      );

      const updated_dispatcher = await Couriers.findOne({
        where: {
          [Op.and]: [
            {
              company_id: user.id,
            },
            {
              id,
            }
          ]
        },
        attributes: [
          'address',
            'created_at',
            'deliveries',
            'email',
            'first_name',
            'last_name',
            'id',
            'is_currently_dispatching',
            'mobile_number',
            'nationality',
            'pickups',
            'profile_image',
            'rating',
            'sex',
            'referal_id',
            'state',
            'town',
        ],
      });
      return res.status(200).json({
        status: 200,
        message: 'Data updated successfully',
        data: updated_dispatcher
      })
    }).catch(err => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method company_update_profile
   * @memberof companyController
   * @description This method allows a company to update their profile.
   * @params req, res
   * @return JSON object
   */

  static company_update_profile(req, res) {
    return Promise.try(async () => {
      const { user } = req.session;
      const { ...data } = req.body;
      const isFound = await Companies.findOne({
        where: {
          id: user.id,
        }
      });
      if (isFound) {
        await Companies.update({ ...data }, {
          where: {
            id: user.id,
          }
        });
        const updated_user = await Companies.findOne({
          where: {
            id: user.id,
          },
        });
        return res.status(200).json({
          status: 200,
          message: 'Data updated successfully',
          data:  updated_user.getSafeDataValues()
        })
      } else {
        return res.status(400).json({
          status: 404,
          error: 'User not found'
        })
      }
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

}


export default CompanyController;
