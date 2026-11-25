import { closeDb, connectToDb } from './connect.js';
import { migrateBookings, normalizeBookingDates } from './migrate-bookings.js';

try {
  const db = await connectToDb();
  const renamed = await migrateBookings(db);
  await normalizeBookingDates(db);
  await db.collection('bookings').createIndex({ id: 1 }, { unique: true });
  await db.collection('bookings').createIndex({ createdAt: -1, _id: -1 });
  console.log(renamed ? 'Renamed confirmations to bookings.' : 'No legacy collection to rename.');
} finally {
  await closeDb();
}
