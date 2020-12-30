
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

    let backDate = new Date().setMonth(10);
    let all_notifications = [];
    all_notifications = NotificationArray.filter((notification) => { 
      let notification_date = notification.createdAt.toLocaleString().split(',').join();
      notification_date = notification_date.split('/');

      let y = Number(notification_date[2].split(',')[0]);
      let m = Number(notification_date[0]);
      let d = Number(notification_date[1]);

      let notification_date_obj = Date.UTC(y, m, d);
      if (backDate < notification_date_obj) {
        return notification;
      }
    });

    const user_websocket_id = `${type.toLowerCase()}:${user.email}:${user.id}`;

    eventEmitter.emit('new_notification', {
      connectionId: user_websocket_id,
      data: all_notifications
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
      PushNotify.sendMessage(notification_message, device_token);
    }

  } catch (error) { 
    throw new Error(`${error.message}`);
  }
}