import { MongoMemoryServer } from 'mongodb-memory-server';
import { closeDb, connectToDb } from '../src/db/connect.js';
import { initializeDatabase } from '../src/db/initialize.js';

let mongo;
let server;
let stopping = false;

const stop = async () => {
  if (stopping) return;
  stopping = true;
  if (server?.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
  await closeDb();
  await mongo?.stop();
};

try {
  // Explicit temporary connection: never read the team's configured database.
  mongo = await MongoMemoryServer.create({ instance: { launchTimeout: 30_000 } });
  const db = await connectToDb({ connectionString: mongo.getUri(), databaseName: 'booking-demo' });
  await initializeDatabase(db);
  const classes = ['standard', 'premium', 'first'];
  const documents = Array.from({ length: 36 }, (_, index) => ({
    id: `JRDEMO${String(index + 1).padStart(4, '0')}`,
    scheduleId: 1, tripId: 'alpine-panorama', ticketClass: classes[index % 3],
    selectedDay: 'monday',
    passengers: [{ firstName: `Demo ${index + 1}`, lastName: 'Rider', email: `demo${index + 1}@example.test`, phone: '+1 202-555-0101' }],
    createdAt: new Date(Date.UTC(2026, 10, Math.floor(index / 3) + 1, 12 + index % 3)),
    updatedAt: new Date(Date.UTC(2026, 10, Math.floor(index / 3) + 1, 12 + index % 3))
  }));
  await db.collection('bookings').insertMany(documents);
  process.env.NODE_ENV = 'test';
  const { default: app } = await import('../app.js');
  const port = Number(process.env.BOOKINGS_DEMO_PORT || 3400);
  server = app.listen(port, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  console.log(`Temporary booking demo: http://127.0.0.1:${port}/bookings`);
  console.log('36 fictional bookings, November 1-12, 2026 (UTC), 12 per ticket class.');
  console.log('Stop with Ctrl+C to discard the temporary database.');
  const shutdown = async () => {
    try { await stop(); } catch (error) { console.error(error); process.exitCode = 1; }
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
} catch (error) {
  console.error('Booking demo failed:', error);
  await stop();
  process.exitCode = 1;
}
