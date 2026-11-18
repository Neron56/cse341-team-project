import mongoose from 'mongoose';

let database;
let client;
let connectionPromise;

const connectToDb = async (options = {}) => {
  if (database) {
    return database;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  const connectionString = options.connectionString || process.env.MONGODB_URI;
  const databaseName = options.databaseName || process.env.MONGODB_DB_NAME || 'practice';

  if (!connectionString) {
    throw new Error('MONGODB_URI is required.');
  }

  connectionPromise = (async () => {
    try {
      const connection = await mongoose.connect(connectionString, { dbName: databaseName });
      database = connection.connection.db;
      client = connection.connection.getClient();
      return database;
    } catch (error) {
      connectionPromise = undefined;
      throw error;
    }
  })();

  return connectionPromise;
};

const getDb = () => {
  if (!database) {
    throw new Error('Database not initialized. Call connectToDb first.');
  }
  return database;
};

const closeDb = async () => {
  if (connectionPromise) {
    await connectionPromise;
  }

  if (client) {
    await mongoose.disconnect();
    client = undefined;
    database = undefined;
    connectionPromise = undefined;
  }
};

const getMongoClient = () => {
  if (!client) {
    throw new Error('Database not initialized. Call connectToDb first.');
  }
  return client;
};

export { closeDb, connectToDb, getDb, getMongoClient };
