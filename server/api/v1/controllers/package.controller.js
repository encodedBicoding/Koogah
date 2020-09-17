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
        const distance_in_km = result.rows[0].elements[0].distance.text;
        const distance = Math.ceil(Number(distance_in_km.split(' ')[0].replace(',', '')));
        const delivery_price = calc_delivery_price(type, weight, distance);
        if (!delivery_price) {
          return res.status(400).json({
            status: 400,
            error: 'Weight must match one of ["0-5","6-10", "11-15", "16-25", "26-40", "50-100", "101-200", "201-300", "301-400", "401-500", "501>"],',
          });
        }
        if (Number(delivery_price) > Number(user.virtual_balance)) {
          return res.status(400).json({
            status: 400,
            error: `You must top-up your account with at least ₦${Number(delivery_price) - Number(user.virtual_balance)} before requesting this dispatch`
          })
        }
        if ((Number(user.virtual_balance) - Number(user.virtual_allocated_balance)) < Number(delivery_price)) {
          return res.status(400).json({
            status: 400,
            error: 'Sorry you have reached your package balance threshold, \nplease top-up your account or delete a package that has not been picked-up'
          })
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
        const updated_V_A_B = Number(user.virtual_allocated_balance) + Number(delivery_price)
        await Customers.update({
          virtual_allocated_balance: updated_V_A_B
        }, {
          where: {
            id: user.id
          }
        });
        // TODO: this should create a new package creation notification
        // and/or send a websocket notification to all couriers registered in the package location area
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
      if (_package.pending_dispatchers.includes(user.id)) {
        return res.status(400).json({
          status: 400,
          error: 'You have already indicated interest for the package. Please wait for the owner to approve you.',
        });
      }
      // update Package and send a notification to the owner of the package.
      return Promise.try(async () => {
        await Packages.update({
          pending_dispatchers: _package.pending_dispatchers.concat(user.id),
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
          desc: 'CD004',
          title: `Interested dispatcher for package: ${package_id}`,
          message: _package.pending_dispatchers.length <= 1 ? 'A dispatcher is interested in your package. Please ensure you checkout the dispatcher\'s profile first, before approving them' : 'Another dispatcher is interested in your package. Please ensure you checkout the dispatcher\'s profile first, before approving them',
          action_link: (isProduction) ? `${process.env.SERVER_APP_URL}/profile/courier/pv/${user.id}` : `http://localhost:4000/v1/profile/courier/pv/${user.id}`, // ensure customer is logged in
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
    const { package_id, dispatcher_id } = req.params;
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
      if (!_package.pending_dispatchers) {
        return res.status(400).json({
          status: 400,
          error: 'Cannot perform action. No Pending dispatcher for this package',
        });
      }
      if (!_package.pending_dispatchers.includes(dispatcher_id)) {
        return res.status(404).json({
          status: 404,
          error: 'The selected dispatcher is not interested in dispatching this package'
        })
      }
      if (response === 'approve') {
        const date_time = new Date().toLocaleString();
        const dispatcher = await Couriers.findOne({
          where: {
            id: dispatcher_id,
          },
        });

        if (!dispatcher) {
          return res.status(404).json({
            status: 404,
            error: 'Oops, seems the dispatcher doesn\'t exists anymore...',
          });
        }
        if (dispatcher.pending > 0) {
          return res.status(401).json({
            status: 401,
            error: `Oops cannot select dispatcher\n${dispatcher.first_name}${' '}${dispatcher.last_name} already dispatches for another customer`,
          });
        }

        await Packages.update({
          dispatcher_id,
          pickup_time: date_time,
          pending_dispatchers: [],
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
        NEW_NOTIFICATION.desc='CD005';
        NEW_NOTIFICATION.message = 'A customer has approved you to dispatch their package. \n Please ensure you meet them at a rather safe zone or outside their doors and/or gate';
        NEW_NOTIFICATION.title = 'New Dispatch Approval';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }
      if (response === 'decline') {
        const dispatcher = await Couriers.findOne({
          where: {
            id: dispatcher_id,
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
        NEW_NOTIFICATION.desc='CD005';
        NEW_NOTIFICATION.message = `A customer has declined your request to dispatch their package with id: ${package_id}.`;
        NEW_NOTIFICATION.title = 'New Dispatch Decline';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
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
          desc: 'CD006',
          message: `The approved dispatcher for package with id: ${package_id} has changed the weight of the package`,
          title: 'New weight change',
          action_link: (isProduction) ? `${process.env.SERVER_APP_URL}/package/owner/view/${package_id}` : `http://localhost:4000/v1/package/owner/view/${package_id}`, // ensure customer is logged in
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
        // check if customer's virtual balance is enough for dispatch the goods
        if (Number(_package.pending_delivery_price) > Number(user.virtual_balance)) {
          return res.status(400).json({
            status: 400,
            error: 'Please top-up your account to approve this new weight change'
          })
        }
        // remove the previous delivery cost from the allocated virual balance
        // then compare with the user current virtual balance against the new delivery price
        let updated_V_A_B = Number(user.virtual_allocated_balance) - Number(_package.delivery_price);
        if ((Number(user.virtual_balance) - Number(updated_V_A_B)) < Number(_package.pending_delivery_price)) {
          return res.status(400).json({
            status: 400,
            error: 'Please top-up your account to approve this new weight change'
          })
        }
        updated_V_A_B = Number(updated_V_A_B) + Number(_package.pending_delivery_price);
        await Customers.update({
          virtual_allocated_balance: updated_V_A_B
        }, {
          where: {
            id: user.id
          }
        })
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
        NEW_NOTIFICATION.desc="CD007";
        NEW_NOTIFICATION.message = `A customer just approved weight change for package with id: ${package_id}`;
        NEW_NOTIFICATION.title = 'New weight change approval';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
      }
      if (response === 'decline') {
        await Packages.update({
          pending_weight: null,
          pending_delivery_price: null,
        },
        {
          where: {
            package_id,
          },
        });
        NEW_NOTIFICATION.email = dispatcher.email;
        NEW_NOTIFICATION.desc="CD007";
        NEW_NOTIFICATION.message = `A customer just declined weight change for package with id: ${package_id}`;
        NEW_NOTIFICATION.title = 'New weight change declined';
        NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in
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
      const date_time = new Date();
      await Packages.update({
        status: 'delivered',
        is_currently_tracking: false,
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
        desc: 'CD008',
        message: `The dispatcher for the package with id: ${package_id}, just marked the package as delivered`,
        title: 'New Package Delivered',
        action_link: (isProduction) ? `${process.env.SERVER_APP_URL}/package/owner/view/${package_id}` : `http://localhost:4000/v1/package/owner/view/${package_id}`, // ensure customer is logged in TODO: fix action link
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
                  { type_of_dispatch: dispatch_type },
                  { dispatcher_id: null}
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
                  { type_of_dispatch: dispatch_type },
                  { dispatcher_id: null}
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
                    { type_of_dispatch: dispatch_type },
                    { dispatcher_id: null}
                  ]
              }
            })
         } else {
          all_package_in_marketplace = await Packages.findAll({
            where: {
              [Op.and]: [
                  { from_state: from }, 
                  { to_state: to },
                  { type_of_dispatch: dispatch_type },
                  { dispatcher_id: null}
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
                  { type_of_dispatch: dispatch_type },
                  { dispatcher_id: null}
                ]
            }
           })
         } else {
          all_package_in_marketplace = await Packages.findAll({
            where: {
              [Op.and]: [
                  { from_country: from }, 
                  { type_of_dispatch: dispatch_type },
                  { to_country: to},
                  { dispatcher_id: null}
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

  /**
   * @method declinePickup
   * @memberof Package
   * @params req, res
   * @description Couriers can decline pickup if they fail to come to an agreement with a customer
   * @return JSON object
   */

  static declinePickup(req, res) {
    return Promise.try( async() => {
      const { decline_cause } = req.body;
      const { package_id } = req.query;
      const { user } = req.session;
      const NEW_NOTIFICATION = {
        type: 'customer',
      };

      const isFound = await Packages.findOne({ 
        where: {
          [Op.and]: [{ package_id}, {dispatcher_id: user.id}]
        }
      });
      if (!isFound) {
        return res.status(404).json({
          status: 404,
          error: 'Sorry, cannot decline a package you didn\'t pickup'
        })
      }
      // update the dispatcher's pending;
      const current_pending_deliveries = parseInt(user.pending, 10) - 1;
      await Couriers.update({
        pending: current_pending_deliveries
      }, {
        where: {
          id: user.id
        }
      })
      // find the customer to create a notification;
      const customer = await Customers.findOne({
        where: {
          id: isFound.customer_id
        }
      })

      await Packages.update({
        dispatcher_id: null,
        status: 'not-picked',
        pickup_time: null,
        pickup_decline_cause: decline_cause
      }, {
        where: {
        package_id
      }})

      NEW_NOTIFICATION.email = customer.email;
      NEW_NOTIFICATION.desc = 'CD009';
      NEW_NOTIFICATION.message = `A dispatcher just declined pickup for package with id: ${package_id}`,
      NEW_NOTIFICATION.title = 'New pickup decline';
      NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in

      await Notifications.create({ ...NEW_NOTIFICATION })

      return res.status(200).json({
        status: 200,
        message: 'You have successfully declined this pick-up'
      })

    })
    .catch((error) => {
      log(error);
      return res.status(400).json({
        status: 400,
        error
      })
    })
  }

  /**
   * @method allPackagePendingDispatchers
   * @memberof Package
   * @params req, res
   * @description Customers can get all pending dispatch requests in a package.
   * @return JSON object
   */

  static allPackagePendingDispatchers(req, res) {
    return Promise.try( async () => {
      const { package_id } = req.params;
      const _package = await Packages.findOne({
        where: {
          package_id
        }
      });
      if (!_package) return res.status(404).json({
        status: 404,
        message: 'Oops, seems this package doesn\'t exist anymore'
      });

      const pending_dispatchers = [];
      for(var i=0; i<_package.pending_dispatchers.length; i++) {
        let _dispatcher = await Couriers.findOne({
          where: {
            id: _package.pending_dispatchers[i]
          }
        });
        if (!_dispatcher) {
          continue;
        }
        pending_dispatchers.push(_dispatcher.getSafeDataValues());

        if (i === (_package.pending_dispatchers.length - 1)) {
          return res.status(200).json({
            status: 200,
            message: 'dispatchers retrieved successfully',
            data: pending_dispatchers
          })
        }
      }
    }).catch((error ) => {
      log(error);
      return res.status(400).json({
        status: 400,
        error
      });
    });
  }

  /**
   * @method startDispatch //Start Tracking
   * @memberof Package
   * @params req, res
   * @description Couriers can mark a package as tracking, this means they have started their journey to dispatch the package
   * @return JSON object
   */

  static startDispatch(req, res) {
    return Promise.try(async () =>{
      const {package_id } = req.params;
      const { user } = req.session;
      const NEW_NOTIFICATION = {
        type: 'customer',
      }
      const _package = await Packages.findOne({ 
        where: {
          package_id
        }
      });

      if(!_package) return res.status(400).json({
        status: 400,
        message: 'Oops, seems package doesn\'t exist anymore'
      });

      if (_package.dispatcher_id !== user.id) {
        return res.status(400).json({
          status: 400,
          message: 'Sorry, cannot dispatch package you didn\'t pick up'
        })
      }

      const customer = await Customers.findOne({
        where: {
          id: _package.customer_id
        }
      })

      await Packages.update({
        is_currently_tracking: true
      }, {
        where: {
        package_id
      }});

      NEW_NOTIFICATION.email = customer.email;
      NEW_NOTIFICATION.desc = 'CD010';
      NEW_NOTIFICATION.message = `Your package with id: ${package_id} is now being dispatched`;
      NEW_NOTIFICATION.title = 'New Dispatch started';
      NEW_NOTIFICATION.action_link = (isProduction) ? `${process.env.SERVER_APP_URL}/package/preview/${package_id}` : `http://localhost:4000/v1/package/preview/${package_id}`; // ensure courier is logged in

      await Notifications.create({ ...NEW_NOTIFICATION });

      return res.status(200).json({
        status: 200,
        message: 'You have successfully started this dispatch.'
      })

    }).catch((error)=> {
      log(error);
      return res.status(400).json({
        status: 400,
        error
      });
    })
  }

  /**
   * @method allCurrentlyTrackingPackages
   * @memberof Package
   * @params req, res
   * @description Customers can get all their packages currently tracking
   * @return JSON object
   */

   static allCurrentlyTrackingPackages(req, res) {
     return Promise.try(async () => {
       const { user} = req.session;
       const _packages = await Packages.findAll({
         where: {
           [Op.and]: [{customer_id: user.id}, {is_currently_tracking: true}]
         }
       });

       return res.status(200).json({
         status: 200,
         message: 'Packages retrieved successfully',
         data: _packages
       })
     }).catch((err)=> {
       log(err);
       return res.status(400).json({
        status: 400,
        err
      });
     })
   }

}


export default Package;
