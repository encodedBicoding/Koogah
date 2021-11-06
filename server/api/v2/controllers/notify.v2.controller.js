
import Sequelize from 'sequelize';
import log from 'fancy-log';
import {
  PushDevices,
} from '../../../database/models';


const { Op } = Sequelize;


/**
 * @class NotifyV2
 */
class NotifyV2 {
    /**
   * @method store_device_token_v2
   * @memberof Notify
   * @description This method stores a user device token
   * @params req, res
   * @return JSON object
   */

     static store_device_token_v2(req, res) {
      const {
        userId,
        platform,
        userType
      } = req.params;
       const { token, current_state_location } = req.query;
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
            token,
            current_state_location: current_state_location ? current_state_location : null,
         })
        } else {
          deviceState = 200
          await PushDevices.update({
            platform,
            token,
            current_state_location: current_state_location ? current_state_location : null,
          }, {
            where: {
              [Op.and]: {
                user_id: userId,
                user_type: userType,
              }
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
}

export default NotifyV2;