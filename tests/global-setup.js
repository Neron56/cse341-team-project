import { MongoMemoryServer } from 'mongodb-memory-server';

const setup = async (project) => {
  // Allow extra time for the first WiredTiger startup on slower Windows hosts.
  // This changes only mongod readiness; Vitest's test and hook timeouts remain intact.
  const mongoServer = await MongoMemoryServer.create({
    instance: { launchTimeout: 30_000 }
  });

  project.provide('MONGODB_TEST_URI', mongoServer.getUri());

  return async () => {
    await mongoServer.stop();
  };
};

export default setup;
