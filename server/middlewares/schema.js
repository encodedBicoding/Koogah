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
      first_name: Joi.string().trim().min(3).max(30)
        .required(),
      last_name: Joi.string().trim().min(3).max(30)
        .required(),
      email: Joi.string().trim().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
      password: Joi.string().pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/).required(),
      repeat_password: Joi.ref('password'),
      mobile_number: Joi.string().min(10).max(11).required(),
      sex: Joi.string().valid('M', 'F').required(),
      bvn: Joi.number().integer().required(),
      nationality: Joi.string().required(),
      state: Joi.string().required(),
      town: Joi.string().required(),
      address: Joi.string().required(),
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
      first_name: Joi.string().min(3).max(30).required(),
      last_name: Joi.string().min(3).max(30).required(),
      country_code: Joi.string().required(),
      email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
      password: Joi.string().pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/).required(),
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
   * @method intra_package_schema
   * @description This method return Joi object which delivers a schema when a customer create a package for delivery (intra-state)
   * @memberof Schema
   * @return Joi Object
   */
  static intra_package_schema() {
    return Joi.object({
      weight: Joi.string().required(),
      description: Joi.string().required(),
      from_state: Joi.string().required(),
      from_town: Joi.string().required(),
      to_town: Joi.string().required(),
      pickup_address: Joi.string().required(),
      dropoff_address: Joi.string().required(),
      image_urls: Joi.array().required(),
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
      description: Joi.string().required(),
      from_state: Joi.string().required(),
      to_state: Joi.string().required(),
      pickup_address: Joi.string().required(),
      dropoff_address: Joi.string().required(),
      image_urls: Joi.array().required(),
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
      description: Joi.string().required(),
      from_country: Joi.string().required(),
      to_country: Joi.string().required(),
      pickup_address: Joi.string().required(),
      dropoff_address: Joi.string().required(),
      image_urls: Joi.array().required(),
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
   * @method top_up_amount_schema
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
      dispatcher_id: Joi.number().required()
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
      password: Joi.string().pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/).required(),
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
      status: Joi.string().valid('picked-up', 'not-picked', 'delivered'),
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
   * @method customer_profile_update_schema
   * @description This method return Joi object which delivers a schema for courier profile update
   * @memberof Schema
   * @return Joi Object
   */

  static customer_profile_update_schema() {
    return Joi.object({
      mobile_number_one: Joi.string().min(10).max(11),
      mobile_number_two: Joi.string().min(10).max(11),
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
}


export default Schema;
