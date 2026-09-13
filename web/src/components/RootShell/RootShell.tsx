import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Geist, Geist_Mono } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import '@/app/globals.css';
import Providers from '@/app/providers';
import AntdThemeProvider from '../AntdThemeProvider';
import PortalNav from '../PortalNav';
import SidebarLayout from './SidebarLayout';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

interface RootShellBaseProps {
  locale: string;
  portal: 'user' | 'staff';
  children: React.ReactNode;
}

/** Simple top-bar chrome (brand + one nav link), used by the end-user portal. */
interface TopNavProps {
  layout: 'topnav';
  brand: string;
  navHref: string;
  navLabel: string;
  loginPath: string;
  headerClassName: string;
  navClassName: string;
}

/** Left sidebar chrome (its own brand/nav/logout/language switcher), used by the admin portal. */
interface SidebarProps {
  layout: 'sidebar';
  sidebar: React.ReactNode;
}

type RootShellProps = RootShellBaseProps & (TopNavProps | SidebarProps);

/**
 * Shared skeleton for the app's independent root layouts (app/[locale]/(user)/layout.tsx,
 * app/[locale]/admin/layout.tsx). Each of those still owns its own <html>/<body> — Next.js's
 * "multiple root layouts" pattern — this just avoids repeating the fonts/Providers/shell markup
 * between them.
 */
export const RootShell = async (props: RootShellProps) => {
  const { locale, portal, children } = props;
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AntdRegistry>
          <AntdThemeProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              <Providers portal={portal}>
                {props.layout === 'sidebar' ? (
                  <SidebarLayout sidebar={props.sidebar}>{children}</SidebarLayout>
                ) : (
                  <div className="flex min-h-full flex-1 flex-col">
                    <header
                      className={`flex items-center justify-between px-6 py-4 ${props.headerClassName}`}
                    >
                      <span className="font-semibold">{props.brand}</span>
                      <PortalNav
                        href={props.navHref}
                        label={props.navLabel}
                        loginPath={props.loginPath}
                        className={props.navClassName}
                      />
                    </header>
                    <main className="flex-1">{children}</main>
                  </div>
                )}
              </Providers>
            </NextIntlClientProvider>
          </AntdThemeProvider>
        </AntdRegistry>
      </body>
    </html>
  );
};
