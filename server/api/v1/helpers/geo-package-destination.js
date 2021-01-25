import geocoder from './geocoder';

async function geoPackageDestination(_package) {
  try {
    const  res = await geocoder.geocode(_package['to_town']);
    return res;
  } catch (error) {
    throw new Error(error);
  }
}

export default geoPackageDestination;