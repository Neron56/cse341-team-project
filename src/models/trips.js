
import Trip from './schemas/trips.js';

// Get one trip by ID
export async function getTripById(id) {
  return Trip.findOne({ id }).lean();
}

// Get all trips
export async function getAllTrips() {
  return Trip.find({}).lean();
}

// Update an existing trip
export async function updateTrip(id, tripData) {
  return Trip.findOneAndUpdate(
    { id },
    tripData,
    { new: true, runValidators: true }
  ).lean();
}

// Delete a trip
export async function deleteTrip(id) {
  return Trip.findOneAndDelete({ id }).lean();
}
