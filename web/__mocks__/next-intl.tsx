// Manual mock for the `next-intl` node_modules package (auto-applied by Jest, no `jest.mock()`
// call needed). The real package's client entry point ships ESM-only files that Jest can't
// require() as CommonJS (same class of issue as the @ant-design/icons mock). This reimplements
// just enough of the client API (NextIntlClientProvider + useTranslations + useLocale) against
// the real messages/locale passed in by test-utils/renderWithIntl, so tests exercise real message
// content.
import { createContext, type ReactNode, useContext } from 'react';

type Messages = Record<string, unknown>;

interface IntlContextValue {
  locale: string;
  messages: Messages;
}

const IntlContext = createContext<IntlContextValue>({ locale: 'en', messages: {} });

export const NextIntlClientProvider = ({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: Messages;
  children: ReactNode;
}) => <IntlContext.Provider value={{ locale, messages }}>{children}</IntlContext.Provider>;

const resolve = (messages: Messages, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (acc, key) => (acc && typeof acc === 'object' ? (acc as Messages)[key] : undefined),
      messages,
    );

export const useTranslations = (namespace?: string) => {
  const { messages } = useContext(IntlContext);
  const scoped = namespace ? ((resolve(messages, namespace) as Messages) ?? {}) : messages;

  return (key: string): string => {
    const value = resolve(scoped, key);
    return typeof value === 'string' ? value : key;
  };
};

export const useLocale = (): string => useContext(IntlContext).locale;
