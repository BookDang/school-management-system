'use client';

import { GlobalOutlined } from '@ant-design/icons';
import { Button, Dropdown, Select } from 'antd';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

// Each language's own name for itself (an autonym), not translated into the currently active
// locale - a Vietnamese speaker sees "English" here, not "Tiếng Anh", same as any language picker.
const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
};

interface LanguageSwitcherProps {
  /** Renders as an icon-only dropdown trigger instead of the full select - for use in a
   * collapsed sidebar where there's no room for the select's width. */
  collapsed?: boolean;
}

const LanguageSwitcher = ({ collapsed = false }: LanguageSwitcherProps) => {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Common.LanguageSwitcher');

  const changeLocale = (nextLocale: string) => router.replace(pathname, { locale: nextLocale });

  if (collapsed) {
    return (
      <Dropdown
        trigger={['click']}
        placement="topLeft"
        menu={{
          // Explicitly override mode/inlineCollapsed - Dropdown's menu otherwise inherits the
          // parent Sider's collapsed context through React's component tree (portaling the
          // overlay to document.body doesn't change that), and renders each item as just its
          // first letter, thinking it's the sider's own inline-collapsed menu.
          mode: 'vertical',
          inlineCollapsed: false,
          selectedKeys: [locale],
          items: routing.locales.map((loc) => ({ key: loc, label: LOCALE_NAMES[loc] })),
          onClick: ({ key }) => changeLocale(key),
          style: { minWidth: 140 },
        }}
      >
        <Button
          className="language-switcher language-switcher--collapsed"
          aria-label={t('label')}
          icon={<GlobalOutlined style={{ fontSize: 16 }} />}
          // Matches the Sider's own collapsed Menu.Item box (56x40, 8px radius) so the two line
          // up visually instead of the button defaulting to its own smaller 40x32 size.
          style={{ width: 56, height: 40, borderRadius: 8 }}
        />
      </Dropdown>
    );
  }

  return (
    <Select
      aria-label={t('label')}
      value={locale}
      size="small"
      className="language-switcher w-full"
      onChange={changeLocale}
      options={routing.locales.map((loc) => ({ value: loc, label: LOCALE_NAMES[loc] }))}
    />
  );
};

export default LanguageSwitcher;
