import { getActiveNavKey } from './getActiveNavKey';

describe('getActiveNavKey', () => {
  const keys = ['/admin/dashboard', '/admin/classes'];

  it('matches an exact pathname', () => {
    expect(getActiveNavKey('/admin/dashboard', keys)).toBe('/admin/dashboard');
  });

  it('matches a child route under a nav key', () => {
    expect(getActiveNavKey('/admin/classes/123/edit', keys)).toBe('/admin/classes');
  });

  it('does not match a key that only shares a text prefix without a `/` boundary', () => {
    expect(getActiveNavKey('/admin/classesroom', keys)).toBeUndefined();
  });

  it('returns the longest match when multiple keys match', () => {
    expect(
      getActiveNavKey('/admin/classes/123/edit', ['/admin/classes', '/admin/classes/123']),
    ).toBe('/admin/classes/123');
  });

  it('returns undefined when nothing matches', () => {
    expect(getActiveNavKey('/admin/staff', keys)).toBeUndefined();
  });
});
