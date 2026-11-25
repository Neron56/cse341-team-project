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

// Earlier confirmations stored ISO timestamp strings. Convert valid values
// before relying on MongoDB date ordering/range indexes; preserve invalid data.
export async function normalizeBookingDates(db) {
  for (const field of ['createdAt', 'updatedAt']) {
    await db.collection('bookings').updateMany({ [field]: { $type: 'string' } }, [{
      $set: { [field]: { $convert: { input: `$${field}`, to: 'date', onError: `$${field}`, onNull: `$${field}` } } }
    }]);
  }
}
