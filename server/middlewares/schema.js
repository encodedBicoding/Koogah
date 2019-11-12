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
      first_name: Joi.string().min(3).max(30).required(),
      last_name: Joi.string().min(3).max(30).required(),
      email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
      password: Joi.string().pattern(/^[a-zA-Z0-9]{3,30}$/).required(),
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
      business_name: Joi.string().min(3).max(100),
      has_business: Joi.bool().required(),
      email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
      password: Joi.string().pattern(/^[a-zA-Z0-9]{3,30}$/).required(),
      repeat_password: Joi.ref('password'),
      mobile_number_one: Joi.string().min(10).max(11).required(),
      mobile_number_two: Joi.string().min(10).max(11),
      state: Joi.string().required(),
      town: Joi.string().required(),
      address: Joi.string().required(),
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

  static top_up_amount_schema() {
    return Joi.object({
      amount: Joi.string().required(),
    });
  }
}


export default Schema;
