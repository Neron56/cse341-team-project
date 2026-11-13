import { closeDb, connectToDb } from './connect.js';
import { migrateBookings } from './migrate-bookings.js';

try {
  const db = await connectToDb();
  const renamed = await migrateBookings(db);
  await db.collection('bookings').createIndex({ id: 1 }, { unique: true });
  console.log(renamed ? 'Renamed confirmations to bookings.' : 'No legacy collection to rename.');
} finally {
  await closeDb();
}
