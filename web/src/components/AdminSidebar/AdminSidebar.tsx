'use client';

import { DashboardOutlined, LogoutOutlined } from '@ant-design/icons';
import { Button, Layout, Menu } from 'antd';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { staffApiClient } from '@/lib/apiClient';
import { getActiveNavKey } from '@/utils/getActiveNavKey';
import LanguageSwitcher from '../LanguageSwitcher';

const { Sider } = Layout;

/** Hidden on the login page itself - a signed-out visitor there has nothing to navigate to and no
 * session to log out of yet (mirrors PortalNav's same rule for the end-user portal). */
const LOGIN_PATH = '/admin/login';

const NAV_KEYS = ['/admin/dashboard'];

const AdminSidebar = () => {
  const t = useTranslations('Admin.RootShell');
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const activeKey = getActiveNavKey(pathname, NAV_KEYS);

  const handleLogout = async () => {
    try {
      await staffApiClient.post('/auth/staff/logout');
    } catch {
      // Best-effort - the local session is cleared below regardless of whether this succeeds.
    }
    staffApiClient.setAccessToken(null);
    router.replace('/admin/login');
  };

  if (pathname === LOGIN_PATH) {
    return null;
  }

  return (
    <Sider
      className={`admin-sidebar${collapsed ? ' admin-sidebar--collapsed' : ''}`}
      theme="dark"
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      breakpoint="lg"
      collapsedWidth={64}
      // Fixed (not min) height + sticky positioning: this is what actually pins the whole rail -
      // including the language/logout block below - to the viewport regardless of page scroll.
      // A `minHeight` here let the sidebar grow taller than one viewport (to 100vh + the
      // collapse-trigger bar's own 48px, since that trigger is a normal sibling element appended
      // after this content, not an overlay on top of it), which pushed the bottom block down past
      // the visible area instead of keeping it pinned at the bottom.
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--color-neutral-900)',
      }}
    >
      {/* antd renders Sider's children inside its own internal wrapper div, which doesn't
          inherit a flex layout from a className on Sider itself - this div is what actually
          needs to be the flex column container for `mt-auto` below to push to the bottom. */}
      <div className="flex h-full flex-col">
        <div className="admin-sidebar__brand flex h-16 items-center justify-center overflow-hidden border-white/10 border-b px-2">
          <span className="truncate font-semibold text-white">{collapsed ? '' : t('brand')}</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={activeKey ? [activeKey] : []}
          items={[
            {
              key: '/admin/dashboard',
              icon: <DashboardOutlined style={{ fontSize: 16 }} />,
              label: <Link href="/admin/dashboard">{t('dashboardNav')}</Link>,
            },
          ]}
          style={{ backgroundColor: 'var(--color-neutral-900)' }}
          className="admin-sidebar__menu flex-1 overflow-y-auto"
        />
        {/* Horizontal padding shrinks when collapsed so the 56px-wide buttons (matching the
            Menu.Item box above) fit and center within the 64px collapsed rail. */}
        <div
          className={`admin-sidebar__footer flex flex-col items-center gap-2 py-3 ${collapsed ? 'px-1' : 'px-3'}`}
        >
          <LanguageSwitcher collapsed={collapsed} />
          <Button
            icon={<LogoutOutlined style={{ fontSize: 16 }} />}
            onClick={handleLogout}
            block={!collapsed}
            // Matches the Sider's own collapsed Menu.Item box (56x40, 8px radius) when collapsed;
            // `block` above already handles the expanded (full-width) case.
            style={collapsed ? { width: 56, height: 40, borderRadius: 8 } : undefined}
          >
            {!collapsed && t('logout')}
          </Button>
        </div>
      </div>
    </Sider>
  );
};

export default AdminSidebar;
