'use client';

import { HomeOutlined } from '@ant-design/icons';
import { Button, Result } from 'antd';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

const UserNotFoundPage = () => {
  const t = useTranslations('User.NotFound');

  return (
    <div className="user-not-found-page flex min-h-[75vh] items-center justify-center">
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
          <Link href="/">
            <Button type="primary" icon={<HomeOutlined />}>
              {t('backHome')}
            </Button>
          </Link>
        }
      />
    </div>
  );
};

export default UserNotFoundPage;
