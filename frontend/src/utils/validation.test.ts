import {
  isValidEmail,
  isStrongPassword,
  PASSWORD_RULES_TEXT,
} from '@/utils/validation';

/**
 * Validation utility tests — pure functions, no React needed.
 */
describe('isValidEmail', () => {
  it('accepts standard email formats', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('john.doe@sub.domain.org')).toBe(true);
    expect(isValidEmail('a@b.co')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('notanemail')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects missing TLD', () => {
    expect(isValidEmail('user@example')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('trims whitespace before checking', () => {
    expect(isValidEmail('  user@example.com  ')).toBe(true);
  });

  it('rejects spaces in the local part', () => {
    expect(isValidEmail('user name@example.com')).toBe(false);
  });
});

describe('isStrongPassword', () => {
  it('accepts a strong password', () => {
    expect(isStrongPassword('Abc123!@')).toBe(true);
    expect(isStrongPassword('MyP@ssw0rd')).toBe(true);
  });

  it('rejects passwords shorter than 8 chars', () => {
    expect(isStrongPassword('Ab1!')).toBe(false);
  });

  it('rejects passwords without uppercase', () => {
    expect(isStrongPassword('abc123!@')).toBe(false);
  });

  it('rejects passwords without lowercase', () => {
    expect(isStrongPassword('ABC123!@')).toBe(false);
  });

  it('rejects passwords without a number', () => {
    expect(isStrongPassword('Abcdef!@')).toBe(false);
  });

  it('rejects passwords without a special character', () => {
    expect(isStrongPassword('Abc12345')).toBe(false);
  });

  it('rejects passwords longer than 128 chars', () => {
    const long = 'Aa1!' + 'a'.repeat(125);
    expect(isStrongPassword(long)).toBe(false);
  });

  it('exposes a human-readable rules description', () => {
    expect(PASSWORD_RULES_TEXT).toContain('8 characters');
    expect(PASSWORD_RULES_TEXT).toContain('uppercase');
    expect(PASSWORD_RULES_TEXT).toContain('lowercase');
    expect(PASSWORD_RULES_TEXT).toContain('number');
    expect(PASSWORD_RULES_TEXT).toContain('special');
  });
});
