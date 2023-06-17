import {Customers, Couriers, PackagesTrackings} from '../database/models'
import Sequelize from 'sequelize'
const {Op} = Sequelize

class WebSocketFunctions {
  async subscribe(msg) {
    const {userId, userType, channel} = msg
    try {
      const model = {
        dispatcher: Couriers,
        customer: Customers,
      }
      const user = await model[userType].findOne({where: {id: userId}})
      if (!user) return false
      let connected_channels = new Array(...user.connected_channels)
      if (!connected_channels.includes(channel)) {
        connected_channels.push(channel)
        await model[userType].update(
          {
            ws_connected_channels: connected_channels,
          },
          {
            where: {
              id: userId,
            },
          },
        )
      }

      const updated_user = await model[userType].findOne({
        where: {
          id: userId,
        },
      })
      const {ws_connected_channels} = updated_user.getSafeDataValues()
      return ws_connected_channels
    } catch (err) {
      console.error(err)
      return false
    }
  }

  async unsubscribe(msg) {
    const {userType, userId, channel} = msg
    try {
      const model = {
        dispatcher: Couriers,
        customer: Customers,
      }
      const user = await model[userType].findOne({where: {id: userId}})
      if (!user) return false
      let user_subscribed_channels = user.ws_connected_channels
      if (user_subscribed_channels.includes(channel)) {
        const new_channels = user_subscribed_channels.filter(
          (cc) => cc !== channel,
        )
        await model[userType].update(
          {
            ws_connected_channels: new_channels,
          },
          {
            where: {
              id: msg.userId,
            },
          },
        )
      }
      const updated_user = await model[userType].findOne({where: {id: userId}})
      const {ws_connected_channels} = updated_user.getSafeDataValues()
      return ws_connected_channels
    } catch (err) {
      console.log(err)
      return false
    }
  }

  async updateAndGetCustomerTrackings(msg) {
    try {
      const currentTracking = await PackagesTrackings.findOne({
        where: {
          package_id: msg.package_id,
          customer_id: msg.customer_id,
        },
      })
      if (!currentTracking) {
        return new Error('Tracking data does not exist')
      }
      await PackagesTrackings.update(
        {
          dispatcher_lat: msg.dispatcher_lat,
          dispatcher_lng: msg.dispatcher_lng,
        },
        {
          where: {package_id: msg.package_id, customer_id: msg.customer_id},
        },
      )

      const all_trackings = await PackagesTrackings.findAll({
        where: {
          customer_id: msg.customer_id,
        },
      })
      return all_trackings
    } catch (error) {
      return false
    }
  }

  async getCustomerTrackings(msg) {
    try {
      const all_trackings = await PackagesTrackings.findAll({
        where: {
          customer_id: msg.customer_id,
        },
      })
      return all_trackings
    } catch (err) {
      return false
    }
  }

  async getCompanyTrackingDispatchers(company_id) {
    try {
      const all_tracking_dispatchers = await Couriers.findAll({
        where: {
          [Op.and]: [
            {
              company_id,
            },
            {
              is_active: true,
            },
            {
              is_currently_dispatching: true,
            },
          ],
        },
        attributes: [
          'address',
          'created_at',
          'deliveries',
          'email',
          'first_name',
          'last_name',
          'id',
          'is_currently_dispatching',
          'mobile_number',
          'nationality',
          'pickups',
          'profile_image',
          'rating',
          'sex',
          'referal_id',
          'state',
          'town',
        ],
        order: [['created_at', 'DESC']],
      })
      return all_tracking_dispatchers
    } catch (err) {
      return false
    }
  }
}

export default WebSocketFunctions
