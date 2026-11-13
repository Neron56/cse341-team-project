/** Rename legacy data without deleting or overwriting either collection. */
export async function migrateBookings(db) {
  const legacyExists = await db.listCollections({ name: 'confirmations' }).hasNext();
  if (!legacyExists) {
    return false;
  }

  const targetExists = await db.listCollections({ name: 'bookings' }).hasNext();
  if (targetExists) {
    throw new Error('Both confirmations and bookings exist. Resolve them manually before migrating; no data was changed.');
  }

  await db.collection('confirmations').rename('bookings', { dropTarget: false });
  return true;
}
