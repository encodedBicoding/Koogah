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
  const price_slash_list = ['0-5', '6-10','11-15']
  if (!weight_range) return false;
  var net_price = Math.ceil(((weight_value * distance) + Number(base_price) + sms_charge + transfer_charge) * package_value);
  if (Number(distance) > 50) {
    if (type === 'intra-state') {
      if (net_price >= 15000 && price_slash_list.includes(weight)) {
          net_price = net_price * 0.7
      }
    }
  } else {
    if (type === 'intra-state') {
      if (package_value > 1) {
        if (net_price >= 3300 && price_slash_list.includes(weight)) {
          net_price = net_price * 0.7
        }
      } else {
        if (net_price >= 2500 && price_slash_list.includes(weight)) {
          net_price = net_price * 0.8
        }
        if (net_price >= 9000 && price_slash_list.includes(weight)) {
          net_price = net_price * 0.8
        }
      }

    }
  }
  return Math.ceil(net_price);
}

export default calc_delivery_price;
