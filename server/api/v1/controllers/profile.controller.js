/* eslint-disable camelcase */
import log from 'fancy-log';
import { Customers, Couriers } from '../../../database/models';

/**
 * @class Profile
 * @description Controller to get profiles of both couriers and customers
 */
class Profile {
  /**
   * @method get_courier_profile
   * @memberof Profile
   * @params req, res
   * @description this method allows a customer to get courier profile
   * @return JSON object
   */

  static get_courier_profile(req, res) {
    const { id } = req.params;
    return Promise.try(async () => {
      const dispatcher = await Couriers.findOne({
        where: {
          id,
        },
      });
      if (!dispatcher) {
        return res.status(404).json({
          status: 404,
          error: `No dispatcher found with id: ${id}`,
        });
      }
      const dispatcher_profile = dispatcher.getSafeDataValues();
      return res.status(200).json({
        status: 200,
        message: 'Profile retreived successfully',
        data: dispatcher_profile,
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
   * @method get_own_profile
   * @memberof Profile
   * @params req, res
   * @description this method allows a user to get their profile
   * @return JSON object
   */

  static get_own_profile(req, res) {
    const { user } = req.session;
    const model = user.is_courier ? 'couriers' : 'customers';
    return Promise.try(async () => {
      let USER;
      if (model === 'couriers') {
        USER = await Couriers.findOne({
          where: {
            email: user.email,
          },
        });
        if (!USER) {
          return res.status(404).json({
            status: 404,
            error: `No dispatcher found with email address: ${user.email}`,
          });
        }
      }
      if (model === 'customers') {
        USER = await Customers.findOne({
          where: {
            email: user.email,
          },
        });
        if (!USER) {
          return res.status(404).json({
            status: 404,
            error: `No customer found with email address: ${user.email}`,
          });
        }
      }
      return res.status(200).json({
        status: 200,
        message: 'Profile retreived successfully',
        data: USER.getSafeDataValues(),
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
   * @method get_customer_profile
   * @memberof Profile
   * @params req, res
   * @description this method allows a courier to get customer profile
   * @return JSON object
   */

  static get_customer_profile(req, res) {
    const { id } = req.params;
    return Promise.try(async () => {
      const customer = await Customers.findOne({
        where: {
          id,
        },
      });
      if (!customer) {
        return res.status(404).json({
          status: 404,
          error: `No customer found with id: ${id}`,
        });
      }
      const customer_profile = customer.getSafeDataValues();
      return res.status(200).json({
        status: 200,
        message: 'Profile retreived successfully',
        data: customer_profile,
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

export default Profile;
