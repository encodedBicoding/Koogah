/* eslint-disable camelcase */
import Sequelize from 'sequelize';
import log from 'fancy-log';
import {
  Notifications,
  PushDevices,
} from '../../../database/models';
import moment from 'moment';


const { Op } = Sequelize;

/**
 * @class Notifications
 */
class Notify {
  /**
   * @method read_notification
   * @memberof Notify
   * @description This method allows a validated user read their notifications
   * @params req, res
   * @return JSON object
   */

  static read_notification(req, res) {
    const { user } = req.session;
    const { id } = req.query;
    const type = user.is_courier ? 'courier' : 'customer';
    return Promise.try(async () => {
      const isFound = await Notifications.findByPk(id);
      if (!isFound) {
        return res.status(404).json({
          status: 404,
          error: `Notification with id:${id} not found`,
        });
      }
      await Notifications.update({
        is_read: true
      }, {
        where: {
          [Op.and]: [{ email: user.email }, { type }, { id }]
        }
      })
      const all_unread_notifications = await Notifications.findAll({
        where: {
          [Op.and]: [{ email: user.email }, { type }, { is_read: false }]
        }
      })
      return res.status(200).json({
        status: 200,
        message: 'Notification read successfully',
        data: all_unread_notifications
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
   * @method get_all_unreads
   * @memberof Notify
   * @description This method allows a user to get all their notifications
   * @params req, res
   * @return JSON object
   */

  static get_all_notifications(req, res) {
    const { user } = req.session;
    const type = user.is_courier ? 'courier' : 'customer';
    return Promise.try(async () => {
      let timestamp_benchmark = moment().subtract(5, 'months').format();
      let all_notifications = await Notifications.findAll({
        where: {
          [Op.and]: [{ email: user.email }, { type }, { is_read: false }],
          created_at: {
            [Op.gte]: timestamp_benchmark
          }
        },
      });
      return res.status(200).json({
        status: 200,
        message: `Retreived all notifications for user: ${user.email}`,
        data: all_notifications.reverse(),
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
   * @method store_device_token
   * @memberof Notify
   * @description This method stores a user device token
   * @params req, res
   * @return JSON object
   */

  static store_device_token(req, res) {
    const {
      userId,
      platform,
      userType
    } = req.params;
    const { token } = req.query;
    return Promise.try(async () => {
      let deviceState = 0;
      let _device = await PushDevices.findOne({
        where: {
          [Op.and]: [{user_id: userId}, {user_type: userType}]
        }
      });
      if (!_device) {
        deviceState = 201 
        await PushDevices.create({
          user_id: userId,
          user_type: userType,
          platform,
          token
       })
      } else {
        deviceState = 200
        await PushDevices.update({
          platform,
          token
        }, {
          where: {
            user_id: userId
          }
        });
      }
      return res.status(deviceState).json({
        status: deviceState,
        message: 'Operation successful'
      })
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }
  /**
   * @method get_device_state
   * @memberof Notify
   * @description This method get the state of a user is_active attribute
   * @params req, res
   * @return JSON object
   */

  static get_device_state(req, res) {
    return Promise.try(async () => {
      const { userId, userType } = req.params;
      const is_found = await PushDevices.findOne({
        where: {
          [Op.and]: [{ user_id: userId }, { user_type: userType }]
        }
      });
      if (!is_found) {
        return res.status(404).json({
          status: 404,
          error: 'Push device not found'
        })
      }

      const { token, ...data } = is_found;
      return res.status(200).json({
        status: 200,
        data,
      })

    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

  /**
   * @method update_device_state
   * @memberof Notify
   * @description This method updates the state of a user is_active attribute
   * @params req, res
   * @return JSON object
   */

  // change this implementation to use websocket.

  static update_device_state(req, res) {
    return Promise.try(async () => {
      const { userId, userType } = req.params;
      const is_found = await PushDevices.findOne({
        where: {
          [Op.and]: [{ user_id: userId }, { user_type: userType }]
        }
      });
      if (!is_found) {
        return res.status(404).json({
          status: 404,
          error: 'Push device not found'
        })
      }
      await PushDevices.update({
        is_active: !is_found.is_active
      }, {
        where: {
          [Op.and]: [{ user_id: userId }, { user_type: userType }]
        }
      });
      const updated_push_device = await PushDevices.findOne({
        where: {
          [Op.and]: [{ user_id: userId }, { user_type: userType }]

        }
      })
      return res.status(200).json({
        status: 200,
        message: 'Push notification status changed',
        data: updated_push_device
      })
    }).catch((err) => {
      log(err);
      return res.status(400).json({
        status: 400,
        error: err,
      });
    })
  }

}
export default Notify;
