import { afterAll, beforeAll, beforeEach, inject } from 'vitest';
import { closeDb, connectToDb, getDb } from '../src/db/connect.js';
import { initializeDatabase } from '../src/db/initialize.js';

process.env.SESSION_SECRET ||= 'test-only-session-secret-with-more-than-32-characters';

const connectionString = inject('MONGODB_TEST_URI');
process.env.MONGODB_URI = connectionString;
process.env.MONGODB_DB_NAME = 'kizuna-rail-test';

beforeAll(async () => {
  await connectToDb({
    connectionString,
    databaseName: 'kizuna-rail-test'
  });
});

beforeEach(async () => {
  const db = getDb();
  await db.dropDatabase();
  await initializeDatabase(db);
});

afterAll(async () => {
  await closeDb();
});
