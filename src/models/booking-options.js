import { getDb } from '../db/connect.js';

// Replace these reference-data reads with the team's schedule, trip, and
// ticket-class models when those feature sets are available.
export async function getBookingOptions(scheduleId) {
  const id = Number(scheduleId);
  if (!Number.isSafeInteger(id) || id < 1) {
    return null;
  }

  const db = getDb();
  const schedule = await db.collection('schedules').findOne({ id, status: true });
  if (!schedule) {
    return null;
  }

  const trip = await db.collection('trips').findOne({ id: schedule.tripId });
  if (!trip) {
    return null;
  }

  const ticketClasses = await db.collection('ticketClasses').find({}).toArray();
  const ticketOptions = ticketClasses.map((ticketClass) => ({
    class: ticketClass.class,
    name: ticketClass.name,
    price: trip.distance * ticketClass.pricePerKm,
    amenities: ticketClass.amenities,
    description: ticketClass.description
  }));

  return { schedule, ticketOptions };
}
