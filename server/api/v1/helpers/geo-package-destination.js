import geocoder from './geocoder';

async function geoPackageDestination(_package) {
  let res;
  try {
    if (_package['to_country']) {
      res = await geocoder.geocode(_package['to_country'])
    } else if (_package['to_state']) {
      res = await geocoder.geocode(_package['to_state'])
    } else {
      res = await geocoder.geocode(_package['to_town']);
    }
    return res;
  } catch (error) {
    throw new Error(error);
  }
}

export default geoPackageDestination;