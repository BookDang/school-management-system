import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../../test-utils/renderWithIntl';
import AdminNotFoundPage from './not-found';

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('AdminNotFoundPage', () => {
  it('renders a 404 message with a link back to the dashboard', () => {
    renderWithIntl(<AdminNotFoundPage />);

    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to dashboard' })).toHaveAttribute(
      'href',
      '/admin/dashboard',
    );
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});
