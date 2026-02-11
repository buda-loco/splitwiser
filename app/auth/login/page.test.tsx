import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Supabase client
const mockSignInWithOtp = vi.fn();

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
    },
  }),
}));

import LoginPage from './page';

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithOtp.mockResolvedValue({ error: null });
  });

  it('renders the login form with title and subtitle', () => {
    render(<LoginPage />);

    expect(screen.getByText('Welcome to Splitwiser')).toBeInTheDocument();
    expect(screen.getByText('Enter your email to receive a magic link')).toBeInTheDocument();
  });

  it('renders email input with placeholder', () => {
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('renders email input with accessible label', () => {
    render(<LoginPage />);

    const emailInput = screen.getByLabelText('Email address');
    expect(emailInput).toBeInTheDocument();
  });

  it('renders send magic link button', () => {
    render(<LoginPage />);

    const button = screen.getByRole('button', { name: 'Send Magic Link' });
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
  });

  it('updates email input value on typing', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'test@example.com');

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('shows error for empty email submission', async () => {
    render(<LoginPage />);

    const button = screen.getByRole('button', { name: 'Send Magic Link' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
    });
  });

  it('shows error for email without @ symbol', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'invalidemail');

    // Use fireEvent.submit to bypass jsdom's built-in email input validation
    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Please enter a valid email address');
    });
  });

  it('calls Supabase signInWithOtp on valid email submission', async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: 'Send Magic Link' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
        options: {
          emailRedirectTo: expect.stringContaining('/auth/callback'),
        },
      });
    });
  });

  it('shows success message after successful submission', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: 'Send Magic Link' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Check your email for the magic link');
    });
  });

  it('clears email input after successful submission', async () => {
    mockSignInWithOtp.mockResolvedValue({ error: null });

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: 'Send Magic Link' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(emailInput).toHaveValue('');
    });
  });

  it('shows error message when Supabase returns auth error', async () => {
    mockSignInWithOtp.mockResolvedValue({
      error: { message: 'Rate limit exceeded' },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: 'Send Magic Link' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Rate limit exceeded');
    });
  });

  it('shows generic error when Supabase throws', async () => {
    mockSignInWithOtp.mockRejectedValue(new Error('Network failure'));

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: 'Send Magic Link' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('An unexpected error occurred. Please try again.');
    });
  });

  it('shows "Sending..." text while loading', async () => {
    // Make the OTP call hang to keep loading state
    mockSignInWithOtp.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: 'Send Magic Link' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Sending...')).toBeInTheDocument();
    });
  });

  it('disables button and input while loading', async () => {
    mockSignInWithOtp.mockReturnValue(new Promise(() => {}));

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: 'Send Magic Link' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Sending...').closest('button')).toBeDisabled();
      expect(emailInput).toBeDisabled();
    });
  });

  it('does not show success or error messages initially', () => {
    render(<LoginPage />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('clears previous error on new submission', async () => {
    // First submission fails
    mockSignInWithOtp.mockResolvedValueOnce({
      error: { message: 'First error' },
    });

    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByPlaceholderText('you@example.com');
    await user.type(emailInput, 'test@example.com');

    const button = screen.getByRole('button', { name: 'Send Magic Link' });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('First error');
    });

    // Second submission succeeds
    mockSignInWithOtp.mockResolvedValueOnce({ error: null });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument();
    });
  });
});
