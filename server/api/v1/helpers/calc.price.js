/* eslint-disable camelcase */
import weight_range from './weight.data';
import { config } from 'dotenv';

config();

function calc_delivery_price(type, weight, distance) {
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
  const weight_value = weight_range[weight];
  const sms_charge = 50;
  const transfer_charge = 10;
  const price_slash_list = ['0-5', '6-10','11-15']
  if (!weight_range) return false;
  var net_price = (weight_value * distance) + Number(base_price) + sms_charge + transfer_charge;
  if (Number(distance) > 50) {
    if (type === 'intra-state') {
      if (net_price >= 15000 && price_slash_list.includes(weight)) {
          net_price = net_price * 0.7
      }
    }
  } else {
    if (type === 'intra-state') {
      if (net_price >= 9000 && price_slash_list.includes(weight)) {
          net_price = net_price * 0.6
      }
    }
  }
  return net_price;
}

export default calc_delivery_price;
