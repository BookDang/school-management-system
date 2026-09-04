import { render, screen } from '@testing-library/react';
import HomePage from './HomePage';

describe('HomePage', () => {
  it('renders the getting-started heading', () => {
    render(<HomePage />);

    expect(screen.getByText(/To get started, edit the/i)).toBeInTheDocument();
  });

  it('renders a Deploy Now link', () => {
    render(<HomePage />);

    expect(screen.getByRole('link', { name: /Deploy Now/i })).toBeInTheDocument();
  });
});
