import { z } from 'zod';

type Translate = (key: string) => string;

export const createLoginSchema = (t: Translate) =>
  z.object({
    email: z.string().email(t('emailInvalid')),
    password: z
      .string()
      .min(8, t('passwordMin'))
      .max(20, t('passwordMax'))
      .regex(/[A-Z]/, t('passwordUppercase'))
      .regex(/[a-z]/, t('passwordLowercase'))
      .regex(/[0-9]/, t('passwordNumber'))
      .regex(/[^A-Za-z0-9]/, t('passwordSpecial')),
  });

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
