import { getTranslations } from 'next-intl/server';

const UserDashboardPage = async () => {
  const t = await getTranslations();

  return (
    <div className="user-dashboard-page py-6">
      <h1 className="text-xl font-semibold">{t('User.Dashboard.title')}</h1>
    </div>
  );
};

export default UserDashboardPage;
