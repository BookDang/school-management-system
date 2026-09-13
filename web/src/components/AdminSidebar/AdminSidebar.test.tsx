import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname, useRouter } from '@/i18n/navigation';
import { staffApiClient } from '@/lib/apiClient';
import { renderWithIntl } from '../../test-utils/renderWithIntl';
import AdminSidebar from './AdminSidebar';

jest.mock('@/i18n/navigation', () => ({
  usePathname: jest.fn(() => '/admin/dashboard'),
  useRouter: jest.fn(),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
jest.mock('@/lib/apiClient', () => ({
  staffApiClient: { post: jest.fn(), setAccessToken: jest.fn() },
}));
jest.mock('../LanguageSwitcher', () => ({
  __esModule: true,
  default: () => <div>language switcher</div>,
}));

describe('AdminSidebar', () => {
  const replace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ replace });
  });

  it('renders the dashboard nav link and language switcher', () => {
    renderWithIntl(<AdminSidebar />);

    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute(
      'href',
      '/admin/dashboard',
    );
    expect(screen.getByText('language switcher')).toBeInTheDocument();
  });

  it('logs out, clears the access token, and redirects to /admin/login', async () => {
    (staffApiClient.post as jest.Mock).mockResolvedValue({ data: undefined });
    const user = userEvent.setup();
    renderWithIntl(<AdminSidebar />);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      expect(staffApiClient.post).toHaveBeenCalledWith('/auth/staff/logout');
      expect(staffApiClient.setAccessToken).toHaveBeenCalledWith(null);
      expect(replace).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('still clears the session and redirects even when the logout request fails', async () => {
    (staffApiClient.post as jest.Mock).mockRejectedValue(new Error('network error'));
    const user = userEvent.setup();
    renderWithIntl(<AdminSidebar />);

    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      expect(staffApiClient.setAccessToken).toHaveBeenCalledWith(null);
      expect(replace).toHaveBeenCalledWith('/admin/login');
    });
  });

  it('keeps the dashboard nav item active on a nested child route', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/dashboard/widgets/123');

    renderWithIntl(<AdminSidebar />);

    expect(screen.getByRole('menuitem', { name: 'Dashboard' })).toHaveClass(
      'ant-menu-item-selected',
    );
  });

  it('renders nothing on the login page', () => {
    (usePathname as jest.Mock).mockReturnValue('/admin/login');

    const { container } = renderWithIntl(<AdminSidebar />);

    expect(container).toBeEmptyDOMElement();
  });
});
