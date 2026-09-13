import { type NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { REFRESH_COOKIE_NAME, STAFF_REFRESH_COOKIE_NAME } from '@/constants/auth-cookies.constant';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

const USER_LOGIN_PATH = '/login';
const STAFF_LOGIN_PATH = '/admin/login';

/** This is a UX convenience only, not a security boundary - it just avoids rendering a page shell
 * for a visitor with no session cookie at all. The api's own guards (JwtAuthGuard/PoliciesGuard)
 * remain the actual authorization check for every request; this middleware never sees the access
 * token (it's kept in-memory in the browser, not a cookie) and can't tell a valid refresh cookie
 * from an expired/revoked one - only the api's /auth/refresh can determine that. */
// Only `/dashboard` needs a session - unlike the staff portal, the end-user portal also serves
// public pages (e.g. the home page `/`), so it can't default to "protect everything but login".
const isProtectedUserPath = (path: string): boolean => path.startsWith('/dashboard');
const isProtectedStaffPath = (path: string): boolean =>
  path.startsWith('/admin') && path !== STAFF_LOGIN_PATH;

const localeOf = (pathname: string): string => {
  const [, maybeLocale] = pathname.split('/');
  return (routing.locales as readonly string[]).includes(maybeLocale)
    ? maybeLocale
    : routing.defaultLocale;
};

const stripLocale = (pathname: string, locale: string): string => {
  const withoutLocale = pathname.slice(`/${locale}`.length);
  return withoutLocale === '' ? '/' : withoutLocale;
};

export default function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  // next-intl redirects when the locale prefix is missing/wrong (localePrefix: 'always') - let
  // that resolve first; our own check only applies once a locale segment is already present.
  if (intlResponse.headers.get('location')) {
    return intlResponse;
  }

  const locale = localeOf(request.nextUrl.pathname);
  const path = stripLocale(request.nextUrl.pathname, locale);

  if (isProtectedStaffPath(path)) {
    if (!request.cookies.has(STAFF_REFRESH_COOKIE_NAME)) {
      return NextResponse.redirect(new URL(`/${locale}${STAFF_LOGIN_PATH}`, request.url));
    }
    return intlResponse;
  }

  if (isProtectedUserPath(path) && !request.cookies.has(REFRESH_COOKIE_NAME)) {
    return NextResponse.redirect(new URL(`/${locale}${USER_LOGIN_PATH}`, request.url));
  }

  return intlResponse;
}

export const config = {
  // Skip API routes, Next internals, and static files (anything with a dot in the last segment).
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
