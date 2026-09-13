'use client';

import { Layout } from 'antd';
import AdminBreadcrumb from '../AdminBreadcrumb';

interface SidebarLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

/** antd's `Layout`/`Layout.Content` need a client boundary (like every other antd component in
 * this app - `Button`, `Form`, `Input`...) - `RootShell` itself is a Server Component, so this
 * wrapper exists just to keep that antd usage out of it. */
const SidebarLayout = ({ sidebar, children }: SidebarLayoutProps) => (
  // `hasSider` is required here: `Layout` normally infers row-vs-column direction by checking
  // whether a direct child's type is antd's own `Sider`, but our direct child is `AdminSidebar`
  // (which renders a `Sider` internally, not `Layout`'s literal child) - that check fails, and its
  // fallback (a `siders` array populated only after the Sider mounts and registers itself) is
  // empty on the very first render, so without this prop `Layout` briefly renders as a column
  // (sidebar stacked above content) before self-correcting to a row a render later.
  <Layout className="sidebar-layout" hasSider style={{ minHeight: '100vh' }}>
    {sidebar}
    <Layout.Content className="sidebar-layout__content bg-white p-4">
      <AdminBreadcrumb />
      <div>{children}</div>
    </Layout.Content>
  </Layout>
);

export default SidebarLayout;
