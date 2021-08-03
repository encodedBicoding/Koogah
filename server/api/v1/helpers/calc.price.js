/* eslint-disable camelcase */
import weight_range from './weight.data';
import value_range from './value.data';
import { config } from 'dotenv';

config();

function calc_delivery_price(type, weight, distance, value) {
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
  const weight_value = weight_range[weight];
  const package_value = value_range[value];
  const sms_charge = 50;
  const transfer_charge = 10;
  if (!weight_range) return false;
  var net_price = Math.ceil(Number(base_price) + (50 * weight_value) + (50 * Number(distance)) + (package_value / 100) + sms_charge + transfer_charge);
  return net_price;
}

export default calc_delivery_price;
