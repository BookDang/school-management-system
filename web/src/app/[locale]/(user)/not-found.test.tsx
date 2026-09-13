import { screen } from '@testing-library/react';
import { renderWithIntl } from '../../../test-utils/renderWithIntl';
import UserNotFoundPage from './not-found';

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('UserNotFoundPage', () => {
  it('renders a 404 message with a link back home', () => {
    renderWithIntl(<UserNotFoundPage />);

    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('404')).toBeInTheDocument();
  });
});
