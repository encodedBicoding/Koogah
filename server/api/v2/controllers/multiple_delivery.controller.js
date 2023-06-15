import log from 'fancy-log'
import Sequelize from 'sequelize'
import {config} from 'dotenv'
import {MultipleDeliveries} from '../../../database/models'
import checkTypeV2 from '../helpers/check.type.v2'
import distanceApi from 'google-distance-matrix'
import uuid from 'uuid/v4'
import generate_ref from '../../v1/helpers/ref.id'
import {PriceCalculator} from '../helpers/calc.price.v2'
import {reject} from 'bluebird'

config()
distanceApi.key(process.env.GOOGLE_API_KEY)

const isProduction = process.env.NODE_ENV === 'production'
const {Op} = Sequelize

const cron = require('node-cron')

class MultipleDeliveriesController {
  /**
   * @method create_package_of_multiple_delivery
   * @memberof MultipleDeliveries
   * @params req, res
   * @description Customers can create multiple deliveries
   * @return JSON object
   */

  static create_package_of_multiple_delivery(req, res) {
    const thiz = new MultipleDeliveriesController()
    return Promise.try(async () => {
      const {multiple_delivery_id, transport_mode_category, value, ...data} =
        req.body
      const type_of_dispatch = req.params.type
      const {user} = req.session
      let multiple_delivery
      let package_data = {
        value,
        transport_mode_category,
        ...data,
      }
      let dispatch_type =
        type_of_dispatch.length <= 5
          ? `${type_of_dispatch}-state`
          : type_of_dispatch
      if (dispatch_type === 'intra-state') {
        package_data.to_state = data.from_state
      }
      package_data.type_of_dispatch = dispatch_type
      package_data.customer_id = user.id
      package_data.payment_mode = 'virtual_balance'
      package_data.is_express_delivery = false

      if (!multiple_delivery_id) {
        multiple_delivery = await MultipleDeliveries.create({
          type_of_dispatch: dispatch_type,
          customer_id: user.id,
          is_active: false,
        })
      } else {
        multiple_delivery = await MultipleDeliveries.findOne({
          where: {
            id: multiple_delivery_id,
          },
        })
      }

      // get package price;
      let package_dto = await thiz._calculate_price(package_data)
      const package_id = uuid()
      const delivery_key = generate_ref('delivery')
      package_dto = {
        ...package_dto,
        is_active: false,
        multiple_delivery_id: multiple_delivery.id,
        package_id,
        delivery_key,
      }
      console.log(package_dto)
      return res.send({})
    }).catch((err) => {
      log(err)
      return res.status(400).json({
        status: 400,
        err,
      })
    })
  }

  async _calculate_price(data) {
    try {
      return new Promise((resolve, reject) => {
        const dispatch_type = data.type_of_dispatch
        const origins = checkTypeV2('from', data, dispatch_type)
        const destinations = checkTypeV2('to', data, dispatch_type)
        distanceApi.matrix(
          [origins],
          [destinations],
          async function (err, result) {
            try {
              if (err) {
                reject(err)
              } else {
                const distance_in_km = result.rows[0].elements[0].distance.text
                const distance = Math.ceil(
                  Number(distance_in_km.split(' ')[0].replace(',', '')),
                )
                const delivery_price = await PriceCalculator.execute(
                  dispatch_type,
                  data.transport_mode_category,
                  distance,
                  data.value,
                  data.is_express_delivery,
                  data.from_state.toLowerCase(),
                )
                if (!delivery_price) {
                  reject(
                    'An error occurred, please try again while calculating delivery price',
                  )
                }
                const dt = {
                  delivery_price,
                  distance,
                  ...data,
                }
                resolve(dt)
              }
            } catch (err) {
              log(err)
              reject('An error occurred, please try again')
            }
          },
        )
      })
    } catch (err) {
      throw err
    }
  }
}

export default MultipleDeliveriesController
