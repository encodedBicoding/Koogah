/* eslint-disable camelcase */
/* eslint-disable no-prototype-builtins */
import Schema from './schema';

const {
  courierSignupSchema,
  courierMobileCodeSchema,
  customerSignupSchema,
  intra_package_schema,
  inter_package_schema,
  international_package_schema,
  package_id_schema,
  response_schema,
  weight_change_schema,
  top_up_amount_schema,
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
    const isvalid = courierSignupSchema().validate(req.body);
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      });
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
    const isvalid = courierMobileCodeSchema().validate(req.body);
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      });
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
    const isvalid = customerSignupSchema().validate(req.body);
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      });
    }
    return next();
  }

  /**
   * @method create_package
   * @description This method validates the input from a Customer on package creation
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static create_package(req, res, next) {
    const { type } = req.params;
    let isvalid;
    if (type === 'intra') {
      isvalid = intra_package_schema().validate(req.body);
      if (isvalid.hasOwnProperty('error')) {
        return res.status(400).json({
          status: 400,
          error: isvalid.error.details,
        });
      }
    }
    if (type === 'inter') {
      isvalid = inter_package_schema().validate(req.body);
      if (isvalid.hasOwnProperty('error')) {
        return res.status(400).json({
          status: 400,
          error: isvalid.error.details,
        });
      }
    }
    if (type === 'international') {
      isvalid = international_package_schema().validate(req.body);
      if (isvalid.hasOwnProperty('error')) {
        return res.status(400).json({
          status: 400,
          error: isvalid.error.details,
        });
      }
    }
    return next();
  }
  /**
   * @method check_package_id
   * @description This method validates package_id
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_package_id(req, res, next) {
    const isvalid = package_id_schema().validate(req.params);
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      });
    }
    return next();
  }

  /**
   * @method check_response
   * @description This method validates response given by the customer
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static check_response(req, res, next) {
    const isvalid = response_schema().validate(req.query);
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      });
    }
    return next();
  }

  /**
   * @method check_weight
   * @description This method validates new weight set by dispatcher
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_weight(req, res, next) {
    const isvalid = weight_change_schema().validate(req.body);
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      });
    }
    return next();
  }

  /**
   * @method check_top_up_amount
   * @description This method validates amount on top up
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static check_top_up_amount(req, res, next) {
    const isvalid = top_up_amount_schema().validate(req.body);
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      });
    }
    return next();
  }
}

export default Validate;
