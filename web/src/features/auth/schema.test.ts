import { loginSchema } from './schema';

describe('loginSchema', () => {
  const validPassword = 'Abcdefg1!';

  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'jane@example.com', password: validPassword });

    expect(result.success).toBe(true);
  });

  it('rejects an invalid email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: validPassword });

    expect(result.success).toBe(false);
  });

  it.each([
    ['too short', 'Ab1!'],
    ['too long', `${'Ab1!'.repeat(6)}`],
    ['missing uppercase', 'abcdefg1!'],
    ['missing lowercase', 'ABCDEFG1!'],
    ['missing a number', 'Abcdefgh!'],
    ['missing a special character', 'Abcdefg1'],
  ])('rejects a password that is %s', (_label, password) => {
    const result = loginSchema.safeParse({ email: 'jane@example.com', password });

    expect(result.success).toBe(false);
  });
});
