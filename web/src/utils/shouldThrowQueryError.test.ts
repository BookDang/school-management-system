import { shouldThrowQueryError } from './shouldThrowQueryError';

describe('shouldThrowQueryError', () => {
  it('throws for a network/timeout failure (status 0)', () => {
    expect(shouldThrowQueryError({ status: 0 })).toBe(true);
  });

  it('throws for a 500 server error', () => {
    expect(shouldThrowQueryError({ status: 500 })).toBe(true);
  });

  it('throws for a 503 server error', () => {
    expect(shouldThrowQueryError({ status: 503 })).toBe(true);
  });

  it('does not throw for a 400 validation error', () => {
    expect(shouldThrowQueryError({ status: 400 })).toBe(false);
  });

  it('does not throw for a 401 (already handled by apiClient refresh/redirect)', () => {
    expect(shouldThrowQueryError({ status: 401 })).toBe(false);
  });

  it('throws for a 403 forbidden', () => {
    expect(shouldThrowQueryError({ status: 403 })).toBe(true);
  });

  it('does not throw for a 404 not found', () => {
    expect(shouldThrowQueryError({ status: 404 })).toBe(false);
  });

  it('does not throw when the error has no status field', () => {
    expect(shouldThrowQueryError(new Error('unexpected'))).toBe(false);
  });
});
