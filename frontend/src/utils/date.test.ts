import {
  formatDate,
  formatTime,
  formatDateTime,
  toDateTimeLocalValue,
  fromDateTimeLocalValue,
  statusLabel,
} from '@/utils/date';

/**
 * Date utility tests — verify formatting and edge cases.
 * Uses a fixed locale ('en-US') for deterministic output.
 */
describe('formatDate', () => {
  it('formats a valid ISO string', () => {
    const result = formatDate('2026-08-31T14:30:00.000Z');
    expect(result).toMatch(/2026/);
  });

  it('returns em-dash for invalid input', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });
});

describe('formatTime', () => {
  it('formats a valid ISO string', () => {
    const result = formatTime('2026-08-31T14:30:00.000Z');
    // Should contain digits and a colon (e.g. "2:30 PM" or "14:30")
    expect(result).toMatch(/\d/);
  });

  it('returns em-dash for invalid input', () => {
    expect(formatTime('invalid')).toBe('—');
  });
});

describe('formatDateTime', () => {
  it('combines date and time', () => {
    const result = formatDateTime('2026-08-31T14:30:00.000Z');
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/\d/);
  });

  it('returns em-dash for invalid input', () => {
    expect(formatDateTime('bad')).toBe('—, —');
  });
});

describe('toDateTimeLocalValue', () => {
  it('converts ISO to local datetime format', () => {
    const result = toDateTimeLocalValue('2026-08-31T14:30:00.000Z');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('returns empty string for invalid input', () => {
    expect(toDateTimeLocalValue('bad')).toBe('');
  });
});

describe('fromDateTimeLocalValue', () => {
  it('converts local datetime to ISO', () => {
    const result = fromDateTimeLocalValue('2026-08-31T14:30');
    const d = new Date(result);
    expect(Number.isNaN(d.getTime())).toBe(false);
  });

  it('returns empty string for invalid input', () => {
    expect(fromDateTimeLocalValue('bad')).toBe('');
  });
});

describe('statusLabel', () => {
  it('capitalizes the first letter', () => {
    expect(statusLabel('draft')).toBe('Draft');
    expect(statusLabel('live')).toBe('Live');
    expect(statusLabel('completed')).toBe('Completed');
  });

  it('handles already-capitalized strings', () => {
    expect(statusLabel('Draft')).toBe('Draft');
  });

  it('handles empty string', () => {
    expect(statusLabel('')).toBe('');
  });
});
