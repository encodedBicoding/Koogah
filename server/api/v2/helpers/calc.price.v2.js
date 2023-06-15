import {config} from 'dotenv'
import log from 'fancy-log'
import transport_mode from './transport_mode_data'
import value_range from '../../v1/helpers/value.data'
config()

export class PriceCalculator {
  sms_charge = 50
  transfer_charge = 10

  constructor() {}

  static async execute(
    type,
    mode_category,
    distance,
    value,
    is_express_delivery,
    from_state,
  ) {
    try {
      let base_price
      if (type === 'intra-state') {
        base_price = process.env.KOOGAH_INTRA_STATE_DISPATCH_BASE_FEE
      }
      if (type === 'inter-state') {
        base_price = process.env.KOOGAH_INTER_STATE_DISPATCH_BASE_FEE
      }
      if (type === 'international') {
        base_price = process.env.KOOGAH_INTERNATIONAL_DISPATCH_BASE_FEE
      }
      if (!value) {
        value = '0-999'
      }
      const mode_value = transport_mode[mode_category]
      const package_value = value_range[value]
      if (!mode_value) return false
      let net_price = 0
      let fs = from_state.split(',')[0]
      if (fs === 'lagos') {
        net_price = await new PriceCalculator().lagosPrice(
          is_express_delivery,
          base_price,
          mode_value,
          package_value,
          distance,
        )
      }
      if (fs === 'abuja') {
        net_price = await new PriceCalculator().abujaPrice(
          is_express_delivery,
          base_price,
          mode_value,
          package_value,
          distance,
        )
      }
      // add flutterwave_transfer_charge.
      const flutter_wave_transfer_charge = Math.ceil(net_price * 0.02)
      const referral_percent_charge = Math.ceil(net_price * 0.08)
      const total_price =
        net_price + flutter_wave_transfer_charge + referral_percent_charge
      return Math.round(total_price / 10) * 10
    } catch (err) {
      log(err)
      throw err
    }
  }
  async lagosPrice(
    is_express_delivery,
    base_price,
    mode__value,
    package__value,
    dist_ance,
  ) {
    try {
      let netPrice = 0
      let distance = process.env.KOOGAH_PRICE_DISTANCE_BASE * Number(dist_ance)
      let package_value =
        package__value === 1000
          ? package__value / 100
          : package__value === 10000000
          ? package__value / 10000
          : package__value / 1000
      let mode_value = process.env.KOOGAH_PRICE_WEIGHT_BASE * mode__value
      netPrice = Math.ceil(
        Number(base_price) + distance + package_value + mode_value,
      )
      if (is_express_delivery) {
        netPrice = netPrice * 2.2
      }
      return netPrice
    } catch (err) {
      log(err)
      throw err
    }
  }
  async abujaPrice(
    is_express_delivery,
    base_price,
    mode__value,
    package__value,
    dist_ance,
  ) {
    let netPrice = 0
    let distance =
      Math.ceil(Number(dist_ance) * 0.23) *
      process.env.KOOGAH_PRICE_DISTANCE_BASE
    let package_value =
      package__value === 1000
        ? package__value / 100
        : package__value === 10000000
        ? package__value / 10000
        : package__value / 1000
    let mode_value = process.env.KOOGAH_PRICE_WEIGHT_BASE * mode__value
    netPrice = Math.ceil(
      Number(base_price) + distance + package_value + mode_value,
    )
    if (is_express_delivery) {
      netPrice = netPrice * 2.2
    }
    return netPrice
  }
}
