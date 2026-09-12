import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithIntl } from '../../test-utils/renderWithIntl';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('renders the title and fields', () => {
    renderWithIntl(
      <LoginForm title="Sign in to School Portal" onSubmit={jest.fn()} isSubmitting={false} />,
    );

    expect(screen.getByText('Sign in to School Portal')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i, { selector: 'input' })).toBeInTheDocument();
  });

  it('shows the password requirements as a list in a tooltip on hover', async () => {
    const user = userEvent.setup();
    renderWithIntl(<LoginForm title="Sign in" onSubmit={jest.fn()} isSubmitting={false} />);

    expect(screen.queryByText(/Must be at least 8 characters/i)).not.toBeInTheDocument();

    await user.hover(screen.getByLabelText(/password requirements/i));

    expect(await screen.findByText(/Must be at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Must be at most 20 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Must contain at least 1 uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/Must contain at least 1 lowercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/Must contain at least 1 number/i)).toBeInTheDocument();
    expect(screen.getByText(/Must contain at least 1 special character/i)).toBeInTheDocument();
  });

  it('shows validation errors and does not submit when the fields are invalid', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    renderWithIntl(<LoginForm title="Sign in" onSubmit={onSubmit} isSubmitting={false} />);

    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    expect(await screen.findByText(/Enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/Must be at least 8 characters/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the entered values when the form is valid', async () => {
    const onSubmit = jest.fn();
    const user = userEvent.setup();
    renderWithIntl(<LoginForm title="Sign in" onSubmit={onSubmit} isSubmitting={false} />);

    await user.type(screen.getByLabelText(/Email/i), 'jane@example.com');
    await user.type(screen.getByLabelText(/Password/i, { selector: 'input' }), 'Abcdefg1!');
    await user.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        { email: 'jane@example.com', password: 'Abcdefg1!' },
        undefined,
      );
    });
  });

  it('shows the errorMessage prop when set', () => {
    renderWithIntl(
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
    renderWithIntl(<LoginForm title="Sign in" onSubmit={jest.fn()} isSubmitting={true} />);

    expect(screen.getByRole('img', { name: /loading/i })).toBeInTheDocument();
  });
});
