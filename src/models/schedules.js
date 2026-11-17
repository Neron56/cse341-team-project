//src/models/schedule.js. 
import schedule from "./schemas/schedules.js";
import trip from "./schemas/trips.js";

export async function findSchedulesByTripId(tripId, month) {
  if (month) {
    const trips = await trip.find({ id: tripId }).lean();
    const foundTrip = trips[0];

    // trip missing, or it doesn't operate in the chosen month
    if (!foundTrip || !foundTrip.operatingMonths.includes(Number(month))) {
      return [];
    }
  }

  return schedule.find({ tripId }).lean();
}