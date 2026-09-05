import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { setAccessToken } from '@/lib/apiClient';
import LoginPage from './LoginPage';
import { useLogin } from './mutations';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('./mutations', () => ({ useLogin: jest.fn() }));
jest.mock('@/lib/apiClient', () => ({ setAccessToken: jest.fn() }));

describe('LoginPage', () => {
  const push = jest.fn();
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (useLogin as jest.Mock).mockReturnValue({ mutateAsync, isPending: false });
  });

  it('stores the access token and redirects to /dashboard on success', async () => {
    mutateAsync.mockResolvedValue({
      accessToken: 'token-123',
      user: { id: '1', email: 'jane@example.com', fullName: 'Jane', role: 'student' },
    });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/Email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'Abcdefg1!');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(setAccessToken).toHaveBeenCalledWith('token-123');
      expect(push).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('shows an error message on failure and does not redirect', async () => {
    mutateAsync.mockRejectedValue({ status: 401, message: 'Invalid email or password' });
    const user = userEvent.setup();
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/Email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'Abcdefg1!');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
