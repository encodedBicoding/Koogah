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
}


export default Schema;
