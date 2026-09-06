'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { ApiError } from '@/lib/apiClient';
import { setAccessToken } from '@/lib/apiClient';
import LoginForm from './LoginForm';
import { useLogin } from './mutations';
import type { LoginInput } from './schema';

const LoginPage = () => {
  const router = useRouter();
  const t = useTranslations();
  const [errorMessage, setErrorMessage] = useState<string>();
  const { mutateAsync, isPending } = useLogin();

  const handleSubmit = async (values: LoginInput) => {
    setErrorMessage(undefined);
    try {
      const result = await mutateAsync(values);
      setAccessToken(result.accessToken);
      router.push('/dashboard');
    } catch (error) {
      setErrorMessage((error as ApiError).message ?? t('User.LoginPage.genericError'));
    }
  };

  return (
    <LoginForm
      title={t('User.LoginPage.title')}
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      errorMessage={errorMessage}
    />
  );
};

export default LoginPage;
