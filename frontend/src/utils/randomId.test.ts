import { randomId } from '@/utils/randomId';

/**
 * randomId tests — verify the format and uniqueness of generated ids.
 */
describe('randomId', () => {
  it('generates an id with the o_ prefix', () => {
    const id = randomId();
    expect(id).toMatch(/^o_[a-z0-9]+$/);
  });

  it('generates unique ids', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(randomId());
    }
    expect(ids.size).toBe(100);
  });
});
