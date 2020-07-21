/* eslint-disable no-underscore-dangle */
/* eslint-disable camelcase */
import Sequelize from 'sequelize';
import log from 'fancy-log';
import uuid from 'uuid/v4';
import fetch from 'node-fetch';
import { config } from 'dotenv';
import checkType from '../helpers/check.type';
import calc_delivery_price from '../helpers/calc.price';
import {
  Packages, Couriers, Notifications, Customers,
} from '../../../database/models';

config();
const isProduction = process.env.NODE_ENV === 'production';
const { Op } = Sequelize;
/**
 * @class Package
 * @description Defines methods for packages. Packages are ggods that needs to be dispatched
 */
class Package {
  /**
   * @method request_dispatch
   * @memberof Package
   * @params req, res
   * @description this method create a package that needs a dispatcher
   * @return JSON object
   */
  static async request_dispatch(req, res) {
    const { user } = req.session;
    let { type } = req.params;
    const { weight, ...data } = req.body;
    if (type.length <= 5) {
      type = `${type}-state`;
    }
    // same state
    if (type === 'intra-state') {
      data.to_state = data.from_state;
    }
    // calculate the distance between package pickup location
    // and package dropoff location
    return Promise.try(async () => fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?origins=${checkType('from', data, type)}&destinations=${checkType('to', data, type)}&key=${process.env.GOOGLE_API_KEY}`)
      .then((resp) => resp.json())
      .then(async (result) => {
        console.log(result)
        const distance_in_km = result.rows[0].elements[0].distance.text;
        const distance = Math.ceil(parseInt(distance_in_km.split(' ')[0].replace(',', ''), 10));
        const delivery_price = calc_delivery_price(type, weight, distance);
        if (!delivery_price) {
          return res.status(400).json({
            status: 400,
            error: 'Weight must match one of ["0-5","6-10", "11-15", "16-25", "26-40", "50-100", "101-200", "201-300", "301-400", "401-500", "500>"],',
          });
        }
        const package_id = uuid();
        const package_detail = await Packages.create({
          type_of_dispatch: type,
          customer_id: user.id,
          weight,
          distance,
          delivery_price,
          package_id,
          ...data,
        });
        return res.status(200).json({
          status: 200,
          message: 'Package created successfully. Please wait, a dispatcher will reach out to you soon',
          package_detail,
        });
      }).catch((err) => {
        log(err);
        return res.status(400).json({
          status: 400,
          error: err,
        });
      })).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method show_interest
   * @memberof Package
   * @params req, res
   * @description this method allows a user to show interest in a package
   * @return JSON object
   */

  static show_interest(req, res) {
    const { package_id } = req.params;
    const { user } = req.session;
    return Promise.try(async () => {
      if (user.pending > 0) {
        return res.status(400).json({
          status: 400,
          error: 'You cannot pickup more packages. Please deliver the one you have pending',
        });
      }
      const _package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'The package you want to pickup doesn\'t exist',
        });
      }
      if (_package.dispatcher_id || _package.status === 'picked-up') {
        return res.status(400).json({
          status: 400,
          error: 'This package has already been picked up by another dispatcher',
        });
      }
      if (_package.pending_dispatcher_id === user.id) {
        return res.status(400).json({
          status: 400,
          error: 'You have already indicated interest for the package. Please wait for the owner to approve you.',
        });
      }
      if (_package.pending_dispatcher_id) {
        return res.status(400).json({
          status: 400,
          error: 'A dispatcher has already indicated interest for this package. You can only indicate an interest if they were disapproved by the owner of the package',
        });
      }
      // update Package and send a notification to the owner of the package.
      return Promise.try(async () => {
        await Packages.update({
          pending_dispatcher_id: user.id,
        },
        {
          where: {
            package_id,
          },
        });
        const updated_package = await Packages.findOne({
          where: {
            package_id,
          },
        });
        const customer = await Customers.findOne({
          where: {
            id: _package.customer_id,
          },
        });
        const NEW_NOTIFICATION = {
          email: customer.email,
          type: 'customer',
          title: `Interested dispatcher for package: ${package_id}`,
          message: 'A dispatcher is interested in your package. Please ensure you checkout the dispatcher\'s profile first, before approving them',
          action_link: (isProduction) ? `https://api.koogah.com/v1/profile/courier/pv/${user.id}` : `http://localhost:4000/v1/profile/courier/pv/${user.id}`, // ensure customer is logged in
        };
        await Notifications.create({ ...NEW_NOTIFICATION });
        return res.status(200).json({
          status: 200,
          message: 'Your interest is acknowledged. The owner of the package will be notified shortly',
          data: updated_package,
        });
      }).catch((err) => {
        log(err);
        res.status(400).json({
          status: 400,
          error: err,
        });
      });
    }).catch((err) => {
      log(err);
      res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }
  /**
   * @method approve_or_decline
   * @memberof Package
   * @params req, res
   * @description this method allows a customer approve/decline a dispatcher's request
   * @return JSON object
   */

  static approve_or_decline(req, res) {
    const { package_id } = req.params;
    const { response } = req.query;
    const { user } = req.session;
    const NEW_NOTIFICATION = {
      type: 'courier',
    };
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Package not found',
        });
      }
      if (_package.customer_id !== user.id) {
        return res.status(401).json({
          status: 401,
          error: 'You are not allowed to perform this action. Please contact support@koogah.com',
        });
      }
      if (!_package.pending_dispatcher_id) {
        return res.status(400).json({
          status: 400,
          error: 'Cannot perform action. No Pending dispatcher for this package',
        });
      }
      if (response === 'approve') {
        const date_time = new Date().toLocaleString();
        const dispatcher = await Couriers.findOne({
          where: {
            id: _package.pending_dispatcher_id,
          },
        });

        if (!dispatcher) {
          return res.status(404).json({
            status: 404,
            error: 'Oops, seems the dispatcher doesn\'t exists anymore...',
          });
        }
        if (dispatcher.pickups > 0) {
          return res.status(401).json({
            status: 401,
            error: `Oops cannot select dispatcher\n${dispatcher.first_name}${' '}${dispatcher.last_name} already dispatches for another customer`,
          });
        }

        await Packages.update({
          dispatcher_id: _package.pending_dispatcher_id,
          pickup_time: date_time,
          pending_dispatcher_id: null,
          status: 'picked-up',
        },
        {
          where: {
            package_id,
          },
        });
        const number_of_pickups = parseInt(dispatcher.pickups, 10) + 1;
        const number_of_pending_deliveries = parseInt(dispatcher.pending, 10) + 1;
        await Couriers.update({
          pickups: number_of_pickups,
          pending: number_of_pending_deliveries,
        }, {
          where: {
            email: dispatcher.email,
          },
        });
        NEW_NOTIFICATION.email = dispatcher.email;
        NEW_NOTIFICATION.message = 'A customer has approved you to dispatch their package. \n Please ensure you meet them at a rather safe zone or outside their doors and/or gate';
        NEW_NOTIFICATION.title = 'New Dispatch Approval';
        NEW_NOTIFICATION.action_link = (isProduction) ? `https://api.koogah.com/v1/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }
      if (response === 'decline') {
        const dispatcher = await Couriers.findOne({
          where: {
            id: _package.pending_dispatcher_id,
          },
        });
        await Packages.update({
          pending_dispatcher_id: null,
        },
        {
          where: {
            package_id,
          },
        });
        NEW_NOTIFICATION.email = dispatcher.email;
        NEW_NOTIFICATION.message = `A customer has declined your request to dispatch their package with id: ${package_id}.`;
        NEW_NOTIFICATION.title = 'New Dispatch Decline';
        NEW_NOTIFICATION.action_link = (isProduction) ? `https://api.koogah.com/v1/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }
      const updated_package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      await Notifications.create({ ...NEW_NOTIFICATION });
      const res_message = `Successfully ${response === 'approve' ? 'approved' : 'declined'} dispatcher request`;
      return res.status(200).json({
        status: 200,
        message: res_message,
        updated_package,
      });
    }).catch((err) => {
      log(err);
      res.status(400).json({
        status: 400,
        error: err,
      });
    });
  }

  /**
   * @method change_weight
   * @memberof Package
   * @params req, res
   * @description courier can change the weight of package they pick up, in negotiation
   * @return JSON object
   */

  static change_weight(req, res) {
    const { user } = req.session;
    const { package_id } = req.params;
    const { new_weight } = req.body;
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Package not found',
        });
      }
      if (_package.dispatcher_id !== user.id) {
        return res.status(401).json({
          status: 401,
          message: 'You are not allowed to perform this action',
        });
      }
      const new_delivery_price = calc_delivery_price(
        _package.type_of_dispatch,
        new_weight,
        _package.distance,
      );
      return Promise.try(async () => {
        await Packages.update({
          pending_weight: new_weight,
          pending_delivery_price: new_delivery_price,
        },
        {
          where: {
            package_id,
          },
        });
        const updated_package = await Packages.findOne({
          where: {
            package_id,
          },
        });
        const package_owner = await Customers.findOne({
          where: {
            id: updated_package.customer_id,
          },
        });
        const NEW_NOTIFICATION = {
          email: package_owner.email,
          type: 'customer',
          message: `The approved dispatcher for package with id: ${package_id} has changed the weight of the package`,
          title: 'New weight change',
          action_link: (isProduction) ? `https://api.koogah.com/v1/package/owner/view/${package_id}` : `http://localhost:4000/v1/package/owner/view/${package_id}`, // ensure customer is logged in
        };
        await Notifications.create({ ...NEW_NOTIFICATION });
        return res.status(200).json({
          status: 200,
          message: 'package weight change awaits approval from package owner',
          updated_package,
        });
      }).catch((err) => {
        log(err);
        return res.status(400).json({
          status: 400,
          error: err,
        });
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
   * @method approve_or_decline_weight_change
   * @memberof Package
   * @params req, res
   * @description Customer can approve or decline the request to change weight
   * @return JSON object
   */

  static approve_or_decline_weight_change(req, res) {
    const { user } = req.session;
    const { response } = req.query;
    const { package_id } = req.params;
    const NEW_NOTIFICATION = {
      type: 'courier',
    };
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Package not found',
        });
      }
      if (_package.customer_id !== user.id) {
        return res.status(400).json({
          status: 401,
          error: 'You are not allowed to perform this action. Please contact support@koogah.com',
        });
      }
      if (!_package.pending_weight || !_package.pending_delivery_price) {
        return res.status(400).json({
          status: 400,
          error: 'Oops, seems there is no pending weight change for this package',
        });
      }
      const dispatcher = await Couriers.findOne({
        where: {
          id: _package.dispatcher_id,
        },
      });
      if (response === 'approve') {
        await Packages.update({
          weight: _package.pending_weight,
          delivery_price: _package.pending_delivery_price,
          pending_weight: null,
          pending_delivery_price: null,
        },
        {
          where: {
            package_id,
          },
        });
        NEW_NOTIFICATION.email = dispatcher.email;
        NEW_NOTIFICATION.message = `A customer just approved weight change for package with id: ${package_id}`;
        NEW_NOTIFICATION.title = 'New weight change approval';
        NEW_NOTIFICATION.action_link = (isProduction) ? `https://api.koogah.com/v1/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }
      if (response === 'decline') {
        await Packages.update({
          pending_weight: null,
          pending_delivery_price: null,
        });
        NEW_NOTIFICATION.email = dispatcher.email;
        NEW_NOTIFICATION.message = `A customer just declined weight change for package with id: ${package_id}`;
        NEW_NOTIFICATION.title = 'New weight change declined';
        NEW_NOTIFICATION.action_link = (isProduction) ? `https://api.koogah.com/v1/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }
      const updated_package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      await Notifications.create({ ...NEW_NOTIFICATION });
      const res_message = `Successfully ${response === 'approve' ? 'approved' : 'declined'} weight change request`;
      return res.status(200).json({
        status: 200,
        message: res_message,
        updated_package,
      });
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        error: err,
      });
    });
  }

  /**
   * @method mark_package_as_delivered
   * @memberof Package
   * @params req, res
   * @description Couriers can mark a package as delivered, when they deliver it.
   * @return JSON object
   */

  static mark_package_as_delivered(req, res) {
    const { user } = req.session;
    const { package_id } = req.params;
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          package_id,
        },
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Oops, seems the package doesn\'t exist anymore',
        });
      }
      if (_package.dispatcher_id !== user.id) {
        return res.status(401).json({
          status: 401,
          error: 'You are not authorized to perform this action',
        });
      }
      if (_package.dropoff_time || _package.status === 'delivered') {
        return res.status(400).json({
          status: 400,
          error: 'Oops, seems you have already delivered this package',
        });
      }
      const date_time = new Date().toLocaleString();
      await Packages.update({
        status: 'delivered',
        dropoff_time: date_time,
      },
      {
        where: {
          package_id,
        },
      });
      const user_new_delivery_count = parseInt(user.deliveries, 10) + 1;
      const user_new_pending_count = parseInt(user.pending, 10) - 1;
      await Couriers.update({
        deliveries: user_new_delivery_count,
        pending: user_new_pending_count,
      },
      {
        where: {
          email: user.email,
        },
      });
      const updated_package = await Packages.findOne({
        where: {
          package_id,
        },
        include: [
          {
            model: Couriers,
            as: 'dispatcher',
            attributes: ['first_name', 'last_name', 'profile_image'],
          },
        ],
      });
      const customer = await Customers.findOne({
        where: {
          id: updated_package.customer_id,
        },
      });
      const NEW_NOTIFICATION = {
        email: customer.email,
        type: 'customer',
        message: `The dispatcher for the package with id: ${package_id}, just marked the package as delivered`,
        title: 'New Package Delivered',
        action_link: (isProduction) ? `https://api.koogah.com/v1/package/owner/view/${package_id}` : `http://localhost:4000/v1/package/owner/view/${package_id}`, // ensure customer is logged in
      };
      await Notifications.create({ ...NEW_NOTIFICATION });
      return res.status(200).json({
        status: 200,
        message: 'Package delivered successfully',
        data: updated_package,
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
   * @method courier_preview_package
   * @memberof Package
   * @params req, res
   * @description Couriers can preview a package they are approved to dispatch.
   * @return JSON object
   */

  static courier_preview_package(req, res) {
    const { user } = req.session;
    const { package_id } = req.params;
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          package_id,
        },
        include: [
          {
            model: Customers,
            as: 'customer',
          },
        ],
      });
      if (!_package) {
        return res.status(404).json({
          status: 404,
          error: 'Package doesn\'t exists',
        });
      }
      if (_package.dispatcher_id !== user.id) {
        return res.status(404).json({
          status: 404,
          error: 'You are not authorized to view this package details',
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'Package retreived successfully',
        data: _package,
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
   * @method customer_view_package
   * @memberof Package
   * @params req, res
   * @description Customers can view a package they own
   * @return JSON object
   */

  static customer_view_package(req, res) {
    const { user } = req.session;
    const { package_id } = req.params;
    return Promise.try(async () => {
      const _package = await Packages.findOne({
        where: {
          [Op.and]: [{ customer_id: user.id }, { package_id }],
        },
        include: [
          {
            model: Couriers,
            as: 'dispatcher',
          },
        ],
      });
      if (!_package) {
        return res.status(401).json({
          status: 401,
          error: 'You cannot view this package',
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'Package retreived successfully',
        data: _package,
      });
    }).catch((error) => {
      log(error);
      return res.status(400).json({
        status: 400,
        error,
      });
    });
  }

  /**
   * @method customer_view_all_package
   * @memberof Package
   * @params req, res
   * @description Customers can view all packages they own
   * @return JSON object
   */

  static customer_view_all_package(req, res) {
    const { user } = req.session;
    const { status } = req.query;
    return Promise.try(async () => {
      let all_packages;
      if (!status) {
        all_packages = await Packages.findAll({
          where: {
            customer_id: user.id,
          },
          include: [
            {
              model: Couriers,
              as: 'dispatcher',
            },
          ],
        });
      } else {
        all_packages = await Packages.findAll({
          where: {
            customer_id: user.id,
            status,
          },
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'All packages retreived successfully',
        data: all_packages,
      });
    }).catch((error) => {
      log(error);
      return res.status(400).json({
        status: 400,
        error,
      });
    });
  }
  /**
   * @method courier_view_all_package
   * @memberof Package
   * @params req, res
   * @description Couriers can view all packages they dispatch
   * @return JSON object
   */

  static courier_view_all_package(req, res) {
    const { user } = req.session;
    const { status } = req.query;
    return Promise.try(async () => {
      let all_packages;
      if (!status) {
        all_packages = await Packages.findAll({
          where: {
            dispatcher_id: user.id,
          },
          include: [
            {
              model: Customers,
              as: 'customer',
            },
          ],
        });
      } else {
        all_packages = await Packages.findAll({
          where: {
            dispatcher_id: user.id,
            status,
          },
        });
      }
      return res.status(200).json({
        status: 200,
        message: 'All packages retreived successfully',
        data: all_packages,
      });
    }).catch((error) => {
      log(error);
      return res.status(400).json({
        status: 400,
        error,
      });
    });
  }

  /**
   * @method courier_view_marketplace
   * @memberof Package
   * @params req, res
   * @description Couriers can view all packages in the market place
   * @return JSON object
   */

   static courier_view_packages_in_marketplace(req, res) {
     return Promise.try( async () => {
       const { user } = req.session;
       let { from, state, to, dispatch_type } = req.query;
       if (!state) {
        state = user.state
       }
       if (!from) {
         from = user.town
       }
       let all_package_in_marketplace;

       if (!dispatch_type) {
         dispatch_type = 'intra-state'
       }

       if (dispatch_type === 'intra-state') {
        if (!to) { 
          all_package_in_marketplace = await Packages.findAll({
            where: {
              [Op.and]: [
                  { from_state: state }, 
                  { to_state: state },
                  { from_town: from },
                  { type_of_dispatch: dispatch_type }
                ]
            }
          })
         }
        else {
          all_package_in_marketplace = await Packages.findAll({
            where: {
              [Op.and]: [
                  { from_state: state }, 
                  { to_state: state },
                  { from_town: from },
                  { to_town: to},
                  { type_of_dispatch: dispatch_type }
                ]
            }
          })
        }
       }

       if (dispatch_type === 'inter-state') {
         if (!to) {
            all_package_in_marketplace = await Packages.findAll({
              where: {
                [Op.and]: [
                    { from_state: from }, 
                    { type_of_dispatch: dispatch_type }
                  ]
              }
            })
         } else {
          all_package_in_marketplace = await Packages.findAll({
            where: {
              [Op.and]: [
                  { from_state: from }, 
                  { to_state: to },
                  { type_of_dispatch: dispatch_type }
                ]
            }
          })
         }
       }

       if (dispatch_type === 'international') {
         if(!to) {
           all_package_in_marketplace = await Packages.findAll({
             where: {
              [Op.and]: [
                  { from_country: from }, 
                  { type_of_dispatch: dispatch_type }
                ]
            }
           })
         } else {
          all_package_in_marketplace = await Packages.findAll({
            where: {
              [Op.and]: [
                  { from_country: from }, 
                  { type_of_dispatch: dispatch_type },
                  { to_country: to}
                ]
            }
          })
         }
       }

       return res.status(200).json({
         status: 200,
         message: 'package retrieved successfully',
         data: all_package_in_marketplace
       })
     }).catch((error) => {
      log(error);
      return res.status(400).json({
        status: 400,
        error,
      });
     })
   }
}


export default Package;
