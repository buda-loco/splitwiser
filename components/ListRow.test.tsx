import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ListRow } from './ListRow';

// Mock next/link to render a plain anchor
vi.mock('next/link', () => ({
  default: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

describe('ListRow', () => {
  it('renders the title', () => {
    render(<ListRow title="Dinner" />);
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('renders subtitle when provided as a string', () => {
    render(<ListRow title="Dinner" subtitle="Last night" />);
    expect(screen.getByText('Last night')).toBeInTheDocument();
  });

  it('renders subtitle when provided as ReactNode', () => {
    render(<ListRow title="Dinner" subtitle={<em>Custom subtitle</em>} />);
    expect(screen.getByText('Custom subtitle')).toBeInTheDocument();
  });

  it('does not render subtitle when not provided', () => {
    const { container } = render(<ListRow title="Dinner" />);
    // The subtitle wrapper div should not be present
    expect(container.querySelector('.text-sm.text-ios-gray')).not.toBeInTheDocument();
  });

  it('renders value when provided as a string', () => {
    render(<ListRow title="Dinner" value="$25.00" />);
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });

  it('renders value when provided as ReactNode', () => {
    render(<ListRow title="Dinner" value={<strong>$25.00</strong>} />);
    expect(screen.getByText('$25.00')).toBeInTheDocument();
  });

  it('shows chevron when showChevron is true', () => {
    render(<ListRow title="Dinner" showChevron />);
    expect(screen.getByText('›')).toBeInTheDocument();
  });

  it('does not show chevron by default', () => {
    render(<ListRow title="Dinner" />);
    expect(screen.queryByText('›')).not.toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<ListRow title="Dinner" onClick={handleClick} />);

    // The motion.div wraps the content and has the onClick
    fireEvent.click(screen.getByText('Dinner'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders as a link when href is provided', () => {
    render(<ListRow title="Dinner" href="/expenses/123" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/expenses/123');
  });

  it('renders left icon when provided', () => {
    render(<ListRow title="Dinner" leftIcon={<span data-testid="icon">IC</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<ListRow title="Dinner" className="custom-class" />);
    // The outermost div should have the custom class
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('applies cursor-pointer class when interactive (onClick)', () => {
    const { container } = render(<ListRow title="Dinner" onClick={() => {}} />);
    expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
  });

  it('applies cursor-pointer class when interactive (href)', () => {
    const { container } = render(<ListRow title="Dinner" href="/test" />);
    expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
  });

  it('does not apply cursor-pointer class when non-interactive', () => {
    const { container } = render(<ListRow title="Dinner" />);
    expect(container.querySelector('.cursor-pointer')).not.toBeInTheDocument();
  });
});
