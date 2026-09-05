import type { Metadata } from 'next';
import { RootShell } from '@/helpers/RootShell';

export const metadata: Metadata = {
  title: 'School Portal',
  description: 'Student portal for the school management system',
};

const UserLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <RootShell
      brand="School Portal"
      navHref="/dashboard"
      headerClassName="border-b border-black/[.08] dark:border-white/[.145]"
      navClassName="text-zinc-600 dark:text-zinc-400"
    >
      {children}
    </RootShell>
  );
};

export default UserLayout;
