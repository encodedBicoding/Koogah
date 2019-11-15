/* eslint-disable camelcase */
import weight_range from './weight.data';

function calc_delivery_price(type, weight, distance) {
  let base_price;
  if (type === 'intra-state') {
    base_price = 300;
  }
  if (type === 'inter-state') {
    base_price = 1500;
  }
  if (type === 'international') {
    base_price = 15000;
  }
  const weight_value = weight_range[weight];
  if (!weight_range) return false;
  const net_price = (weight_value * distance) + base_price;
  return net_price;
}

export default calc_delivery_price;
