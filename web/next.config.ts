import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Without this, Next's dev server treats requests arriving with a Host header other than
  // localhost (e.g. `sms.site` via the nginx proxy) as an untrusted cross-origin request — it
  // still serves the page, but silently degrades client hydration/HMR, which looks like "the
  // login form does nothing" (native form GET instead of the JS handler running).
  allowedDevOrigins: ['sms.site'],
  // The repo root's package-lock.json (added for the Husky pre-push hook) makes Turbopack infer
  // the monorepo root as the workspace root instead of web/, which can point its generated
  // `.next` route types at the wrong directory and break `next build`'s type check.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
