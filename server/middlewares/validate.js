/* eslint-disable camelcase */
/* eslint-disable no-prototype-builtins */
import Schema from './schema'

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
  amount_schema,
  top_up_amount_schema_two,
  pay_dispatcher_schema,
  sign_in_schema,
  dispatcher_id_schema,
  rating_schema,
  delivery_type_schema,
  notify_id_schema,
  profile_id_schema,
  package_status_schema,
  courier_profile_update_schema,
  customer_profile_update_schema,
  report_user_schema,
  courier_rating_schema_params,
  customer_rating_schema_params,
  decline_pickup_body_schema,
  approve_decline_package_schema,
  password_reset_request_schema,
  reset_password_schema,
  deliver_package_schema,
  refresh_token_schema,
  edit_package_schema,
  start_dispatch_schema,
  change_password_schema,
  courierApprovalSchema,
  company_signup_schema,
  email_verify_schema,
  code_email_schema,
  company_reg_dispatcher_step_three_schema,
  company_reg_dispatcher_step_five_schema,
  mobile_code_email_schema,
  company_amount_schema,
  company_profile_update_schema,
  edit_dispatcher_schema,
  promoSchema,
  price_change_schema,
  create_single_package_of_multiple_schema,
} = Schema

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
    const isvalid = courierSignupSchema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method promoCodeSend
   * @description This method validates the input from an admin to send promo code
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static promoCodeSend(req, res, next) {
    const isvalid = promoSchema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method courierApproveAccount
   * @description This method validates the input from a Courier on account approval
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static courierApproveAccount(req, res, next) {
    const isvalid = courierApprovalSchema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method validateCourierMobileCode
   * @description This method validates the code from user during mobile verification
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static validateMobileCode(req, res, next) {
    const isvalid = courierMobileCodeSchema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method customerSignup
   * @description This method validates the input from a Customer on signup
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static customerSignup(req, res, next) {
    const isvalid = customerSignupSchema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }
  /**
   * @method edit_package
   * @description This method validates the input from a Customer on package editing
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_edit_package(req, res, next) {
    const isvalid = edit_package_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_edit_dispatcher
   * @description This method validates the input from company edit dispatcher
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_edit_dispatcher(req, res, next) {
    const isvalid = edit_dispatcher_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method create_package
   * @description This method validates the input from a Customer on package creation
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static create_package(req, res, next) {
    const {type} = req.params
    let isvalid
    if (type === 'intra') {
      isvalid = intra_package_schema().validate(req.body)
      if (isvalid.hasOwnProperty('error')) {
        return res.status(400).json({
          status: 400,
          error: isvalid.error.details,
        })
      }
    }
    if (type === 'inter') {
      isvalid = inter_package_schema().validate(req.body)
      if (isvalid.hasOwnProperty('error')) {
        return res.status(400).json({
          status: 400,
          error: isvalid.error.details,
        })
      }
    }
    if (type === 'international') {
      isvalid = international_package_schema().validate(req.body)
      if (isvalid.hasOwnProperty('error')) {
        return res.status(400).json({
          status: 400,
          error: isvalid.error.details,
        })
      }
    }
    return next()
  }
  /**
   * @method check_package_id
   * @description This method validates package_id
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_package_id(req, res, next) {
    const isvalid = package_id_schema().validate(req.params)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_approve_decline_package
   * @description This method validates package_id and dispatcher_id
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_approve_decline_package(req, res, next) {
    const isvalid = approve_decline_package_schema().validate(req.params)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_response
   * @description This method validates response given by the customer
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static check_response(req, res, next) {
    const isvalid = response_schema().validate(req.query)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_weight
   * @description This method validates new weight set by dispatcher
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_weight(req, res, next) {
    const isvalid = weight_change_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_price
   * @description This method validates new weight set by dispatcher
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_price(req, res, next) {
    const isvalid = price_change_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_top_up_amount
   * @description This method validates amount on top up
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static check_top_up_amount(req, res, next) {
    const isvalid = amount_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }
  /**
   * @method check_top_up_amount_two
   * @description This method validates amount on top up
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_top_up_amount_two(req, res, next) {
    const isvalid = top_up_amount_schema_two().validate(req.query)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_pay_dispatcher_query
   * @description This method validates entries in paying dispatcher query
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_pay_dispatcher_query(req, res, next) {
    const isvalid = pay_dispatcher_schema().validate(req.params)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_sign_in
   * @description This method validates entries in sign_in
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_sign_in(req, res, next) {
    const isvalid = sign_in_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_dispatcher_id
   * @description This method validates dispatcher_id
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_dispatcher_id(req, res, next) {
    const isvalid = dispatcher_id_schema().validate(req.params)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }
  /**
   * @method check_courier_rating_params
   * @description This method validates rating
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static check_courier_rating_params(req, res, next) {
    const isvalid = courier_rating_schema_params().validate(req.params)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_customer_rating_params
   * @description This method validates rating
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static check_customer_rating_params(req, res, next) {
    const isvalid = customer_rating_schema_params().validate(req.params)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }
  /**
   * @method check_rating
   * @description This method validates rating
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_rating(req, res, next) {
    const isvalid = rating_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_delivery_type
   * @description This method validates delivery type
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_delivery_type(req, res, next) {
    const isvalid = delivery_type_schema().validate(req.params)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_payout_amount
   * @description This method validates delivery type
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_payout_amount(req, res, next) {
    const isvalid = amount_schema().validate(req.query)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_company_payout_amount
   * @description This method validates delivery type
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_company_payout_amount(req, res, next) {
    const isvalid = company_amount_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_notify_id
   * @description This method validates notification id
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_notify_id(req, res, next) {
    const isvalid = notify_id_schema().validate(req.query)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_profile_id
   * @description This method validates profile id
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_profile_id(req, res, next) {
    const isvalid = profile_id_schema().validate(req.params)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_package_status
   * @description This method validates package status
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_package_status(req, res, next) {
    const isvalid = package_status_schema().validate(req.query)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }
  /**
   * @method check_courier_profile
   * @description This method validates courier profile update
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_courier_profile(req, res, next) {
    const isvalid = courier_profile_update_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }
  /**
   * @method check_company_profile
   * @description This method validates company profile update
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static check_company_profile(req, res, next) {
    const isvalid = company_profile_update_schema.validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }
  /**
   * @method check_customer_profile
   * @description This method validates company profile update
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_customer_profile(req, res, next) {
    const isvalid = customer_profile_update_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_report
   * @description This method validates reports
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_report(req, res, next) {
    const isvalid = report_user_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_decline_pickup_query
   * @description This method validates decline pickup body
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_decline_pickup_query(req, res, next) {
    const isvalid = package_id_schema().validate(req.query)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_decline_pickup_body
   * @description This method validates decline pickup body
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_decline_pickup_body(req, res, next) {
    const isvalid = decline_pickup_body_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_password_reset_request
   * @description This method validates password reset request body
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_password_reset_request(req, res, next) {
    const isvalid = password_reset_request_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_reset_password
   * @description This method validates reset password body
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_reset_password(req, res, next) {
    const isvalid = reset_password_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_deliver_package
   * @description This method validates deliver package schema
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_deliver_package(req, res, next) {
    const isvalid = deliver_package_schema().validate(req.params)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_refresh_token
   * @description This method validates refresh token
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_refresh_token(req, res, next) {
    const isvalid = refresh_token_schema().validate(req.query)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_start_dispatch
   * @description This method validates starting dispatch
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static check_start_dispatch(req, res, next) {
    const isvalid = start_dispatch_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_change_password
   * @description This method validates change password
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_change_password(req, res, next) {
    const isvalid = change_password_schema().validate(req.body)
    if (isvalid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isvalid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_company_signup
   * @description This method validates company signup
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_company_signup(req, res, next) {
    const isValid = company_signup_schema().validate(req.body)
    if (isValid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isValid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_email
   * @description This method validates email
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static check_email(req, res, next) {
    const isValid = email_verify_schema().validate(req.body)
    if (isValid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isValid.error.details,
      })
    }
    return next()
  }
  /**
   * @method check_email_and_code
   * @description This method validates email and email verify code
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_email_and_code(req, res, next) {
    const isValid = code_email_schema().validate(req.body)
    if (isValid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isValid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_email_and_mobile_code
   * @description This method validates email and email verify code
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_email_and_mobile_code(req, res, next) {
    const isValid = mobile_code_email_schema().validate(req.body)
    if (isValid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isValid.error.details,
      })
    }
    return next()
  }

  /**
   * @method check_company_reg_dispatcher_step_three
   * @description This method validates email, mobile_number and country code
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */
  static check_company_reg_dispatcher_step_three(req, res, next) {
    const isValid = company_reg_dispatcher_step_three_schema().validate(
      req.body,
    )
    if (isValid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isValid.error.details,
      })
    }
    return next()
  }
  /**
   * @method check_company_reg_dispatcher_step_five
   * @description This method validates the complete data for company dispatcher reg
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static check_company_reg_dispatcher_step_five(req, res, next) {
    const isValid = company_reg_dispatcher_step_five_schema().validate(req.body)
    if (isValid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isValid.error.details,
      })
    }
    return next()
  }

  /**
   * @method create_single_package_of_multiple
   * @description This method validates the complete data for company dispatcher reg
   * @memberof Validate
   * @param {req, res, next}
   * @return next
   */

  static create_single_package_of_multiple(req, res, next) {
    const isValid = create_single_package_of_multiple_schema().validate(
      req.body,
    )
    if (isValid.hasOwnProperty('error')) {
      return res.status(400).json({
        status: 400,
        error: isValid.error.details,
      })
    }
    return next()
  }
}

export default Validate
