
import eventEmitter from '../../../EventEmitter';
import PushNotify from '../../../PushNotifications';
import { PushDevices } from '../../../database/models';
import Sequelize from 'sequelize';

const { Op } = Sequelize;

export default async function Notifier(
  NotificationArray,
  user,
  type,
  device_notify_obj,
  notification
) { 
  try { 
    if (!Array.isArray(NotificationArray)) { 
      throw new Error('Error: Notification Array must be an array');
    }
    if (typeof user !== 'object' || Object.keys(user).length <= 0) { 
      throw new Error('Error: User object not valid');
    }
    
    const user_websocket_id = `${type.toLowerCase()}:${user.email}:${user.id}`;

    eventEmitter.emit('new_notification', {
      connectionId: user_websocket_id,
      data: NotificationArray
    });

    const _user_device = await PushDevices.findOne({
      where: {
        [Op.and]: [{ user_id: user.id }, { is_active: true }, { user_type: type.toLowerCase() }]
      }
    });
   
    if (_user_device) { 
      if (_user_device.platform === 'ios') { 
        delete device_notify_obj['icon'];
      }

      const device_token = _user_device.token;
      const notification_message = PushNotify.createMessage(
        device_notify_obj,
        {
          notification_id: notification.id
        }
      );
      if (type === 'customer') {
        PushNotify.sendMessageCustomer(notification_message, device_token);
      } else {
        PushNotify.sendMessageDispatcher(notification_message, device_token);
      }
     
    }

  } catch (error) { 
    throw new Error(`${error.message}`);
  }
}