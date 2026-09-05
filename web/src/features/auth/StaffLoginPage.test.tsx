import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { setAccessToken } from '@/lib/apiClient';
import { useStaffLogin } from './mutations';
import StaffLoginPage from './StaffLoginPage';

jest.mock('next/navigation', () => ({ useRouter: jest.fn() }));
jest.mock('./mutations', () => ({ useStaffLogin: jest.fn() }));
jest.mock('@/lib/apiClient', () => ({ setAccessToken: jest.fn() }));

describe('StaffLoginPage', () => {
  const push = jest.fn();
  const mutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (useStaffLogin as jest.Mock).mockReturnValue({ mutateAsync, isPending: false });
  });

  it('stores the access token and redirects to /admin/dashboard on success', async () => {
    mutateAsync.mockResolvedValue({
      accessToken: 'token-456',
      user: { id: '1', email: 'admin@example.com', fullName: 'Admin', role: 'admin' },
    });
    const user = userEvent.setup();
    render(<StaffLoginPage />);

    await user.type(screen.getByLabelText(/Email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'Abcdefg1!');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(setAccessToken).toHaveBeenCalledWith('token-456');
      expect(push).toHaveBeenCalledWith('/admin/dashboard');
    });
  });

  it('shows an error message on failure and does not redirect', async () => {
    mutateAsync.mockRejectedValue({ status: 401, message: 'Invalid email or password' });
    const user = userEvent.setup();
    render(<StaffLoginPage />);

    await user.type(screen.getByLabelText(/Email/i), 'admin@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'Abcdefg1!');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
