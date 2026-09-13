'use client';

import { Breadcrumb } from 'antd';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const LOGIN_PATH = '/admin/login';
const HOME_PATH = '/admin/dashboard';

/** Maps a raw path segment to the translation key (within the `Admin` namespace) that names it
 * elsewhere in the admin UI - keeps breadcrumb labels in sync with the sidebar/page instead of
 * duplicating strings. A segment with no entry here (a dynamic id, or a page not added yet) falls
 * back to a capitalized version of the raw text. */
const SEGMENT_LABEL_KEYS: Record<string, string> = {
  dashboard: 'RootShell.dashboardNav',
};

const capitalize = (segment: string) =>
  segment.length === 0
    ? segment
    : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');

const AdminBreadcrumb = () => {
  const pathname = usePathname();
  const t = useTranslations('Admin');

  if (pathname === LOGIN_PATH) {
    return null;
  }

  const brand = t('RootShell.brand');

  // The dashboard is the admin portal's home page - showing "Admin Portal > Dashboard" there
  // would just repeat the same destination twice, so it collapses to a single crumb.
  if (pathname === HOME_PATH) {
    return <Breadcrumb className="admin-breadcrumb" items={[{ title: brand }]} />;
  }

  const segments = pathname
    .split('/')
    .filter((segment) => segment.length > 0 && segment !== 'admin');

  const items = [
    { title: <Link href={HOME_PATH}>{brand}</Link> },
    ...segments.map((segment, index) => {
      const href = `/admin/${segments.slice(0, index + 1).join('/')}`;
      const label = SEGMENT_LABEL_KEYS[segment]
        ? t(SEGMENT_LABEL_KEYS[segment])
        : capitalize(segment);
      const isLast = index === segments.length - 1;

      return { title: isLast ? label : <Link href={href}>{label}</Link> };
    }),
  ];

  return <Breadcrumb className="admin-breadcrumb" items={items} />;
};

export default AdminBreadcrumb;
