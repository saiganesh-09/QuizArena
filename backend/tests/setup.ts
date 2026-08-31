import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

/**
 * Global test setup — runs once before all tests.
 *
 * Starts an in-memory MongoDB instance so tests run completely offline
 * with no dependency on a live database. Each test file is responsible
 * for clearing collections between tests (see the `clearDatabase` helper).
 */
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

/**
 * Helper to clear all collections between tests.
 * Call this in afterEach() to ensure test isolation.
 */
export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}
