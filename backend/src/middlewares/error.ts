import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/AppError';
import type { ApiErrorBody } from '../types/auth';
import { config } from '../config';

/**
 * 404 handler for unmatched routes. Converted to a standardized AppError.
 */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound('Resource not found'));
}

/**
 * Centralized error-handling middleware.
 * Converts any thrown error into a consistent JSON shape and never leaks
 * internal stack traces in production.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let code = 'INTERNAL';
  let message = 'Internal server error';
  let details: unknown | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = err.flatten();
  } else if (err instanceof Error) {
    message = err.message;
    // Keep unknown errors opaque in production.
    if (config.isProduction) message = 'Internal server error';
  }

  const body: ApiErrorBody = {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };

  // Log full error server-side for debugging.
  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[error]', err);
  }

  res.status(statusCode).json(body);
}
