import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../src/app';
import { connectDatabase } from '../src/config/database';

/**
 * Vercel serverless entrypoint. Wraps the Express app so the whole API
 * is served by a single function. MongoDB connects lazily on the first
 * request and the connection is cached across warm invocations.
 */
const app = createApp();

let dbReady: Promise<unknown> | null = null;

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    dbReady ??= connectDatabase();
    await dbReady;
  } catch (err) {
    dbReady = null; // allow retry on the next invocation
    // eslint-disable-next-line no-console
    console.error('[api] database connection failed', err);
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        success: false,
        error: { code: 'DB_UNAVAILABLE', message: 'Service unavailable' },
      }),
    );
    return;
  }
  // Vercel rewrites route all traffic here; if the rewritten function path
  // leaked into req.url, strip it so Express sees the original route.
  if (req.url?.startsWith('/api/index')) {
    req.url = req.url.slice('/api/index'.length) || '/';
  }
  app(req, res);
}
