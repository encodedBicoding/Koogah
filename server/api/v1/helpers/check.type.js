// eslint-disable-next-line consistent-return
const checkType = (key, data, type) => {
  if (key === 'from') {
    if (type === 'international') {
      return data.from_country;
    }
    if (type !== 'intra-state') {
      return data.from_state;
    }
    return data.from_town;
  }
  if (key === 'to') {
    if (type === 'international') {
      return data.to_country;
    }
    if (type !== 'intra-state') {
      return data.to_state;
    }
    return data.to_town;
  }
};
export default checkType;
