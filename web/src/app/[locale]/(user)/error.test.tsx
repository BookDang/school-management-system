import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '../../../test-utils/renderWithIntl';
import UserErrorPage from './error';

jest.mock('@/i18n/navigation', () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('UserErrorPage', () => {
  const error = Object.assign(new Error('boom'), { digest: 'abc123' });

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders an error message, logs it, and offers retry and home actions', async () => {
    const reset = jest.fn();
    const user = userEvent.setup();
    renderWithIntl(<UserErrorPage error={error} reset={reset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(console.error).toHaveBeenCalledWith(error);
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
    expect(screen.getByText('abc123')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(reset).toHaveBeenCalled();
  });

  it('shows the API status code when the error came from a thrown query error', () => {
    const apiError = Object.assign(new Error('Internal server error'), { status: 500 });
    renderWithIntl(<UserErrorPage error={apiError} reset={jest.fn()} />);

    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('omits the error code line when the error has neither status nor digest', () => {
    const { container } = renderWithIntl(
      <UserErrorPage error={new Error('boom')} reset={jest.fn()} />,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(container.querySelector('.font-mono')).not.toBeInTheDocument();
  });

  it('shows an access-denied message with no retry button for a 403', () => {
    const forbiddenError = Object.assign(new Error('Forbidden'), { status: 403 });
    renderWithIntl(<UserErrorPage error={forbiddenError} reset={jest.fn()} />);

    expect(screen.getByText('Access denied')).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/');
  });
});
