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

      const data = {
        id: dispatcher_profile.id,
        first_name: dispatcher_profile.first_name,
        last_name: dispatcher_profile.last_name,
        email: dispatcher_profile.email,
        mobile_number: dispatcher_profile.mobile_number,
        state: dispatcher_profile.state,
        town: dispatcher_profile.town,
        address: dispatcher_profile.address,
        nationality: dispatcher_profile.nationality,
        sex: dispatcher_profile.sex,
        profile_image: dispatcher_profile.profile_image,
        rating: dispatcher_profile.rating,
        pickups: dispatcher_profile.pickups,
        deliveries: dispatcher_profile.deliveries,
        pending: dispatcher_profile.pending,
        is_verified: dispatcher_profile.is_verified,
        is_currently_dispatching: dispatcher_profile.is_currently_dispatching,
      }
      return res.status(200).json({
        status: 200,
        message: 'Profile retrieved successfully',
        data
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
      const data = {
        id: customer_profile.id,
        first_name: customer_profile.first_name,
        last_name: customer_profile.last_name,
        profile_image: customer_profile.profile_image,
        mobile_number_one: customer_profile.mobile_number_one,
        mobile_number_two: customer_profile.mobile_number_two,
        address: customer_profile.address,
        state: customer_profile.state,
        town: customer_profile.town,
        email: customer_profile.email,
        rating: customer_profile.rating
      }
      return res.status(200).json({
        status: 200,
        message: 'Profile retreived successfully',
        data,
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
   * @method update_profile
   * @memberof Profile
   * @params req, res
   * @description this method allows a user update their profile
   * @return JSON object
   */

  static update_profile(req, res) {
    const { user } = req.session;
    const { ...data } = req.body;
    const user_type = user.is_courier ? 'courier' : 'customer';
    return Promise.try(async () => {
      let USER;
      if (user_type === 'courier') {
        USER = await Couriers.findOne({
          where: {
            id: user.id,
          },
        });
        if (!USER) {
          return res.status(404).json({
            status: 404,
            error: 'User not found',
          });
        }
        await Couriers.update({
          ...data,
        }, {
          where: {
            id: user.id,
          },
        });
        USER = await Couriers.findOne({
          where: {
            id: user.id,
          },
        });
      } else {
        USER = await Customers.findOne({
          where: {
            id: user.id,
          },
        });
        if (!USER) {
          return res.status(404).json({
            status: 404,
            error: 'User not found',
          });
        }
        await Customers.update({
          ...data,
        }, {
          where: {
            id: user.id,
          },
        });
        USER = await Customers.findOne({
          where: {
            id: user.id,
          },
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'Profile updated successfully',
        data: USER.getSafeDataValues(),
      });
    }).catch((error) => {
      log(error);
      return res.status(400).json({
        status: 400,
        error,
      });
    });
  }
}

export default Profile;
