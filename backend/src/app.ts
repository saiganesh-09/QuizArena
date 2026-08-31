import express, { Express } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';
import adminRoutes from './routes/admin.routes';
import instructorRoutes from './routes/instructor.routes';
import candidateRoutes from './routes/candidate.routes';
import { docsRouter } from './routes/docs.routes';
import { notFoundHandler, errorHandler } from './middlewares/error';
import { handleMulterError } from './config/multer';

/**
 * Express application factory. Kept separate from server startup so it
 * can be imported in tests without binding a port.
 */
export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS: allow the configured client origin and enable credentials so
  // the HTTP-only cookie can be sent cross-origin.
  app.use(
    cors({
      origin: config.cors.clientOrigin,
      credentials: true,
    }),
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Cookies (the auth JWT lives here, never in localStorage)
  app.use(cookieParser());

  // Basic rate limiting on auth routes to mitigate brute-force attempts.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 auth requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  });

  // Routes
  app.use('/health', healthRoutes);
  app.use('/auth', authLimiter, authRoutes);
  app.use('/admin', adminRoutes);
  app.use('/instructor', instructorRoutes);
  app.use('/candidate', candidateRoutes);
  app.use('/api-docs', docsRouter);

  // Multer error handler (normalizes file upload errors to AppError)
  app.use(handleMulterError);

  // 404 + centralized error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
