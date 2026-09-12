import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
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
  locale: string;
  portal: 'user' | 'staff';
  brand: string;
  navHref: string;
  navLabel: string;
  headerClassName: string;
  navClassName: string;
  children: React.ReactNode;
}

/**
 * Shared skeleton for the app's independent root layouts (app/[locale]/(user)/layout.tsx,
 * app/[locale]/admin/layout.tsx). Each of those still owns its own <html>/<body> — Next.js's
 * "multiple root layouts" pattern — this just avoids repeating the fonts/Providers/shell markup
 * between them.
 */
export const RootShell = async ({
  locale,
  portal,
  brand,
  navHref,
  navLabel,
  headerClassName,
  navClassName,
  children,
}: RootShellProps) => {
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AntdRegistry>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Providers portal={portal}>
              <div className="flex min-h-full flex-1 flex-col">
                <header
                  className={`flex items-center justify-between px-6 py-4 ${headerClassName}`}
                >
                  <span className="font-semibold">{brand}</span>
                  <nav className={`flex gap-4 text-sm ${navClassName}`}>
                    <Link href={navHref}>{navLabel}</Link>
                  </nav>
                </header>
                <main className="flex-1">{children}</main>
              </div>
            </Providers>
          </NextIntlClientProvider>
        </AntdRegistry>
      </body>
    </html>
  );
};
