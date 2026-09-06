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
    title: t('Admin.RootShell.brand'),
    description: 'Staff admin portal for the school management system',
  };
};

const AdminLayout = async ({ children, params }: LayoutProps) => {
  const { locale } = await params;
  const t = await getTranslations({ locale });

  return (
    <RootShell
      locale={locale}
      brand={t('Admin.RootShell.brand')}
      navHref="/admin/dashboard"
      navLabel={t('Admin.RootShell.dashboardNav')}
      headerClassName="bg-zinc-900 text-zinc-50"
      navClassName="text-zinc-300"
    >
      {children}
    </RootShell>
  );
};

export default AdminLayout;
