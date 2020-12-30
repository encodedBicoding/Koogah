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
  if (!weight_range) return false;
  const net_price = (weight_value * distance) + Number(base_price);
  return net_price;
}

export default calc_delivery_price;
