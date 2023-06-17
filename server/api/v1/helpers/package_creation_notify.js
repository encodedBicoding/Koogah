const cron = require('node-cron')
import log from 'fancy-log'

import {
  PushDevices,
} from '../../../database/models'
import PushNotify from '../../../PushNotifications'

class PackageCreationNotify {
  defaultSchedule = '1 * * * * *'

  async sendNewPackageCreationToDispatchersV2(msg, schedule = null) {
    try {
      let sch = schedule ? schedule : this.defaultSchedule
      const task = cron.schedule(sch, async () => {
        const allPushDevices = await PushDevices.findAll({
          where: {
            is_active: true,
            current_state_location: {
              [Op.iLike]: `%${msg.pickup_state}%`,
            },
          },
        })
        const device_notify_obj = {
          title: 'New Pickup - Koogah',
          body: `Hi, ${msg.detail}`,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          icon: 'ic_launcher',
        }
        const all_tokens = allPushDevices.map((pd) => pd.token)
        const notification_message = PushNotify.createMessage(
          device_notify_obj,
          {
            notification_id: Math.floor(Math.random() * 1234 * 60),
            desc: 'CD012',
          },
        )
        PushNotify.sendMessageDispatcher(notification_message, all_tokens)
      })
      task.stop()
    } catch (err) {
      log(err)
    }
  }
}

const packageCreationNotifier = new PackageCreationNotify()

export default packageCreationNotifier
