import { getTranslations } from 'next-intl/server';

const AdminDashboardPage = async () => {
  const t = await getTranslations();

  return (
    <div className="admin-dashboard-page py-4 pt-2">
      <h1 className="text-xl font-semibold">{t('Admin.Dashboard.title')}</h1>
    </div>
  );
};

export default AdminDashboardPage;
