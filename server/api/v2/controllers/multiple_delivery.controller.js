import log from 'fancy-log'
import Sequelize from 'sequelize'
import {config} from 'dotenv'
import {
  MultipleDeliveries,
  Packages,
  sequelize,
  Customers,
} from '../../../database/models'
import checkTypeV2 from '../helpers/check.type.v2'
import distanceApi from 'google-distance-matrix'
import uuid from 'uuid/v4'
import generate_ref from '../../v1/helpers/ref.id'
import {PriceCalculator} from '../helpers/calc.price.v2'
import packageCreationNotifier from '../../v1/helpers/package_creation_notify'
import eventEmitter from '../../../EventEmitter'

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
      const master_delivery_key = generate_ref('delivery')
      if (!multiple_delivery_id) {
        multiple_delivery = await MultipleDeliveries.create({
          type_of_dispatch: dispatch_type,
          customer_id: user.id,
          is_active: false,
          pickup_address: data.pickup_address,
          master_delivery_key: master_delivery_key,
        })
      } else {
        multiple_delivery = await MultipleDeliveries.findOne({
          where: {
            id: multiple_delivery_id,
          },
        })
        if (!multiple_delivery) {
          return res.status(404).json({
            status: 404,
            error: `No bulk delivery parent with the id ${multiple_delivery_id}`,
          })
        }
      }

      if (multiple_delivery_id) {
        let last_package
        const all_in_multi = await Packages.findAll({
          where: {
            multiple_delivery_id: multiple_delivery.id,
          },
        })
        last_package = all_in_multi[all_in_multi.length - 1]
        package_data.pickup_address = last_package.dropoff_address
      }

      let benchmark = ['delivered', 'tracking']

      if (
        benchmark.includes(multiple_delivery.status) &&
        multiple_delivery.is_active
      ) {
        return res.status(400).json({
          status: 400,
          error: `Cannot add new packages, parent status is said to be  ${multiple_delivery.status}`,
        })
      }
      // get package price;
      let package_dto = await thiz._calculate_price(package_data)

      if (
        multiple_delivery.is_active &&
        !benchmark.includes(multiple_delivery.status)
      ) {
        const current_package_price = package_dto.delivery_price
        const current_total = await thiz._get_total_price_for_delivery(
          multiple_delivery.id,
        )
        const _new_proposed_delivery_price = Math.ceil(
          Number(current_total) + Number(current_package_price),
        )
        if (
          Number(_new_proposed_delivery_price) > Number(user.virtual_balance)
        ) {
          return res.status(400).json({
            status: 400,
            error: `You must top-up your account with at least ₦${
              Number(_new_proposed_delivery_price) -
              Number(user.virtual_balance)
            } before you can add this package`,
          })
        }
        let updated_virtual_allocated_balance = 0
        if (user.virtual_allocated_balance > 0) {
          updated_virtual_allocated_balance =
            Number(user.virtual_allocated_balance) - Number(current_total)
        }
        if (
          Number(user.virtual_balance) -
            Number(updated_virtual_allocated_balance) <
          Number(_new_proposed_delivery_price)
        ) {
          return res.status(400).json({
            status: 400,
            error: `Please top-up your account before you can delete this package as new delivery price will be: ₦${_new_proposed_delivery_price}`,
          })
        }
        updated_virtual_allocated_balance =
          Number(updated_virtual_allocated_balance) +
          Number(_new_proposed_delivery_price)
        await Customers.update(
          {
            virtual_allocated_balance: updated_virtual_allocated_balance,
          },
          {
            where: {
              id: user.id,
            },
          },
        )
      }

      const package_id = uuid()
      const delivery_key = generate_ref('delivery')
      package_dto = {
        ...package_dto,
        is_active: false,
        multiple_delivery_id: multiple_delivery.id,
        package_id,
        delivery_key,
      }
      await Packages.create(package_dto)
      const all_package_in_multiple_delivery = await Packages.findAll({
        where: {
          multiple_delivery_id: multiple_delivery.id,
        },
      })
      return res.status(200).json({
        status: 200,
        message: 'Package added to multiple delivery',
        multiple_delivery_id: multiple_delivery.id,
        all_packages: all_package_in_multiple_delivery,
      })
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

  static cummulate_delivery_price_for_multiple_delivery(req, res) {
    const thiz = new MultipleDeliveriesController()
    return Promise.try(async () => {
      const {multiple_delivery_id} = req.params
      const total_amount = await thiz._get_total_price_for_delivery(
        multiple_delivery_id,
      )
      return res.status(200).json({
        status: 200,
        message: 'Total amount retrieved successfully',
        amount: total_amount,
      })
    }).catch((err) => {
      log(err)
      return res.status(400).json({
        status: 400,
        err,
      })
    })
  }
  static get(req, res) {
    return Promise.try(async () => {
      const {multiple_delivery_id} = req.params
      const multiple_delivery = await MultipleDeliveries.findOne({
        where: {
          id: multiple_delivery_id,
        },
        include: {model: Packages, as: 'packages'},
      })
      if (!multiple_delivery) {
        log(`No bulk delivery data found with this id: ${multiple_delivery_id}`)
        return res.status(400).json({
          status: 400,
          error: `No bulk delivery data found with this id: ${multiple_delivery_id}`,
        })
      }

      return res.status(200).json({
        status: 200,
        message: 'data retrieved successfully',
        data: multiple_delivery,
      })
    }).catch((err) => {
      log(err)
      return res.status(400).json({
        status: 400,
        error: err,
      })
    })
  }

  static delete_package_of_multiple_delivery(req, res) {
    const thiz = new MultipleDeliveriesController()
    return Promise.try(async () => {
      const {user} = req.session
      const {package_id} = req.params
      const _package = await Packages.findOne({
        where: {
          package_id: package_id,
        },
      })
      if (!_package) {
        return res.status(404).json({
          status: 400,
          error: 'Package not found',
        })
      }
      const multiple_delivery = await MultipleDeliveries.findOne({
        where: {
          id: _package.multiple_delivery_id,
        },
      })

      if (!multiple_delivery) {
        return res.status(404).json({
          status: 400,
          error: 'An error occurred while getting multi-parent for package',
        })
      }

      if (_package.pickup_address === multiple_delivery.pickup_address) {
        return res.status(404).json({
          status: 400,
          error: 'You cannot delete this package',
        })
      }

      // get the package next to the one
      // about to be deleted

      const _next_to_deleted_package = await Packages.findOne({
        where: {
          multiple_delivery_id: multiple_delivery.id,
          pickup_address: _package.dropoff_address,
        },
      })
      let _next_package_data = null
      let _next_package_with_new_delivery_price = null

      if (_next_to_deleted_package) {
        _next_package_data = {
          ..._next_to_deleted_package.dataValues,
          pickup_address: _package.pickup_address,
        }

        _next_package_with_new_delivery_price = await thiz._calculate_price(
          _next_package_data,
        )
      }

      if (
        !multiple_delivery.is_active &&
        multiple_delivery.status === 'not-picked'
      ) {
        await Packages.destroy({
          where: {
            package_id: package_id,
          },
        })

        if (_next_to_deleted_package) {
          await Packages.update(
            {
              ..._next_package_with_new_delivery_price,
            },
            {
              where: {
                package_id: _next_package_with_new_delivery_price.package_id,
              },
            },
          )
        }

        const all_package_in_multiple_delivery = await Packages.findAll({
          where: {
            multiple_delivery_id: multiple_delivery.id,
          },
        })
        return res.status(200).json({
          status: 200,
          message: 'Package deleted successfully',
          multiple_delivery_id: multiple_delivery.id,
          all_packages: all_package_in_multiple_delivery,
        })
      } else {
        const current_total = await thiz._get_total_price_for_delivery(
          multiple_delivery.id,
        )

        let benchmark = ['delivered', 'tracking', 'picked-up']
        if (benchmark.includes(multiple_delivery.status)) {
          return res.status(400).json({
            status: 400,
            error: `Invalid operation, cannot delete a multi-package whose parent status is ${multiple_delivery.status}`,
          })
        }
        const current_package_price = _package.delivery_price
        const current_total_if_package_is_deleted =
          Number(current_total) - Number(current_package_price)
        // calculate new price for soon to be updated next package

        let _new_proposed_delivery_price = current_total_if_package_is_deleted
        if (_next_package_data) {
          _new_proposed_delivery_price +=
            _next_package_with_new_delivery_price.delivery_price
          _new_proposed_delivery_price = Math.ceil(_new_proposed_delivery_price)
        }
        if (
          Number(_new_proposed_delivery_price) > Number(user.virtual_balance)
        ) {
          return res.status(400).json({
            status: 400,
            error: `You must top-up your account with at least ₦${
              Number(_new_proposed_delivery_price) -
              Number(user.virtual_balance)
            } before you can delete this package`,
          })
        }

        let updated_virtual_allocated_balance = 0
        if (user.virtual_allocated_balance > 0) {
          updated_virtual_allocated_balance =
            Number(user.virtual_allocated_balance) - Number(current_total)
        }
        if (
          Number(user.virtual_balance) -
            Number(updated_virtual_allocated_balance) <
          Number(_new_proposed_delivery_price)
        ) {
          return res.status(400).json({
            status: 400,
            error: `Please top-up your account before you can delete this package as new delivery price will be: ₦${_new_proposed_delivery_price}`,
          })
        }
        updated_virtual_allocated_balance =
          Number(updated_virtual_allocated_balance) +
          Number(_new_proposed_delivery_price)

        if (_next_to_deleted_package) {
          await Packages.update(
            {
              ..._next_package_with_new_delivery_price,
            },
            {
              where: {
                package_id: _next_package_with_new_delivery_price.package_id,
              },
            },
          )
        }

        await Customers.update(
          {
            virtual_allocated_balance: updated_virtual_allocated_balance,
          },
          {
            where: {
              id: user.id,
            },
          },
        )
        await Packages.destroy({
          where: {
            package_id: package_id,
          },
        })
        const all_package_in_multiple_delivery = await Packages.findAll({
          where: {
            multiple_delivery_id: multiple_delivery.id,
          },
        })
        return res.status(200).json({
          status: 200,
          message: 'Package deleted successfully',
          multiple_delivery_id: multiple_delivery.id,
          all_packages: all_package_in_multiple_delivery,
        })
      }
    }).catch((err) => {
      log(err)
      return res.status(400).json({
        status: 400,
        err,
      })
    })
  }

  async _get_total_price_for_delivery(multiple_delivery_id) {
    try {
      const [total] = await Packages.findAll({
        where: {
          multiple_delivery_id: multiple_delivery_id,
        },
        attributes: [
          'multiple_delivery_id',
          [
            sequelize.fn('sum', sequelize.col('delivery_price')),
            'total_amount',
          ],
        ],
        group: ['multiple_delivery_id'],
        raw: true,
      })
      return total.total_amount
    } catch (err) {
      throw err
    }
  }

  static activate_multiple_delivery(req, res) {
    const thiz = new MultipleDeliveriesController()
    const {user} = req.session
    return Promise.try(async () => {
      const {multiple_delivery_id} = req.params
      const multiple_delivery = await MultipleDeliveries.findOne({
        where: {
          id: multiple_delivery_id,
        },
      })
      if (!multiple_delivery) {
        log(
          `activate multiple delivery - not found for id ${multiple_delivery_id}`,
        )
        return res.status(404).json({
          status: 404,
          error: "Oops!, this item doesn't exist",
        })
      }
      const delivery_price = await thiz._get_total_price_for_delivery(
        multiple_delivery_id,
      )
      if (Number(delivery_price) > Number(user.virtual_balance)) {
        return res.status(400).json({
          status: 400,
          error: `You must top-up your account with at least ₦${
            Number(delivery_price) - Number(user.virtual_balance)
          } before activating this delivery`,
        })
      }
      if (
        Number(user.virtual_balance) - Number(user.virtual_allocated_balance) <
        Number(delivery_price)
      ) {
        return res.status(400).json({
          status: 400,
          error:
            'Package creation limit exceeded for the amount in your wallet, \nTop-up your wallet or delete a package that has not been picked-up',
        })
      }
      const updated_virtual_allocated_balance =
        Number(user.virtual_allocated_balance) + Number(delivery_price)
      await Customers.update(
        {
          virtual_allocated_balance: updated_virtual_allocated_balance,
        },
        {
          where: {
            id: user.id,
          },
        },
      )
      // activate all delivery entities
      await MultipleDeliveries.update(
        {
          is_active: true,
        },
        {
          where: {
            id: multiple_delivery_id,
          },
        },
      )
      await Packages.update(
        {
          is_active: true,
        },
        {
          where: {
            multiple_delivery_id: multiple_delivery_id,
          },
        },
      )
      const _package = await Packages.findOne({
        where: {
          multiple_delivery_id: multiple_delivery_id,
          pickup_address: multiple_delivery.pickup_address,
        },
      })

      const message = {
        pickup_state: _package.from_state,
        notification_id: Math.floor(Math.random() * 1234 * 60),
        detail: `new BULK delivery pickup @ ${
          multiple_delivery.pickup_address
        } for ₦${new Intl.NumberFormat('en-US').format(
          Number(delivery_price),
        )}. You might want to pick it up, do check it out!.`,
      }
      await packageCreationNotifier.sendNewPackageCreationToDispatchersV2(
        message,
      )
      const company_notification = `New BULK delivery pickup @ ${_package.pickup_address}`

      eventEmitter.emit('company_new_package_creation', {
        message: company_notification,
      })
      return res.status(200).json({
        status: 200,
        message:
          'Bulk delivery activated successfully. Please wait, dispatchers will reach out to you soon',
        data: {
          multiple_delivery_id,
        },
      })
    }).catch((err) => {
      log(err)
      return res.status(400).json({
        status: 400,
        err,
      })
    })
  }
}

export default MultipleDeliveriesController
