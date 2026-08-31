import http from 'http';
import { config } from './config';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';

/**
 * Server entrypoint. Boots the Express app after ensuring the database
 * is reachable. Handles graceful shutdown on SIGINT/SIGTERM.
 */
async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[server] failed to connect to database, exiting', err);
    process.exit(1);
  }

  const app = createApp();
  const server = http.createServer(app);

  server.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.info(`[server] QuizArena API listening on http://localhost:${config.port} (${config.nodeEnv})`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    // eslint-disable-next-line no-console
    console.info(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    // eslint-disable-next-line no-console
    console.error('[server] unhandled rejection', reason);
  });
}

void bootstrap();
