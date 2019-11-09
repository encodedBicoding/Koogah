import Schema from './schema';

const { 
  courierSignupSchema, 
  courierMobileCodeSchema,
  customerSignupSchema,
} = Schema;

/**
 * @class Validate
 * @description Validates user input
 */

class Validate {

  /**
   * @method courierSignup
   * @description This method validates the input from a Courier on signup
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
    static courierSignup(req, res, next) {
      let isvalid = courierSignupSchema().validate(req.body);
      if(isvalid.hasOwnProperty('error')) {
        return res.status(400).json({
          status: 400,
          error: isvalid.error.details,
        })
      }
      return next();
    }


  /**
   * @method validateCourierMobileCode
   * @description This method validates the code from user during mobile verification
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static validateMobileCode(req, res, next) {
    let isvalid = courierMobileCodeSchema().validate(req.body);
    if(isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next();
  }

  /**
   * @method customerSignup
   * @description This method validates the input from a Customer on signup
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static customerSignup(req, res, next) {
    let isvalid = customerSignupSchema().validate(req.body);
    if(isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next();
  }

}

export default Validate;