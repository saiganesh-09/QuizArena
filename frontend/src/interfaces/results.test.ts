import { formatDuration } from '@/interfaces/results';

/**
 * formatDuration tests — verify human-readable duration formatting
 * for seconds, minutes, and hours.
 */
describe('formatDuration', () => {
  it('formats seconds under 60', () => {
    expect(formatDuration(0)).toBe('0s');
    expect(formatDuration(30)).toBe('30s');
    expect(formatDuration(59)).toBe('59s');
  });

  it('formats minutes under 60', () => {
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(120)).toBe('2m');
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(3599)).toBe('59m 59s');
  });

  it('formats hours', () => {
    expect(formatDuration(3600)).toBe('1h');
    expect(formatDuration(7200)).toBe('2h');
    expect(formatDuration(5400)).toBe('1h 30m');
    expect(formatDuration(7384)).toBe('2h 3m');
  });
});
