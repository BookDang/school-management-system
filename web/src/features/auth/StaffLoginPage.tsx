'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { ApiError } from '@/lib/apiClient';
import { staffApiClient } from '@/lib/apiClient';
import LoginForm from './LoginForm';
import { useStaffLogin } from './mutations';
import type { LoginInput } from './schema';

const StaffLoginPage = () => {
  const router = useRouter();
  const t = useTranslations();
  const [errorMessage, setErrorMessage] = useState<string>();
  const { mutateAsync, isPending } = useStaffLogin();

  const handleSubmit = async (values: LoginInput) => {
    setErrorMessage(undefined);
    try {
      const result = await mutateAsync(values);
      staffApiClient.setAccessToken(result.accessToken);
      router.push('/admin/dashboard');
    } catch (error) {
      setErrorMessage((error as ApiError).message ?? t('Admin.StaffLoginPage.genericError'));
    }
  };

  return (
    <LoginForm
      title={t('Admin.StaffLoginPage.title')}
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      errorMessage={errorMessage}
    />
  );
};

export default StaffLoginPage;
