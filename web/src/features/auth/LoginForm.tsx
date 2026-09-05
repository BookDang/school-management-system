'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { type LoginInput, loginSchema, PASSWORD_HINT } from './schema';

interface LoginFormProps {
  title: string;
  onSubmit: (values: LoginInput) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

const LoginForm = ({ title, onSubmit, isSubmitting, errorMessage }: LoginFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-16">
      <h1 className="text-xl font-semibold">{title}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
            {...register('email')}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Password
            <span className="ml-1 text-xs font-normal text-black/50 dark:text-white/50">
              ({PASSWORD_HINT})
            </span>
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="rounded border border-black/[.15] px-3 py-2 dark:border-white/[.2]"
            {...register('password')}
          />
          {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
        </div>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background disabled:opacity-50"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
