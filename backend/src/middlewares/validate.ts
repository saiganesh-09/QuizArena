import type { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

/**
 * Generic Zod validation middleware factory.
 * Validates req.body against the provided schema and replaces req.body
 * with the parsed (typed) result. Throws a 400 AppError on failure.
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.body);
      // Replace body with the parsed, typed value.
      (req as Request).body = parsed as unknown as Record<string, unknown>;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(AppError.badRequest('Request validation failed', err.flatten()));
      } else {
        next(err as Error);
      }
    }
  };
}

/**
 * Validate req.query (URL search params) against a Zod schema.
 * Replaces req.query with the parsed, typed result (with defaults applied).
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req.query);
      (req as Request).query = parsed as unknown as Record<string, string>;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(AppError.badRequest('Query validation failed', err.flatten()));
      } else {
        next(err as Error);
      }
    }
  };
}
