import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AdminSidebar from '@/components/AdminSidebar';
import { RootShell } from '@/components/RootShell';

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

  return (
    <RootShell locale={locale} portal="staff" layout="sidebar" sidebar={<AdminSidebar />}>
      {children}
    </RootShell>
  );
};

export default AdminLayout;
