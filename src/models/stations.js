import station from './schemas/stations.js';

const publicFields = 'id name prefecture region facilities description -_id';

export async function getAllStations() {
  return station.find({}, publicFields).sort({ name: 1 }).lean();
}

export async function getStationById(id) {
  return station.findOne({ id }, publicFields).lean();
}
