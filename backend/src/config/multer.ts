import multer, { type Multer, type FileFilterCallback } from 'multer';
import type { Request } from 'express';
import path from 'path';
import { AppError } from '../utils/AppError';

/**
 * Multer configuration for CSV uploads.
 *
 * Files are stored in memory (not on disk) since we parse and validate
 * them immediately. Size is limited to 2MB to prevent abuse. Only
 * .csv files are accepted.
 */
const MAX_CSV_SIZE = 2 * 1024 * 1024; // 2MB

const storage = multer.memoryStorage();

/** File filter: accept only CSV files (by extension and mimetype). */
function csvFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  const ext = path.extname(file.originalname).toLowerCase();
  const isCsv = ext === '.csv' || file.mimetype === 'text/csv' || file.mimetype === 'application/vnd.ms-excel';
  if (isCsv) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'BAD_REQUEST', 'Only CSV files are allowed'));
  }
}

/** Shared multer instance for CSV uploads (single file, in-memory). */
export const csvUpload: Multer = multer({
  storage,
  limits: { fileSize: MAX_CSV_SIZE },
  fileFilter: csvFileFilter,
});

/** Multer error handler middleware — normalizes MulterError to AppError. */
export function handleMulterError(
  err: unknown,
  _req: unknown,
  _res: unknown,
  next: (err: unknown) => void,
): void {
  if (err && typeof err === 'object' && 'code' in err) {
    const code = (err as { code: string }).code;
    if (code === 'LIMIT_FILE_SIZE') {
      return next(AppError.badRequest('CSV file is too large (max 2MB)'));
    }
    if (code === 'LIMIT_UNEXPECTED_FILE') {
      return next(AppError.badRequest('Unexpected file field in upload'));
    }
  }
  next(err);
}
