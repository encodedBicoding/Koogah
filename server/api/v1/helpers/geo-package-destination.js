import geocoder from './geocoder';

async function geoPackageDestination(_package) {
  try {
    const  res = await geocoder.geocode(!_package['to_town'] ? _package['to_town'] : _package['dropoff_address']);
    return res;
  } catch (error) {
    throw new Error(error);
  }
}

export default geoPackageDestination;