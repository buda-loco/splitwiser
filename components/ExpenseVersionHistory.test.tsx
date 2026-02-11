import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExpenseVersionHistory } from './ExpenseVersionHistory';
import type { OfflineExpenseVersion } from '@/lib/db/types';

// Mock the db stores
const mockGetExpenseVersions = vi.fn();

vi.mock('@/lib/db/stores', () => ({
  getExpenseVersions: (...args: any[]) => mockGetExpenseVersions(...args),
}));

// Mock formatRelativeTime for predictable output
vi.mock('@/lib/utils/time', () => ({
  formatRelativeTime: (ts: string) => `time:${ts}`,
}));

function makeVersion(overrides: Partial<OfflineExpenseVersion> = {}): OfflineExpenseVersion {
  return {
    id: 'v1',
    expense_id: 'e1',
    version_number: 1,
    changed_by_user_id: 'u1',
    change_type: 'created',
    changes: {
      before: null,
      after: { amount: 25, currency: 'USD', description: 'Lunch' },
    },
    created_at: '2025-01-15T12:00:00Z',
    sync_status: 'pending',
    local_updated_at: '2025-01-15T12:00:00Z',
    ...overrides,
  };
}

describe('ExpenseVersionHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while loading', () => {
    mockGetExpenseVersions.mockReturnValue(new Promise(() => {}));
    const { container } = render(<ExpenseVersionHistory expenseId="e1" />);
    // Component returns null during loading
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when there are no versions', async () => {
    mockGetExpenseVersions.mockResolvedValue([]);
    const { container } = render(<ExpenseVersionHistory expenseId="e1" />);

    await waitFor(() => {
      expect(mockGetExpenseVersions).toHaveBeenCalledWith('e1');
    });

    // Component returns null for empty versions
    expect(container.innerHTML).toBe('');
  });

  it('renders collapsed state with version count', async () => {
    const versions = [
      makeVersion({ id: 'v1', version_number: 2, change_type: 'updated' }),
      makeVersion({ id: 'v2', version_number: 1, change_type: 'created' }),
    ];
    mockGetExpenseVersions.mockResolvedValue(versions);

    render(<ExpenseVersionHistory expenseId="e1" />);

    await waitFor(() => {
      expect(screen.getByText('Version History (2)')).toBeInTheDocument();
    });

    // Version details should NOT be visible in collapsed state
    expect(screen.queryByText('Version 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Version 2')).not.toBeInTheDocument();
  });

  it('expands to show version details when header is clicked', async () => {
    const versions = [
      makeVersion({ id: 'v1', version_number: 2, change_type: 'updated' }),
      makeVersion({ id: 'v2', version_number: 1, change_type: 'created' }),
    ];
    mockGetExpenseVersions.mockResolvedValue(versions);

    render(<ExpenseVersionHistory expenseId="e1" />);

    await waitFor(() => {
      expect(screen.getByText('Version History (2)')).toBeInTheDocument();
    });

    // Click to expand
    fireEvent.click(screen.getByText('Version History (2)'));

    await waitFor(() => {
      expect(screen.getByText('Version 2')).toBeInTheDocument();
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });
  });

  it('collapses when header is clicked again', async () => {
    const versions = [makeVersion()];
    mockGetExpenseVersions.mockResolvedValue(versions);

    render(<ExpenseVersionHistory expenseId="e1" />);

    await waitFor(() => {
      expect(screen.getByText('Version History (1)')).toBeInTheDocument();
    });

    // Expand
    fireEvent.click(screen.getByText('Version History (1)'));
    await waitFor(() => {
      expect(screen.getByText('Version 1')).toBeInTheDocument();
    });

    // Collapse
    fireEvent.click(screen.getByText('Version History (1)'));
    await waitFor(() => {
      expect(screen.queryByText('Version 1')).not.toBeInTheDocument();
    });
  });

  it('displays change_type for each version', async () => {
    const versions = [
      makeVersion({ id: 'v1', version_number: 2, change_type: 'updated' }),
      makeVersion({ id: 'v2', version_number: 1, change_type: 'created' }),
    ];
    mockGetExpenseVersions.mockResolvedValue(versions);

    render(<ExpenseVersionHistory expenseId="e1" />);

    await waitFor(() => {
      expect(screen.getByText('Version History (2)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Version History (2)'));

    await waitFor(() => {
      expect(screen.getByText('updated')).toBeInTheDocument();
      expect(screen.getByText('created')).toBeInTheDocument();
    });
  });

  it('displays formatted relative time for each version', async () => {
    const versions = [
      makeVersion({ id: 'v1', created_at: '2025-01-15T12:00:00Z' }),
    ];
    mockGetExpenseVersions.mockResolvedValue(versions);

    render(<ExpenseVersionHistory expenseId="e1" />);

    await waitFor(() => {
      expect(screen.getByText('Version History (1)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Version History (1)'));

    await waitFor(() => {
      expect(screen.getByText('time:2025-01-15T12:00:00Z')).toBeInTheDocument();
    });
  });

  it('renders "created" version with amount and description', async () => {
    const versions = [
      makeVersion({
        change_type: 'created',
        changes: {
          before: null,
          after: { amount: 50, currency: 'EUR', description: 'Dinner' },
        },
      }),
    ];
    mockGetExpenseVersions.mockResolvedValue(versions);

    render(<ExpenseVersionHistory expenseId="e1" />);

    await waitFor(() => {
      expect(screen.getByText('Version History (1)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Version History (1)'));

    await waitFor(() => {
      // The renderChanges function shows "Amount: 50 EUR" and " . Dinner"
      expect(screen.getByText(/50 EUR/)).toBeInTheDocument();
      expect(screen.getByText(/Dinner/)).toBeInTheDocument();
    });
  });

  it('renders "updated" version showing changed fields', async () => {
    const versions = [
      makeVersion({
        change_type: 'updated',
        version_number: 2,
        changes: {
          before: { amount: 25, description: 'Lunch', category: 'food' },
          after: { amount: 50, description: 'Dinner', category: 'food' },
        },
      }),
    ];
    mockGetExpenseVersions.mockResolvedValue(versions);

    render(<ExpenseVersionHistory expenseId="e1" />);

    await waitFor(() => {
      expect(screen.getByText('Version History (1)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Version History (1)'));

    await waitFor(() => {
      // Should show amount change
      expect(screen.getByText(/25 → 50/)).toBeInTheDocument();
      // Should show description change
      expect(screen.getByText(/"Lunch" → "Dinner"/)).toBeInTheDocument();
    });
  });

  it('does not show category change when category is unchanged', async () => {
    const versions = [
      makeVersion({
        change_type: 'updated',
        version_number: 2,
        changes: {
          before: { amount: 25, description: 'Lunch', category: 'food' },
          after: { amount: 50, description: 'Lunch', category: 'food' },
        },
      }),
    ];
    mockGetExpenseVersions.mockResolvedValue(versions);

    render(<ExpenseVersionHistory expenseId="e1" />);

    await waitFor(() => {
      expect(screen.getByText('Version History (1)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Version History (1)'));

    await waitFor(() => {
      // Only amount changed, category should not be mentioned
      expect(screen.getByText(/25 → 50/)).toBeInTheDocument();
      expect(screen.queryByText(/Category/)).not.toBeInTheDocument();
    });
  });

  it('renders "deleted" version without extra change details', async () => {
    const versions = [
      makeVersion({
        change_type: 'deleted',
        version_number: 3,
        changes: {
          before: { is_deleted: false },
          after: { is_deleted: true },
        },
      }),
    ];
    mockGetExpenseVersions.mockResolvedValue(versions);

    render(<ExpenseVersionHistory expenseId="e1" />);

    await waitFor(() => {
      expect(screen.getByText('Version History (1)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Version History (1)'));

    await waitFor(() => {
      expect(screen.getByText('deleted')).toBeInTheDocument();
      expect(screen.getByText('Version 3')).toBeInTheDocument();
      // No extra change info for deleted
      expect(screen.queryByText(/Amount/)).not.toBeInTheDocument();
    });
  });

  it('calls getExpenseVersions with the correct expenseId', async () => {
    mockGetExpenseVersions.mockResolvedValue([]);

    render(<ExpenseVersionHistory expenseId="my-expense-123" />);

    await waitFor(() => {
      expect(mockGetExpenseVersions).toHaveBeenCalledWith('my-expense-123');
    });
  });

  it('handles category change from null', async () => {
    const versions = [
      makeVersion({
        change_type: 'updated',
        version_number: 2,
        changes: {
          before: { amount: 25, description: 'Lunch', category: null },
          after: { amount: 25, description: 'Lunch', category: 'food' },
        },
      }),
    ];
    mockGetExpenseVersions.mockResolvedValue(versions);

    render(<ExpenseVersionHistory expenseId="e1" />);

    await waitFor(() => {
      expect(screen.getByText('Version History (1)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Version History (1)'));

    await waitFor(() => {
      expect(screen.getByText(/Category: None → food/)).toBeInTheDocument();
    });
  });
});
