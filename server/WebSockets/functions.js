import { Customers, Couriers, PackagesTrackings } from '../database/models';
import Sequelize from 'sequelize';
const { Op } = Sequelize;

class WebSocketFunctions {
  async subscribe(msg) {
    const { userId, userType, channel } = msg;
    let USER;
    try {
      if (userType === 'dispatcher') {
        USER = await Couriers.findOne({ where: { id: userId } });
        if (!USER) return false;
        // get the list of channels
        // compare to ensure no duplicates;
        let connected_channels = new Array(...USER.ws_connected_channels);
        if (!connected_channels.includes(channel)) {
          connected_channels.push(channel);
            await Couriers.update({
              ws_connected_channels: connected_channels,
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
        let connected_channels = new Array(...USER.ws_connected_channels);
        if (!connected_channels.includes(channel)) {
          connected_channels.push(channel);
          await Customers.update({
            ws_connected_channels: connected_channels,
          }, {
            where: {
              id: userId
            }
          });
        }
        const updated_user = await Customers.findOne({
          where: {
            id: userId
          }
        });
        const { ws_connected_channels } = updated_user.getSafeDataValues();
        return ws_connected_channels;
      }
     } catch (err) {
      console.error(err);
      return false;
    }
  }

  async unsubscribe(msg) {
    const { userType, userId, channel } = msg;
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
              id: msg.userId
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

  async updateAndGetCustomerTrackings(msg) {
    try {
      const currentTracking = await PackagesTrackings.findOne({
        where: {
          package_id: msg.package_id,
          customer_id: msg.customer_id
        }
      });
      if (!currentTracking) {
        return new Error('Tracking data does not exist')
      }
      await PackagesTrackings.update({
        dispatcher_lat: msg.dispatcher_lat,
        dispatcher_lng: msg.dispatcher_lng
      }, {
        where: { package_id: msg.package_id, customer_id: msg.customer_id }
      });

      const all_trackings = await PackagesTrackings.findAll({
        where: {
          customer_id: msg.customer_id
        }
      });
      return all_trackings;
    } catch (error) {
      return false;
    }
  }

  async getCustomerTrackings(msg) {
    try {
      const all_trackings = await PackagesTrackings.findAll({
        where: {
          customer_id: msg.customer_id
        }
      });
      return all_trackings;
    } catch (err) {
      return false;
    }
  }
}

export default WebSocketFunctions;