import mongoose from 'mongoose';
import { config } from '../config';

/**
 * Establish a single shared MongoDB connection.
 * Resolves once connected; rejects on failure.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => {
    // eslint-disable-next-line no-console
    console.info(`[mongo] connected to ${config.mongoUri}`);
  });
  mongoose.connection.on('error', (err) => {
    // eslint-disable-next-line no-console
    console.error('[mongo] connection error', err);
  });
  mongoose.connection.on('disconnected', () => {
    // eslint-disable-next-line no-console
    console.warn('[mongo] disconnected');
  });

  return mongoose.connect(config.mongoUri);
}

/** Gracefully close the MongoDB connection. */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
