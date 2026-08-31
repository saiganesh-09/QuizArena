import { extractErrorMessage } from '@/utils/errors';
import type { ApiError } from '@/types/auth';

/**
 * extractErrorMessage tests — verifies the error extraction logic
 * for RTK Query error shapes, network failures, and plain Errors.
 */
describe('extractErrorMessage', () => {
  it('extracts message from a server error body', () => {
    const error = {
      status: 400,
      data: {
        error: { code: 'VALIDATION_ERROR', message: 'Email is required' },
      } as ApiError,
    };
    expect(extractErrorMessage(error)).toBe('Email is required');
  });

  it('returns a network error message for FETCH_ERROR', () => {
    const error = { status: 'FETCH_ERROR', error: 'Failed to fetch' };
    expect(extractErrorMessage(error)).toBe('Failed to fetch');
  });

  it('returns a default network error for FETCH_ERROR without message', () => {
    const error = { status: 'FETCH_ERROR' };
    expect(extractErrorMessage(error)).toBe('Network error. Please try again.');
  });

  it('returns a timeout message for TIMEOUT_ERROR', () => {
    const error = { status: 'TIMEOUT_ERROR' };
    expect(extractErrorMessage(error)).toBe('Request timed out. Please try again.');
  });

  it('returns a parsing message for PARSING_ERROR', () => {
    const error = { status: 'PARSING_ERROR' };
    expect(extractErrorMessage(error)).toBe('Unexpected response from server.');
  });

  it('extracts message from a plain Error instance', () => {
    const error = new Error('Something broke');
    expect(extractErrorMessage(error)).toBe('Something broke');
  });

  it('returns a fallback for unknown error shapes', () => {
    expect(extractErrorMessage(null)).toBe('Something went wrong. Please try again.');
    expect(extractErrorMessage(undefined)).toBe('Something went wrong. Please try again.');
    expect(extractErrorMessage('string error')).toBe('Something went wrong. Please try again.');
  });

  it('handles error body without message field', () => {
    const error = {
      status: 500,
      data: { error: { code: 'INTERNAL' } } as Partial<ApiError>,
    };
    expect(extractErrorMessage(error)).toBe('Something went wrong. Please try again.');
  });
});
