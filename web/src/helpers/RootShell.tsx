import { Geist, Geist_Mono } from 'next/font/google';
import '@/app/globals.css';
import Providers from '@/app/providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

interface RootShellProps {
  brand: string;
  navHref: string;
  headerClassName: string;
  navClassName: string;
  children: React.ReactNode;
}

/**
 * Shared skeleton for the app's independent root layouts (app/(user)/layout.tsx,
 * app/admin/layout.tsx). Each of those still owns its own <html>/<body> — Next.js's "multiple
 * root layouts" pattern — this just avoids repeating the fonts/Providers/shell markup between them.
 */
export const RootShell = ({
  brand,
  navHref,
  headerClassName,
  navClassName,
  children,
}: RootShellProps) => {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <div className="flex min-h-full flex-1 flex-col">
            <header className={`flex items-center justify-between px-6 py-4 ${headerClassName}`}>
              <span className="font-semibold">{brand}</span>
              <nav className={`flex gap-4 text-sm ${navClassName}`}>
                <a href={navHref}>Dashboard</a>
              </nav>
            </header>
            <main className="flex-1">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
};
