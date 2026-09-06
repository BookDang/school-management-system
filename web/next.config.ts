import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Without this, Next's dev server treats requests arriving with a Host header other than
  // localhost (e.g. `sms.site` via the nginx proxy) as an untrusted cross-origin request — it
  // still serves the page, but silently degrades client hydration/HMR, which looks like "the
  // login form does nothing" (native form GET instead of the JS handler running).
  allowedDevOrigins: ['sms.site'],
};

export default withNextIntl(nextConfig);
