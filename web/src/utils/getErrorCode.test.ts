import { getErrorCode } from './getErrorCode';

describe('getErrorCode', () => {
  it('prefers status when both status and digest are present', () => {
    expect(getErrorCode({ status: 500, digest: 'abc123' })).toBe(500);
  });

  it('returns status for an API error', () => {
    expect(getErrorCode({ status: 500 })).toBe(500);
  });

  it('returns digest for a Server Component render error', () => {
    expect(getErrorCode({ digest: 'abc123' })).toBe('abc123');
  });

  it('returns undefined when neither is present', () => {
    expect(getErrorCode({})).toBeUndefined();
  });
});
