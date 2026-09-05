import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('renders the title, fields, and password hint', () => {
    render(
      <LoginForm title="Sign in to School Portal" onSubmit={jest.fn()} isSubmitting={false} />,
    );

    expect(screen.getByText('Sign in to School Portal')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByText(/8-20 characters/i)).toBeInTheDocument();
  });

  it('shows validation errors and does not submit when the fields are invalid', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<LoginForm title="Sign in" onSubmit={onSubmit} isSubmitting={false} />);

    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText(/Enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/Must be at least 8 characters/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the entered values when the form is valid', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    render(<LoginForm title="Sign in" onSubmit={onSubmit} isSubmitting={false} />);

    await user.type(screen.getByLabelText(/Email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/Password/i), 'Abcdefg1!');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { email: 'jane@example.com', password: 'Abcdefg1!' },
        undefined,
      );
    });
  });

  it('shows the errorMessage prop when set', () => {
    render(
      <LoginForm
        title="Sign in"
        onSubmit={jest.fn()}
        isSubmitting={false}
        errorMessage="Invalid email or password"
      />,
    );

    expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
  });

  it('shows a loading indicator on the submit button while isSubmitting is true', () => {
    render(<LoginForm title="Sign in" onSubmit={jest.fn()} isSubmitting={true} />);

    expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();
  });
});
