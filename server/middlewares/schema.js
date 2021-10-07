/* eslint-disable camelcase */
/* eslint-disable max-len */
import Joi from '@hapi/joi';


/**
 * @class Schema
 * @description Contains methods that are schema, used by the Validate Class
 */
class Schema {
  /**
   * @method courierSignupSchema
   * @description This method return Joi object which delivers a schema when a courier tries to register
   * @memberof Schema
   * @return Joi Object
   */
  static courierSignupSchema() {
    return Joi.object({
      first_name: Joi.string().trim().min(2).max(30)
        .required(),
      last_name: Joi.string().trim().min(2).max(30)
        .required(),
      email: Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
      mobile_number: Joi.string().min(10).max(11).required(),
      identification_number: Joi.string().required(),
      sex: Joi.string().valid('M', 'F').required(),
      nationality: Joi.string().required(),
      country_code: Joi.string().required(),
      state: Joi.string().required(),
      town: Joi.string().required(),
      address: Joi.string().required(),
      owns_automobile: Joi.boolean(),
      done_dispatch_before: Joi.boolean(),
      profile_image: Joi.string().required(),
    });
  }

  /**
   * @method promoSchema
   * @description This method return Joi object which delivers a schema for promo code sending
   * @memberof Schema
   * @return Joi Object
   */

  static promoSchema() {
    return Joi.object({
      code: Joi.string().trim().required(),
      promo_message: Joi.string().trim().required(),
      promo_title: Joi.string().trim().required(),
      amount: Joi.number().required(),
    });
  }
  /**
   * @method courierApprovalSchema
   * @description This method return Joi object which delivers a schema when a courier tries to approve their account
   * @memberof Schema
   * @return Joi Object
   */

  static courierApprovalSchema() {
    return Joi.object({
      password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).required(),
      bank_name: Joi.string().required(),
      account_number: Joi.string().required(),
    });
  }


  /**
   * @method courierMobileCodeSchema
   * @description This method return Joi object which delivers a schema when a courier inputs the code sent to their mailbox
   * @memberof Schema
   * @return Joi Object
   */

  static courierMobileCodeSchema() {
    return Joi.object({
      code: Joi.number().integer().required(),
    });
  }

  /**
   * @method customerSignupSchema
   * @description This method return Joi object which delivers a schema when a courier tries to register
   * @memberof Schema
   * @return Joi Object
   */

  static customerSignupSchema() {
    return Joi.object({
      first_name: Joi.string().min(2).max(30).required(),
      last_name: Joi.string().min(2).max(30).required(),
      country_code: Joi.string().required(),
      email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
      password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).required(),
      mobile_number_one: Joi.string().min(10).max(11).required(),
    });
  }
  /**
   * @method delivery_type_schema
   * @description This method return Joi object which checks the type of dispatch
   * @memberof Schema
   * @return Joi Object
   */
  static delivery_type_schema() {
    return Joi.object({
      type: Joi.string().valid('intra', 'inter', 'international').required(),
    });
  }

  /**
   * @method edit_package_schema
   * @description This method return Joi object which delivers a schema when a customer edits a package for delivery
   * @memberof Schema
   * @return Joi Object
   */
  static edit_package_schema() {
    return Joi.object({
      weight: Joi.string(),
      value: Joi.string().valid('0-999', '1000-9999', '10000-99999', '100000-999999', '1000000'),
      description: Joi.string(),
      payment_mode: Joi.string().valid('virtual_balance', 'koogah_coin'),
      from_country: Joi.string(),
      to_country: Joi.string(),
      from_state: Joi.string(),
      to_state: Joi.string(),
      from_town: Joi.string(),
      to_town: Joi.string(),
      pickup_address: Joi.string(),
      dropoff_address: Joi.string(),
      image_urls: Joi.array(),
      nearest_busstop: Joi.string(),
      landmark: Joi.string(),
      pickup_landmark: Joi.string(),
      contact_name: Joi.string(),
      contact_phone: Joi.string(),
      receiver_contact_fullname: Joi.string(),
      receiver_contact_phone: Joi.string(),
      type_of_dispatch: Joi.string()
    });
  }

  /**
   * @method edit_dispatcher_schema
   * @description This method return Joi object which delivers a schema for companies to edit their dispatchers.
   * @memberof Schema
   * @return Joi Object
   */

  static edit_dispatcher_schema() {
    return Joi.object({
      first_name: Joi.string(),
      last_name: Joi.string(),
      mobile_number: Joi.string(),
    });
  }


  /**
   * @method intra_package_schema
   * @description This method return Joi object which delivers a schema when a customer create a package for delivery (intra-state)
   * @memberof Schema
   * @return Joi Object
   */
  static intra_package_schema() {
    return Joi.object({
      weight: Joi.string().required(),
      value: Joi.string().valid('0-999', '1000-9999', '10000-99999', '100000-999999', '1000000'),
      description: Joi.string().required(),
      payment_mode: Joi.string().valid('virtual_balance', 'koogah_coin').required(),
      from_state: Joi.string().required(),
      from_town: Joi.string().required(),
      to_town: Joi.string().required(),
      pickup_address: Joi.string().required(),
      dropoff_address: Joi.string().required(),
      image_urls: Joi.array().required(),
      landmark: Joi.string(),
      pickup_landmark: Joi.string(),
      contact_name: Joi.string().required(),
      contact_phone: Joi.string().required(),
      receiver_contact_fullname: Joi.string().required(),
      receiver_contact_phone: Joi.string().required(),
      delivery_price: Joi.string().required(),
      distance: Joi.string().required(),
    });
  }

  /**
   * @method inter_package_schema
   * @description This method return Joi object which delivers a schema when a customer create a package for delivery (inter-state)
   * @memberof Schema
   * @return Joi Object
   */
  static inter_package_schema() {
    return Joi.object({
      weight: Joi.string().required(),
      value: Joi.string().valid('0-999', '1000-9999', '10000-99999', '100000-999999', '1000000'),
      description: Joi.string().required(),
      payment_mode: Joi.string().valid('virtual_balance', 'koogah_coin').required(),
      from_state: Joi.string().required(),
      to_state: Joi.string().required(),
      from_town: Joi.string().required(),
      to_town: Joi.string().required(),
      pickup_address: Joi.string().required(),
      dropoff_address: Joi.string().required(),
      image_urls: Joi.array().required(),
      nearest_busstop: Joi.string(),
      landmark: Joi.string(),
      contact_name: Joi.string().required(),
      contact_phone: Joi.string().required(),
      receiver_contact_fullname: Joi.string().required(),
      receiver_contact_phone: Joi.string().required(),
      delivery_price: Joi.string().required(),
    });
  }

  /**
   * @method international_package_schema
   * @description This method return Joi object which delivers a schema when a customer create a package for delivery (international-state)
   * @memberof Schema
   * @return Joi Object
   */
  static international_package_schema() {
    return Joi.object({
      weight: Joi.string().required(),
      value: Joi.string().valid('0-999', '1000-9999', '10000-99999', '100000-999999', '1000000'),
      description: Joi.string().required(),
      payment_mode: Joi.string().valid('virtual_balance', 'koogah_coin').required(),
      from_country: Joi.string().required(),
      to_country: Joi.string().required(),
      from_state: Joi.string().required(),
      to_state: Joi.string().required(),
      from_town: Joi.string().required(),
      to_town: Joi.string().required(),
      pickup_address: Joi.string().required(),
      dropoff_address: Joi.string().required(),
      image_urls: Joi.array().required(),
      nearest_busstop: Joi.string(),
      landmark: Joi.string(),
      contact_name: Joi.string().required(),
      contact_phone: Joi.string().required(),
      receiver_contact_fullname: Joi.string().required(),
      receiver_contact_phone: Joi.string().required(),
      delivery_price: Joi.string().required(),
    });
  }

  /**
   * @method package_id_schema
   * @description This method return Joi object which delivers a schema to verify package_id
   * @memberof Schema
   * @return Joi Object
   */

  static package_id_schema() {
    return Joi.object({
      package_id: Joi.string().required(),
    });
  }

  /**
   * @method response_schema
   * @description This method return Joi object which delivers a schema when a customer responds to a dispatcher request
   * @memberof Schema
   * @return Joi Object
   */

  static response_schema() {
    return Joi.object({
      response: Joi.string().valid('approve', 'decline').required(),
    });
  }

  /**
   * @method weight_change_schema
   * @description This method return Joi object which delivers a schema when a dispatcher changes weight of a package
   * @memberof Schema
   * @return Joi Object
   */

  static weight_change_schema() {
    return Joi.object({
      new_weight: Joi.string().required(),
    });
  }
  /**
   * @method amount_schema
   * @description This method return Joi object which delivers a schema to validate amount on topup
   * @memberof Schema
   * @return Joi Object
   */

  static amount_schema() {
    return Joi.object({
      amount: Joi.number().integer().required(),
    });
  }

  /**
   * @method company_amount_schema
   * @description This method return Joi object which delivers a schema to validate amount on topup
   * @memberof Schema
   * @return Joi Object
   */

   static company_amount_schema() {
    return Joi.object({
      bank_code: Joi.string().required(),
    });
  }

  /**
   * @method top_up_amount_schema_two
   * @description This method return Joi object which delivers a schema to validate amount on topup
   * @memberof Schema
   * @return Joi Object
   */
  static top_up_amount_schema_two() {
    return Joi.object({
      reference: Joi.string().required(),
    });
  }


  /**
   * @method pay_dispatcher_schema
   * @description This method return Joi object which delivers a schema to pay a dispatcher
   * @memberof Schema
   * @return Joi Object
   */

  static pay_dispatcher_schema() {
    return Joi.object({
      package_id: Joi.string().required(),
    });
  }


  /**
   * @method sign_in_schema
   * @description This method return Joi object which delivers a schema on sign_in
   * @memberof Schema
   * @return Joi Object
   */

  static sign_in_schema() {
    return Joi.object({
      email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
      password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).required(),
    });
  }

  /**
   * @method dispatcher_id_schema
   * @description This method return Joi object which delivers a schema to verify dispatcher_id
   * @memberof Schema
   * @return Joi Object
   */

  static dispatcher_id_schema() {
    return Joi.object({
      dispatcher_id: Joi.number().required(),
    });
  }
   /**
   * @method  courier_rating_schema_params
   * @description This method return Joi object which delivers a schema to rate a courier
   * @memberof Schema
   * @return Joi Object
   */

  static courier_rating_schema_params() {
    return Joi.object({
      dispatcher_id: Joi.number().required(),
      package_id: Joi.string().required(),
    });
  }
     /**
   * @method  customer_rating_schema_params
   * @description This method return Joi object which delivers a schema to rate a courier
   * @memberof Schema
   * @return Joi Object
   */

  static customer_rating_schema_params() {
    return Joi.object({
      customer_id: Joi.number().required(),
      package_id: Joi.string().required(),
    });
  }

  /**
   * @method rating_schema
   * @description This method return Joi object which delivers a schema to rate a courier
   * @memberof Schema
   * @return Joi Object
   */

  static rating_schema() {
    return Joi.object({
      rating: Joi.string().valid('1', '2', '3', '4', '5').required(),
    });
  }

  /**
   * @method decline_pickup_body_schema
   * @description This method return Joi object which delivers a schema to rate a courier
   * @memberof Schema
   * @return Joi Object
   */
  static decline_pickup_body_schema() {
    return Joi.object({
      decline_cause: Joi.string().required()
    });
  }

  /**
   * @method notify_id_schema
   * @description This method return Joi object which delivers a schema for notifying a user
   * @memberof Schema
   * @return Joi Object
   */

  static notify_id_schema() {
    return Joi.object({
      id: Joi.number().required(),
    });
  }
  /**
   * @method profile_id_schema
   * @description This method return Joi object which delivers a schema for user profile
   * @memberof Schema
   * @return Joi Object
   */

  static profile_id_schema() {
    return Joi.object({
      id: Joi.number().required(),
    });
  }

  /**
   * @method package_status_schema
   * @description This method return Joi object which delivers a schema for package status
   * @memberof Schema
   * @return Joi Object
   */
  static package_status_schema() {
    return Joi.object({
      status: Joi.string().valid('picked-up', 'not-picked', 'delivered', 'tracking', 'all'),
    });
  }
  
  /**
   * @method deliver_package_schema
   * @description This method return Joi object which delivers a schema for package status
   * @memberof Schema
   * @return Joi Object
   */
  static deliver_package_schema() {
    return Joi.object({
      package_id: Joi.string().required(),
      delivery_key: Joi.string().required(),
    });
  }
  /**
   * @method courier_profile_update_schema
   * @description This method return Joi object which delivers a schema for courier profile update
   * @memberof Schema
   * @return Joi Object
   */

  static courier_profile_update_schema() {
    return Joi.object({
      mobile_number: Joi.string().min(10).max(11),
      state: Joi.string(),
      town: Joi.string(),
      address: Joi.string(),
      profile_image: Joi.string(),
      account_number: Joi.string(),
      bank_name: Joi.string(),
    });
  }
  
  /**
   * @method company_profile_update_schema
   * @description This method return Joi object which delivers a schema for company profile update
   * @memberof Schema
   * @return Joi Object
   */

  static company_profile_update_schema() {
    return Joi.object({
      first_name: Joi.string().trim(),
      last_name: Joi.string().trim(),
      email: Joi.string().trim(),
      phone: Joi.string().trim(),
      bank_account_name: Joi.string().trim(),
      bank_account_number: Joi.string().trim(),
      profile_image: Joi.string().allow(null, ''),
      business_name: Joi.string().trim(),
      business_address: Joi.string().trim(),
      business_state: Joi.sstring().trim(),
      business_town: Joi.string().trim(),
      business_country:Joi.string().trim(),
    });
  }

  /**
   * @method customer_profile_update_schema
   * @description This method return Joi object which delivers a schema for customer profile update
   * @memberof Schema
   * @return Joi Object
   */

  static customer_profile_update_schema() {
    return Joi.object({
      mobile_number_one: Joi.string().min(10).max(11),
      mobile_number_two: Joi.string().min(10).max(11),
      email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
      first_name: Joi.string(),
      last_name: Joi.string(),
      state: Joi.string(),
      town: Joi.string(),
      address: Joi.string(),
      profile_image: Joi.string().allow(null, ''),
    });
  }

  /**
   * @method report_user_schema
   * @description This method return Joi object which delivers a schema to report a user
   * @memberof Schema
   * @return Joi Object
   */
  static report_user_schema() {
    return Joi.object({
      report: Joi.string().required(),
    });
  }

  /**
   * @method approve_decline_package_schema
   * @description This method return Joi object which delivers a schema to report a user
   * @memberof Schema
   * @return Joi Object
   */
  static approve_decline_package_schema() {
    return Joi.object({
      package_id: Joi.string().required(),
      dispatcher_id: Joi.string().required(),
    });
  }

  /**
   * @method password_reset_request_schema
   * @description This method return Joi object which delivers a schema to request password reset
   * @memberof Schema
   * @return Joi Object
   */

  static password_reset_request_schema() {
    return Joi.object({
      email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
      account_type: Joi.string().valid('courier', 'customer').required()
    })
  }

  /**
   * @method reset_password_schema
   * @description This method return Joi object which delivers a schema to reset password
   * @memberof Schema
   * @return Joi Object
   */

  static reset_password_schema() {
    return Joi.object({
      new_password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).required(),
    })
  }

  /**
   * @method refresh_token_schema
   * @description This method return Joi object which delivers a schema to refresh token
   * @memberof Schema
   * @return Joi Object
   */

  static refresh_token_schema() {
    return Joi.object({
      refresh_token: Joi.string().required(),
    })
  }

  /**
   * @method start_dispatch_schema
   * @description This method return Joi object which delivers a schema to start dispatch
   * @memberof Schema
   * @return Joi Object
   */

  static start_dispatch_schema() {
    return Joi.object({
      dispatcher_lat: Joi.number().required(),
      dispatcher_lng: Joi.number().required(),
    })
  }

  /**
   * @method change_password_schema
   * @description This method return Joi object which enables a user to change password
   * @memberof Schema
   * @return Joi Object
  */
  
  static change_password_schema() { 
    return Joi.object({
      old_password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).required(),
      new_password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).required(),
    })
  }

  /**
   * @method company_signup_schema
   * @description This method return Joi object which enables a company signup
   * @memberof Schema
   * @return Joi Object
  */
  
  static company_signup_schema() {
    return Joi.object({
      business_name: Joi.string().trim().required(),
      nin: Joi.string().trim().required(),
      first_name: Joi.string().trim().min(2).max(30).required(),
      last_name: Joi.string().trim().min(2).max(30).required(),
      country_code: Joi.string().trim().required(),
      email: Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
      phone: Joi.string().min(10).max(11).required(),
      business_address: Joi.string().trim().required(),
      business_state: Joi.string().trim().required(),
      business_town: Joi.string().trim().required(),
      business_country: Joi.string().trim().required(),
    });
  }
  /**
   * @method email_verify_schema
   * @description This method return Joi object which verifies email alone
   * @memberof Schema
   * @return Joi Object
  */
  static email_verify_schema() {
    return Joi.object({
      email: Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    });
  }

  /**
   * @method code_email_schema
   * @description This method return Joi object which verifies email and verify code
   * @memberof Schema
   * @return Joi Object
  */
  
  static code_email_schema() {
    return Joi.object({
      email_verify_code: Joi.string().trim().required(),
      email: Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    });
  }

  /**
   * @method mobile_code_email_schema
   * @description This method return Joi object which verifies email and verify code
   * @memberof Schema
   * @return Joi Object
  */
  
   static mobile_code_email_schema() {
    return Joi.object({
      mobile_verify_code: Joi.string().trim().required(),
      email: Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    });
  }

  /**
   * @method company_reg_dispatcher_step_three_schema
   * @description This method return Joi object which verifies mobile number, email, country_code
   * @memberof Schema
   * @return Joi Object
  */
   static company_reg_dispatcher_step_three_schema() {
    return Joi.object({
      mobile_number: Joi.string().trim().required(),
      country_code: Joi.string().trim().required(),
      email: Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
    });
   }
  
  /**
   * @method company_reg_dispatcher_step_five_schema
   * @description This method return Joi object which verifies the complete company dispatcher
   * @memberof Schema
   * @return Joi Object
  */
  static company_reg_dispatcher_step_five_schema() {
    return Joi.object({
      profile_image: Joi.string().trim().required(),
      first_name: Joi.string().trim().required(),
      last_name: Joi.string().trim().required(),
      email: Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
      password: Joi.string().pattern(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/).required(),
      state: Joi.string().trim().required(),
      town: Joi.string().trim().required(),
      address: Joi.string().trim().required(),
      nationality: Joi.string().trim().required(),
      sex: Joi.string().valid('M', 'F').required(),
    });
  }
  
}


export default Schema;
