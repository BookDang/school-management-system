import { z } from 'zod';

export const PASSWORD_HINT =
  '8-20 characters, with upper & lower case, a number, and a special character';

const passwordSchema = z
  .string()
  .min(8, 'Must be at least 8 characters')
  .max(20, 'Must be at most 20 characters')
  .regex(/[A-Z]/, 'Must contain at least 1 uppercase letter')
  .regex(/[a-z]/, 'Must contain at least 1 lowercase letter')
  .regex(/[0-9]/, 'Must contain at least 1 number')
  .regex(/[^A-Za-z0-9]/, 'Must contain at least 1 special character');

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: passwordSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;
