'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ApiError } from '@/lib/apiClient';
import { setAccessToken } from '@/lib/apiClient';
import LoginForm from './LoginForm';
import { useStaffLogin } from './mutations';
import type { LoginInput } from './schema';

const StaffLoginPage = () => {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string>();
  const { mutateAsync, isPending } = useStaffLogin();

  const handleSubmit = async (values: LoginInput) => {
    setErrorMessage(undefined);
    try {
      const result = await mutateAsync(values);
      setAccessToken(result.accessToken);
      router.push('/admin/dashboard');
    } catch (error) {
      setErrorMessage((error as ApiError).message ?? 'Something went wrong');
    }
  };

  return (
    <LoginForm
      title="Sign in to Admin Portal"
      onSubmit={handleSubmit}
      isSubmitting={isPending}
      errorMessage={errorMessage}
    />
  );
};

export default StaffLoginPage;
