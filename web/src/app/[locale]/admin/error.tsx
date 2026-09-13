'use client';

import { DashboardOutlined, WarningOutlined } from '@ant-design/icons';
import { Button, Result } from 'antd';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { getErrorCode } from '@/utils/getErrorCode';

interface AdminErrorPageProps {
  /** `digest` is set by Next.js for a Server Component render error; `status` is set when this
   * is actually an ApiError thrown from a useQuery via `throwOnError` (see providers.tsx). */
  error: Error & { digest?: string; status?: number };
  reset: () => void;
}

const AdminErrorPage = ({ error, reset }: AdminErrorPageProps) => {
  const t = useTranslations('Admin');
  const errorCode = getErrorCode(error);
  // A 403 means retrying the identical request will fail again the same way - only a generic,
  // possibly-transient failure (network/500) is worth offering a retry button for.
  const isForbidden = error.status === 403;

  useEffect(() => {
    console.error(error);
  }, [error]);

  const homeButton = (
    <Link key="home" href="/admin/dashboard">
      <Button type={isForbidden ? 'primary' : 'default'} icon={<DashboardOutlined />}>
        {t('Error.backHome')}
      </Button>
    </Link>
  );

  return (
    <div className="admin-error-page flex min-h-[75vh] items-center justify-center">
      <Result
        icon={isForbidden ? undefined : <WarningOutlined />}
        status={isForbidden ? '403' : 'error'}
        title={
          <>
            {errorCode !== undefined && (
              <div className="font-mono text-3xl text-neutral-400">{errorCode}</div>
            )}
            {isForbidden ? t('Forbidden.title') : t('Error.title')}
          </>
        }
        subTitle={isForbidden ? t('Forbidden.description') : t('Error.description')}
        extra={
          isForbidden
            ? [homeButton]
            : [
                <Button key="retry" type="primary" onClick={reset}>
                  {t('Error.retry')}
                </Button>,
                homeButton,
              ]
        }
      />
    </div>
  );
};

export default AdminErrorPage;
