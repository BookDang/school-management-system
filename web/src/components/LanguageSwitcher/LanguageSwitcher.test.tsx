import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import common from '../../../messages/en/common.json';
import LanguageSwitcher from './LanguageSwitcher';

jest.mock('@/i18n/navigation', () => ({
  usePathname: jest.fn(() => '/admin/dashboard'),
  useRouter: jest.fn(),
}));
jest.mock('@/i18n/routing', () => ({
  routing: { locales: ['en', 'vi'], defaultLocale: 'en' },
}));

const renderSwitcher = (collapsed?: boolean) =>
  render(
    <NextIntlClientProvider locale="en" messages={{ Common: common }}>
      <LanguageSwitcher collapsed={collapsed} />
    </NextIntlClientProvider>,
  );

describe('LanguageSwitcher', () => {
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace });
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');
  });

  it('shows the current locale', () => {
    renderSwitcher();

    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('switches locale while staying on the same page', async () => {
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('Tiếng Việt'));

    expect(replace).toHaveBeenCalledWith('/admin/dashboard', { locale: 'vi' });
  });

  it('renders as an icon-only dropdown trigger when collapsed', async () => {
    const user = userEvent.setup();
    renderSwitcher(true);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    const trigger = screen.getByRole('button', { name: 'Language' });
    expect(trigger).toBeInTheDocument();

    await user.click(trigger);
    await user.click(screen.getByText('Tiếng Việt'));

    expect(replace).toHaveBeenCalledWith('/admin/dashboard', { locale: 'vi' });
  });
});
