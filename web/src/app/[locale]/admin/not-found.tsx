'use client';

import { DashboardOutlined } from '@ant-design/icons';
import { Button, Result } from 'antd';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const AdminNotFoundPage = () => {
  const t = useTranslations('Admin.NotFound');

  return (
    <div className="admin-not-found-page flex min-h-[75vh] items-center justify-center">
      <Result
        status="404"
        title={
          <>
            <div className="font-mono text-3xl text-neutral-400">404</div>
            {t('title')}
          </>
        }
        subTitle={t('description')}
        extra={
          <Link href="/admin/dashboard">
            <Button type="primary" icon={<DashboardOutlined />}>
              {t('backHome')}
            </Button>
          </Link>
        }
      />
    </div>
  );
};

export default AdminNotFoundPage;
