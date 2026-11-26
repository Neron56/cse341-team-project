
import {
  getTripById as findTripById,
  getAllTrips as findAllTrips,
  updateTrip as updateTripRecord,
  deleteTrip as deleteTripRecord,
} from '../models/trips.js';

// API: Get one trip by ID
export async function getTripById(req, res) {
  try {
    const { id } = req.params;

    const trip = await findTripById(id);

    if (!trip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    return res.status(200).json(trip);
  } catch (error) {
    console.error('Error fetching trip:', error);

    return res.status(500).json({
      error: 'Failed to fetch trip',
    });
  }
}

// API: Get all trips
export async function getAllTrips(req, res) {
  try {
    const trips = await findAllTrips();

    return res.status(200).json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);

    return res.status(500).json({
      error: 'Failed to fetch trips',
    });
  }
}

// API: Update a trip
export async function updateTrip(req, res) {
  try {
    const { id } = req.params;

    const updatedTrip = await updateTripRecord(id, req.body);

    if (!updatedTrip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    return res.status(200).json(updatedTrip);
  } catch (error) {
    console.error('Error updating trip:', error);

    return res.status(400).json({
      error: 'Failed to update trip',
    });
  }
}

// API: Delete a trip
export async function deleteTrip(req, res) {
  try {
    const { id } = req.params;

    const deletedTrip = await deleteTripRecord(id);

    if (!deletedTrip) {
      return res.status(404).json({
        error: 'Trip not found',
      });
    }

    return res.status(200).json({
      message: 'Trip deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting trip:', error);

    return res.status(500).json({
      error: 'Failed to delete trip',
    });
  }
}

// EJS: Display the trips list page
export async function listTripsPage(req, res, next) {
  try {
    const trips = await findAllTrips();

    const regions = [...new Set(trips.map((trip) => trip.region))];
    const seasons = [...new Set(trips.map((trip) => trip.bestSeason))];

    return res.render('trips/list', {
      title: 'Scenic Train Trips',
      regions,
      seasons,
    });
  } catch (error) {
    return next(error);
  }
}

// EJS: Display individual trip details
export async function tripDetailsPage(req, res, next) {
  try {
    const { tripId } = req.params;

    const details = await findTripById(tripId);

    if (!details) {
      return res.status(404).render('404', {
        title: 'Trip Not Found',
      });
    }

    return res.render('trips/details', {
      title: 'Trip Details',
      details,
    });
  } catch (error) {
    return next(error);
  }
}
