/* eslint-disable camelcase */
import Sequelize from 'sequelize';
import log from 'fancy-log';
import { Notifications } from '../../../database/models';


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
      await Notifications.destroy(
        {
          where: {
            [Op.and]: [{ email: user.email }, { type }, { id }],
          },
        },
      );
      return res.status(200).json({
        status: 200,
        message: 'Notification read successfully',
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

  static get_all_unreads(req, res) {
    const { user } = req.session;
    const type = user.is_courier ? 'courier' : 'customer';
    return Promise.try(async () => {
      const all_unreads = await Notifications.findAll({
        where: {
          [Op.and]: [{ email: user.email }, { type }, { is_read: false }],
        },
      });
      return res.status(200).json({
        status: 200,
        message: `Retreived all notifications for user: ${user.email}`,
        data: all_unreads,
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
export default Notify;
