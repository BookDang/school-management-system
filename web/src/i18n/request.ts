import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const [common, user, admin] = await Promise.all([
    import(`../../messages/${locale}/common.json`),
    import(`../../messages/${locale}/user.json`),
    import(`../../messages/${locale}/admin.json`),
  ]);

  return {
    locale,
    messages: {
      Common: common.default,
      User: user.default,
      Admin: admin.default,
    },
  };
});
