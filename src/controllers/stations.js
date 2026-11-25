import {
  getAllStations as findAllStations,
  getStationById as findStationById
} from '../models/stations.js';

export async function getAllStations(req, res) {
  try {
    const stations = await findAllStations();
    return res.status(200).json({ stations });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch stations' });
  }
}

export async function getStationById(req, res) {
  try {
    const station = await findStationById(req.params.id);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }
    return res.status(200).json({ station });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch station' });
  }
}
