// eslint-disable-next-line consistent-return
const checkTypeV2 = (key, data, type) => {
  if (key === 'from') {
    if (type === 'international') {
      return data.from_country;
    }
    if (type !== 'intra-state') {
      return data.from_state;
    } else {
      return data.pickup_address;
    }

  }
  if (key === 'to') {
    if (type === 'international') {
      return data.to_country;
    }
    if (type !== 'intra-state') {
      return data.to_state;
    } else {
      return data.dropoff_address;
    }
  }
};
export default checkTypeV2;
