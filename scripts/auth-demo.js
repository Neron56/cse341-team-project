import { randomBytes } from 'crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { closeDb, connectToDb, getDb } from '../src/db/connect.js';
import { initializeDatabase } from '../src/db/initialize.js';
import { createUser } from '../src/models/users.js';
import Role from '../src/models/schemas/roles.js';
import User from '../src/models/schemas/users.js';

const mongo = await MongoMemoryServer.create({
  instance: { launchTimeout: 30_000 }
});

process.env.MONGODB_URI = mongo.getUri();
process.env.MONGODB_DB_NAME = 'kizuna-rail-auth-demo';
process.env.SESSION_SECRET = randomBytes(48).toString('hex');
process.env.NODE_ENV = 'test';

await connectToDb();
await initializeDatabase(getDb());

const adminEmail = 'w04-admin@example.test';
const adminPassword = randomBytes(24).toString('hex');
const adminUser = await createUser({
  displayName: 'Demo Administrator',
  username: 'w04-demo-admin',
  email: adminEmail,
  password: adminPassword
});
const adminRole = await Role.findOne({ name: 'admin' });
await User.updateOne({ _id: adminUser._id }, { role: adminRole._id });

const { default: app } = await import('../app.js');
const port = Number(process.env.AUTH_DEMO_PORT || 3300);
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Temporary auth demo: http://127.0.0.1:${port}`);
  console.log(`Temporary admin email: ${adminEmail}`);
  console.log(`Temporary admin password: ${adminPassword}`);
  console.log('Database and session secret exist only for this demo process.');
});

let stopping = false;
const stopDemo = async () => {
  if (stopping) {
    return;
  }
  stopping = true;

  try {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  } finally {
    await closeDb();
    await mongo.stop();
  }
};

const handleShutdown = async () => {
  try {
    await stopDemo();
  } catch (error) {
    console.error('Failed to stop the temporary auth demo cleanly:', error);
    process.exitCode = 1;
  }
};

process.once('SIGINT', handleShutdown);
process.once('SIGTERM', handleShutdown);
