'use client';

import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Form, Input } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { type LoginInput, loginSchema, PASSWORD_HINT } from './schema';

interface LoginFormProps {
  title: string;
  onSubmit: (values: LoginInput) => void;
  isSubmitting: boolean;
  errorMessage?: string;
}

const LoginForm = ({ title, onSubmit, isSubmitting, errorMessage }: LoginFormProps) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-6 py-16">
      <h1 className="text-xl font-semibold">{title}</h1>
      {/* antd's Form only drives the submit event here — validation stays on
          react-hook-form + zod (see docs/CONVENTIONS.md) since Form.Item never
          registers these fields with antd's own field store. */}
      <Form layout="vertical" onFinish={() => handleSubmit(onSubmit)()}>
        <Form.Item
          label="Email"
          htmlFor="email"
          validateStatus={errors.email ? 'error' : ''}
          help={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                id="email"
                type="email"
                autoComplete="email"
                prefix={<MailOutlined />}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              Password{' '}
              <span className="text-xs font-normal text-black/50 dark:text-white/50">
                ({PASSWORD_HINT})
              </span>
            </span>
          }
          htmlFor="password"
          validateStatus={errors.password ? 'error' : ''}
          help={errors.password?.message}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <Input.Password
                {...field}
                id="password"
                autoComplete="current-password"
                prefix={<LockOutlined />}
              />
            )}
          />
        </Form.Item>

        {errorMessage && <p className="text-sm text-red-600">{errorMessage}</p>}

        <Form.Item className="mb-0">
          <Button type="primary" htmlType="submit" loading={isSubmitting} block>
            Sign in
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginForm;
