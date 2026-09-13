import { render, screen } from '@testing-library/react';
import { usePathname } from '@/i18n/navigation';
import PortalNav from './PortalNav';

jest.mock('@/i18n/navigation', () => ({
  usePathname: jest.fn(),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('PortalNav', () => {
  it('renders the nav link when not on the login page', () => {
    (usePathname as jest.Mock).mockReturnValue('/dashboard');

    render(
      <PortalNav href="/dashboard" label="Dashboard" loginPath="/login" className="text-sm" />,
    );

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/dashboard');
  });

  it('renders nothing on the login page', () => {
    (usePathname as jest.Mock).mockReturnValue('/login');

    const { container } = render(
      <PortalNav href="/dashboard" label="Dashboard" loginPath="/login" className="text-sm" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
