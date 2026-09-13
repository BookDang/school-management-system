import { screen } from '@testing-library/react';
import { usePathname } from '@/i18n/navigation';
import { renderWithIntl } from '../../test-utils/renderWithIntl';
import AdminBreadcrumb from './AdminBreadcrumb';

jest.mock('@/i18n/navigation', () => ({
  usePathname: jest.fn(),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('AdminBreadcrumb', () => {
  it('renders only the brand crumb (as text, not a link) on the dashboard root', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard');

    renderWithIntl(<AdminBreadcrumb />);

    expect(screen.getByText('Admin Portal')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('links the brand and mapped-segment crumbs back to the dashboard for a nested route', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard/widgets');

    renderWithIntl(<AdminBreadcrumb />);

    expect(screen.getByRole('link', { name: 'Admin Portal' })).toHaveAttribute(
      'href',
      '/admin/dashboard',
    );
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/admin/dashboard',
    );
    expect(screen.getByText('Widgets')).toBeInTheDocument();
  });

  it('keeps a nested trail active with intermediate segments as links and the last as plain text', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/classes/123/edit');

    renderWithIntl(<AdminBreadcrumb />);

    expect(screen.getByRole('link', { name: 'Classes' })).toHaveAttribute('href', '/admin/classes');
    expect(screen.getByRole('link', { name: '123' })).toHaveAttribute('href', '/admin/classes/123');
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Edit' })).not.toBeInTheDocument();
  });

  it('renders nothing on the login page', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/login');

    const { container } = renderWithIntl(<AdminBreadcrumb />);

    expect(container).toBeEmptyDOMElement();
  });
});
