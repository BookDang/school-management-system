'use client';

import { Link, usePathname } from '@/i18n/navigation';

interface PortalNavProps {
  href: string;
  label: string;
  loginPath: string;
  className: string;
}

/** Hidden on the login page itself - a signed-out visitor there has nothing to navigate to yet
 * (no dashboard to go back to), and a signed-in one should see sign-out, not a dashboard link. */
const PortalNav = ({ href, label, loginPath, className }: PortalNavProps) => {
  const pathname = usePathname();

  if (pathname === loginPath) {
    return null;
  }

  return (
    <nav className={`flex gap-4 text-sm ${className}`}>
      <Link href={href}>{label}</Link>
    </nav>
  );
};

export default PortalNav;
