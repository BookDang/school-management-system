import type { Response } from 'express';

/**
 * `/` rather than `/auth`: the browser sees this cookie's path relative to whatever origin path
 * it called through (e.g. nginx proxies `sms.site/api/*` to this API's `/*`, stripping the `/api`
 * prefix) — scoping to `/auth` would only match the browser hitting `/auth/*` directly and miss
 * every proxied `/api/auth/*` call. It's still httpOnly + sameSite, so this doesn't widen exposure,
 * only which requests carry it.
 */
const REFRESH_COOKIE_PATH = '/';

export const setRefreshCookie = (
  res: Response,
  cookieName: string,
  token: string,
  maxAgeMs: number,
): void => {
  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: REFRESH_COOKIE_PATH,
    maxAge: maxAgeMs,
  });
};

export const clearRefreshCookie = (res: Response, cookieName: string): void => {
  res.clearCookie(cookieName, { path: REFRESH_COOKIE_PATH });
};
