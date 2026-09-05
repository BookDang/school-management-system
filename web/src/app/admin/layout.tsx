import type { Metadata } from 'next';
import { RootShell } from '@/helpers/RootShell';

export const metadata: Metadata = {
  title: 'Admin Portal',
  description: 'Staff admin portal for the school management system',
};

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <RootShell
      brand="Admin Portal"
      navHref="/admin/dashboard"
      headerClassName="bg-zinc-900 text-zinc-50"
      navClassName="text-zinc-300"
    >
      {children}
    </RootShell>
  );
};

export default AdminLayout;
