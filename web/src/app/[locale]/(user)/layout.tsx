import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RootShell } from '@/helpers/RootShell';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export const generateMetadata = async ({
  params,
}: Omit<LayoutProps, 'children'>): Promise<Metadata> => {
  const { locale } = await params;
  const t = await getTranslations({ locale });
  return {
    title: t('User.RootShell.brand'),
    description: 'Student portal for the school management system',
  };
};

const UserLayout = async ({ children, params }: LayoutProps) => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <RootShell
      locale={locale}
      portal="user"
      brand={t('User.RootShell.brand')}
      navHref="/dashboard"
      navLabel={t('User.RootShell.dashboardNav')}
      headerClassName="border-b border-black/[.08] dark:border-white/[.145]"
      navClassName="text-zinc-600 dark:text-zinc-400"
    >
      {children}
    </RootShell>
  );
};

export default UserLayout;
