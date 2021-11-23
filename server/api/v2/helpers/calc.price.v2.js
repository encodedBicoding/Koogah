import { config } from 'dotenv';
import transport_mode from './transport_mode_data';
import value_range from '../../v1/helpers/value.data';
config();

function calc_delivery_price_v2(type, mode_category, distance, value) {
  let base_price;
  if (type === 'intra-state') {
    base_price = process.env.KOOGAH_INTRA_STATE_DISPATCH_BASE_FEE;
  }
  if (type === 'inter-state') {
    base_price = process.env.KOOGAH_INTER_STATE_DISPATCH_BASE_FEE;
  }
  if (type === 'international') {
    base_price = process.env.KOOGAH_INTERNATIONAL_DISPATCH_BASE_FEE;
  }
  if (!value) {
    value = '0-999';
  }

  const mode_value = transport_mode[mode_category];
  const package_value = value_range[value];
  const sms_charge = 50;
  const transfer_charge = 10;
  if (!mode_value) return false;
  var net_price = Math.ceil(Number(base_price) + (process.env.KOOGAH_PRICE_WEIGHT_BASE * mode_value) + (process.env.KOOGAH_PRICE_DISTANCE_BASE * Number(distance)) + (package_value === 1000 ? package_value / 100 : package_value === 10000000 ? package_value / 10000 : package_value / 1000) + sms_charge + transfer_charge);
  // add flutterwave_transfer_charge.
  const flutter_wave_transfer_charge = Math.ceil(net_price * 0.02);
  const total_price = net_price + flutter_wave_transfer_charge;
  return total_price;
}

export default calc_delivery_price_v2;