import { Customers, Couriers } from '../database/models';

class WebSocketFunctions {
  async subscribe(userId, userType, channel) {
    let USER;
    try {
      if (userType === 'dispatcher') {
        USER = await Couriers.findOne({ where: { id: userId } });
        if (!USER) return false;
        // get the list of channels
        // compare to ensure no duplicates;
        let connected_channels = USER.ws_connected_channels;
        if (!connected_channels.includes(channel)) {
            await Couriers.update({
              ws_connected_channels: USER.ws_connected_channels.concat(channel)
            }, {
              where: {
                id: userId
              }
          });
        }
        const updated_user = await Couriers.findOne({
          where: {
            id: userId
          }
        });
        const { ws_connected_channels } = updated_user.getSafeDataValues();
        return ws_connected_channels;
      } else if (userType === 'customer') {
        USER = await Customers.findOne({ where: { id: userId } });
        if (!USER) return false;
        let connected_channels = USER.ws_connected_channels;
        if (!connected_channels.includes(channel)) {
          await Customers.update({
            ws_connected_channels: USER.ws_connected_channels.concat(channel)
          }, {
            where: {
              id: userId
            }
          });

          const updated_user = await Customers.findOne({
            where: {
              id: userId
            }
          });
          const { ws_connected_channels } = updated_user.getSafeDataValues();
          return ws_connected_channels;
        }
      }
     } catch (err) {
      console.error(err);
      return false;
    }
  }

  async unsubscribe(userId, userType, channel) {
    let USER;
    try {
      if (userType === 'dispatcher') {
        USER = await Couriers.findOne({ where: { id: userId } });
        if (!USER) return false;
        let user_subscribed_channels = USER.ws_connected_channels;

        if (user_subscribed_channels.includes(channel)) {
          // find the index;
          // remove channel from list of subscribed channels;
          let idx = user_subscribed_channels.findIndex((ch) => ch === channel);
          user_subscribed_channels.splice(idx, 1);

          await Couriers.update({
            ws_connected_channels: user_subscribed_channels
          }, {
            where: {
              id: userId
            }
          });
        }

        const updated_user = await Couriers.findOne({ where: { id: userId } });
        const { ws_connected_channels } = updated_user.getSafeDataValues();
        return ws_connected_channels;
      } else if (userType === 'customer') {
        USER = await Customers.findOne({ where: { id: userId } });
        if (!USER) return false;
        let user_subscribed_channels = USER.ws_connected_channels;

        if (user_subscribed_channels.includes(channel)) {
          // find the index;
          // remove channel from list of subscribed channels;
          let idx = user_subscribed_channels.findIndex((ch) => ch === channel);
          user_subscribed_channels.splice(idx, 1);
          await Customers.update({
            ws_connected_channels: user_subscribed_channels
          }, {
            where: {
              id: userId
            }
          });
        }
        const updated_user = await Customers.findOne({ where: { id: userId } });
        const { ws_connected_channels } = updated_user.getSafeDataValues();
        return ws_connected_channels;
      }

    } catch (err) {
      console.log(err);
      return false;
    }
  }
}

export default WebSocketFunctions;