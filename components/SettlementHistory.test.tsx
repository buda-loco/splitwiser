import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import type { Settlement } from '@/lib/db/types';

// Mock useSettlements hook
const mockRefetch = vi.fn();
let mockSettlements: Settlement[] = [];
let mockLoading = false;

vi.mock('@/hooks/useSettlements', () => ({
  useSettlements: () => ({
    settlements: mockSettlements,
    loading: mockLoading,
    refetch: mockRefetch,
  }),
}));

// Mock db/stores
const mockDeleteSettlement = vi.fn();

vi.mock('@/lib/db/stores', () => ({
  deleteSettlement: (...args: unknown[]) => mockDeleteSettlement(...args),
}));

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Wallet: ({ className }: { className?: string }) => (
    <div data-testid="wallet-icon" className={className}>Wallet Icon</div>
  ),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock display-name to return predictable names
vi.mock('@/lib/utils/display-name', () => ({
  getParticipantDisplayName: (p: { user_id?: string | null; participant_id?: string | null; name?: string | null }) => {
    if (p.user_id === 'alice-id') return 'Alice';
    if (p.user_id === 'bob-id') return 'Bob';
    if (p.participant_id === 'charlie-id') return 'Charlie';
    return 'Unknown';
  },
}));

import { SettlementHistory } from './SettlementHistory';

function makeSettlement(overrides: Partial<Settlement> = {}): Settlement {
  const now = new Date();
  return {
    id: 'settle-1',
    from_user_id: 'alice-id',
    from_participant_id: null,
    to_user_id: 'bob-id',
    to_participant_id: null,
    amount: 50.00,
    currency: 'AUD',
    settlement_type: 'global',
    tag: null,
    settlement_date: now.toISOString(),
    created_by_user_id: 'alice-id',
    created_at: now.toISOString(),
    ...overrides,
  };
}

describe('SettlementHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettlements = [];
    mockLoading = false;
    mockRefetch.mockResolvedValue(undefined);
    mockDeleteSettlement.mockResolvedValue(true);
  });

  it('renders loading skeleton when loading', () => {
    mockLoading = true;

    render(<SettlementHistory />);

    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders empty state with wallet icon when no settlements', () => {
    mockLoading = false;
    mockSettlements = [];

    render(<SettlementHistory />);

    expect(screen.getByText('No settlements yet')).toBeInTheDocument();
    expect(screen.getByText('Settlements you record will appear here')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-icon')).toBeInTheDocument();
  });

  it('renders settlement items grouped by date', () => {
    const settlement = makeSettlement();
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    // Should show "Today" group header
    expect(screen.getByText('Today')).toBeInTheDocument();

    // Should show the settlement row
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/AUD 50.00/)).toBeInTheDocument();
  });

  it('renders settlement type badge', () => {
    const settlement = makeSettlement({ settlement_type: 'global' });
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    expect(screen.getByText('Global')).toBeInTheDocument();
  });

  it('renders tag-specific badge with tag name', () => {
    const settlement = makeSettlement({
      settlement_type: 'tag_specific',
      tag: 'vacation',
    });
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    expect(screen.getByText('Tag')).toBeInTheDocument();
    expect(screen.getByText('#vacation')).toBeInTheDocument();
  });

  it('renders partial badge', () => {
    const settlement = makeSettlement({ settlement_type: 'partial' });
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    expect(screen.getByText('Partial')).toBeInTheDocument();
  });

  it('expands settlement detail on click', () => {
    const settlement = makeSettlement();
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    // Click on the settlement row (the title "Alice -> Bob")
    const row = screen.getByText(/Alice/);
    fireEvent.click(row);

    // Should show expanded details
    expect(screen.getByText('Global settlement')).toBeInTheDocument();
    expect(screen.getByText('Delete Settlement')).toBeInTheDocument();
  });

  it('toggles expanded state: clicking a second settlement collapses the first', () => {
    const now = new Date();
    const settlement1 = makeSettlement({ id: 's1', amount: 50 });
    const settlement2 = makeSettlement({
      id: 's2',
      amount: 75,
      from_user_id: 'bob-id',
      to_user_id: 'alice-id',
    });
    mockSettlements = [settlement1, settlement2];

    render(<SettlementHistory />);

    // Expand first settlement
    const firstTitle = screen.getByText('Alice \u2192 Bob');
    fireEvent.click(firstTitle);
    expect(screen.getByText('Global settlement')).toBeInTheDocument();

    // Now click the second settlement row which should collapse the first and expand the second
    const secondTitle = screen.getByText('Bob \u2192 Alice');
    fireEvent.click(secondTitle);

    // Second should now be expanded - there's still "Global settlement" from the second one
    // But the expandedId changed, so only the second is expanded
    expect(screen.getByText('Global settlement')).toBeInTheDocument();
  });

  it('shows settlement type text in expanded view for global', () => {
    const settlement = makeSettlement({ settlement_type: 'global' });
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    fireEvent.click(screen.getByText(/Alice/));

    expect(screen.getByText('Global settlement')).toBeInTheDocument();
  });

  it('shows settlement type text for tag_specific in expanded view', () => {
    const settlement = makeSettlement({
      settlement_type: 'tag_specific',
      tag: 'trip',
    });
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    fireEvent.click(screen.getByText(/Alice/));

    expect(screen.getByText('Tag-specific settlement for #trip')).toBeInTheDocument();
  });

  it('shows settlement type text for partial in expanded view', () => {
    const settlement = makeSettlement({ settlement_type: 'partial' });
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    fireEvent.click(screen.getByText(/Alice/));

    expect(screen.getByText('Partial payment')).toBeInTheDocument();
  });

  it('shows From and To names in expanded view', () => {
    const settlement = makeSettlement();
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    fireEvent.click(screen.getByText(/Alice/));

    // There should be a "From" label and "To" label
    expect(screen.getByText('From')).toBeInTheDocument();
    expect(screen.getByText('To')).toBeInTheDocument();
  });

  it('shows delete confirmation dialog when delete button clicked', () => {
    const settlement = makeSettlement();
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    // Expand
    fireEvent.click(screen.getByText(/Alice/));

    // Click delete
    fireEvent.click(screen.getByText('Delete Settlement'));

    // Should show confirmation dialog
    expect(screen.getByText('Delete Settlement?')).toBeInTheDocument();
    expect(screen.getByText(/This will remove this AUD 50.00 settlement/)).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    // The confirm Delete button is in the dialog
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('cancels delete confirmation on Cancel click', () => {
    const settlement = makeSettlement();
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    // Expand
    fireEvent.click(screen.getByText(/Alice/));

    // Click delete to show dialog
    fireEvent.click(screen.getByText('Delete Settlement'));
    expect(screen.getByText('Delete Settlement?')).toBeInTheDocument();

    // Cancel
    fireEvent.click(screen.getByText('Cancel'));

    // Dialog should disappear
    expect(screen.queryByText('Delete Settlement?')).not.toBeInTheDocument();
  });

  it('calls deleteSettlement and refetch on confirming delete', async () => {
    const settlement = makeSettlement({ id: 'settle-to-delete' });
    mockSettlements = [settlement];
    mockDeleteSettlement.mockResolvedValue(true);

    render(<SettlementHistory />);

    // Expand
    fireEvent.click(screen.getByText(/Alice/));

    // Click delete button to show dialog
    fireEvent.click(screen.getByText('Delete Settlement'));

    // Confirm delete
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(mockDeleteSettlement).toHaveBeenCalledWith('settle-to-delete');
    });

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  it('shows error message when delete fails', async () => {
    const settlement = makeSettlement();
    mockSettlements = [settlement];
    mockDeleteSettlement.mockResolvedValue(false);

    render(<SettlementHistory />);

    // Expand and open delete dialog
    fireEvent.click(screen.getByText(/Alice/));
    fireEvent.click(screen.getByText('Delete Settlement'));

    // Confirm delete
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText('Failed to delete settlement')).toBeInTheDocument();
    });
  });

  it('shows error message when delete throws', async () => {
    const settlement = makeSettlement();
    mockSettlements = [settlement];
    mockDeleteSettlement.mockRejectedValue(new Error('Network error'));

    render(<SettlementHistory />);

    // Expand and open delete dialog
    fireEvent.click(screen.getByText(/Alice/));
    fireEvent.click(screen.getByText('Delete Settlement'));

    // Confirm delete
    fireEvent.click(screen.getByText('Delete'));

    await waitFor(() => {
      expect(screen.getByText('Failed to delete settlement')).toBeInTheDocument();
    });
  });

  it('groups settlements into correct date groups', () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const todaySettlement = makeSettlement({
      id: 'today',
      settlement_date: now.toISOString(),
    });
    const yesterdaySettlement = makeSettlement({
      id: 'yesterday',
      settlement_date: yesterday.toISOString(),
    });

    mockSettlements = [todaySettlement, yesterdaySettlement];

    render(<SettlementHistory />);

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Yesterday')).toBeInTheDocument();
  });

  it('renders amount with currency in expanded view', () => {
    const settlement = makeSettlement({ amount: 123.45, currency: 'USD' });
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    // Expand
    fireEvent.click(screen.getByText(/Alice/));

    // The amount appears in both the list row and expanded detail, so use getAllByText
    const amountElements = screen.getAllByText('USD 123.45');
    expect(amountElements.length).toBeGreaterThanOrEqual(2);
  });

  it('shows "Settlement Date" label in expanded view', () => {
    const settlement = makeSettlement();
    mockSettlements = [settlement];

    render(<SettlementHistory />);

    fireEvent.click(screen.getByText(/Alice/));

    expect(screen.getByText('Settlement Date')).toBeInTheDocument();
  });
});
