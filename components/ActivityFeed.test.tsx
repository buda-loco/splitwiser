import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityFeed } from './ActivityFeed';

// Mock the db stores
const mockGetRecentExpenseChanges = vi.fn();
const mockGetExpense = vi.fn();

vi.mock('@/lib/db/stores', () => ({
  getRecentExpenseChanges: (...args: any[]) => mockGetRecentExpenseChanges(...args),
  getExpense: (...args: any[]) => mockGetExpense(...args),
}));

// Mock formatRelativeTime to return predictable values
vi.mock('@/lib/utils/time', () => ({
  formatRelativeTime: (ts: string) => `time:${ts}`,
}));

// Helper to build version fixtures
function makeVersion(overrides: Record<string, any> = {}) {
  return {
    id: 'v1',
    expense_id: 'e1',
    version_number: 1,
    changed_by_user_id: 'u1',
    change_type: 'created',
    changes: { before: null, after: { amount: 25, currency: 'USD', description: 'Lunch' } },
    created_at: new Date().toISOString(),
    sync_status: 'pending',
    local_updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeExpense(overrides: Record<string, any> = {}) {
  return {
    id: 'e1',
    amount: 25,
    currency: 'USD',
    description: 'Lunch',
    category: 'food',
    expense_date: new Date().toISOString(),
    paid_by_user_id: 'u1',
    created_by_user_id: 'u1',
    is_deleted: false,
    version: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    sync_status: 'pending',
    local_updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    // Make the mock never resolve during this test
    mockGetRecentExpenseChanges.mockReturnValue(new Promise(() => {}));
    render(<ActivityFeed />);
    expect(screen.getByText('Loading activity...')).toBeInTheDocument();
  });

  it('shows empty state when there are no activity items', async () => {
    mockGetRecentExpenseChanges.mockResolvedValue([]);
    render(<ActivityFeed />);
    await waitFor(() => {
      expect(screen.getByText('No activity yet')).toBeInTheDocument();
    });
  });

  it('renders activity items with expense details', async () => {
    const version = makeVersion();
    const expense = makeExpense();

    mockGetRecentExpenseChanges.mockResolvedValue([version]);
    mockGetExpense.mockResolvedValue(expense);

    render(<ActivityFeed />);

    await waitFor(() => {
      expect(screen.getByText('created')).toBeInTheDocument();
      expect(screen.getByText('Lunch')).toBeInTheDocument();
      expect(screen.getByText('25 USD')).toBeInTheDocument();
    });
  });

  it('shows "Deleted expense" when expense is null', async () => {
    const version = makeVersion({ change_type: 'deleted' });
    mockGetRecentExpenseChanges.mockResolvedValue([version]);
    mockGetExpense.mockResolvedValue(null);

    render(<ActivityFeed />);

    await waitFor(() => {
      expect(screen.getByText('Deleted expense')).toBeInTheDocument();
    });
  });

  it('renders filter tabs', async () => {
    const version = makeVersion();
    const expense = makeExpense();
    mockGetRecentExpenseChanges.mockResolvedValue([version]);
    mockGetExpense.mockResolvedValue(expense);

    render(<ActivityFeed />);

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
      expect(screen.getByText('Last 30 days')).toBeInTheDocument();
    });
  });

  it('highlights the active filter tab', async () => {
    const version = makeVersion();
    const expense = makeExpense();
    mockGetRecentExpenseChanges.mockResolvedValue([version]);
    mockGetExpense.mockResolvedValue(expense);

    render(<ActivityFeed />);

    await waitFor(() => {
      const allBtn = screen.getByText('All');
      expect(allBtn.className).toContain('bg-ios-blue');
    });
  });

  it('switches filter when a tab is clicked', async () => {
    const version = makeVersion();
    const expense = makeExpense();
    mockGetRecentExpenseChanges.mockResolvedValue([version]);
    mockGetExpense.mockResolvedValue(expense);

    render(<ActivityFeed />);

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    // Click '7 days' tab
    fireEvent.click(screen.getByText('Last 7 days'));

    await waitFor(() => {
      const btn7d = screen.getByText('Last 7 days');
      expect(btn7d.className).toContain('bg-ios-blue');
    });
  });

  it('filters out old items when 7d filter is active', async () => {
    const recentVersion = makeVersion({
      id: 'v-recent',
      expense_id: 'e-recent',
      created_at: new Date().toISOString(), // now
    });
    const oldVersion = makeVersion({
      id: 'v-old',
      expense_id: 'e-old',
      created_at: new Date(Date.now() - 10 * 86400000).toISOString(), // 10 days ago
    });

    const recentExpense = makeExpense({ id: 'e-recent', description: 'Recent Lunch' });
    const oldExpense = makeExpense({ id: 'e-old', description: 'Old Lunch' });

    mockGetRecentExpenseChanges.mockResolvedValue([recentVersion, oldVersion]);
    mockGetExpense.mockImplementation((id: string) => {
      if (id === 'e-recent') return Promise.resolve(recentExpense);
      if (id === 'e-old') return Promise.resolve(oldExpense);
      return Promise.resolve(null);
    });

    render(<ActivityFeed />);

    // Wait for initial 'all' load
    await waitFor(() => {
      expect(screen.getByText('Recent Lunch')).toBeInTheDocument();
      expect(screen.getByText('Old Lunch')).toBeInTheDocument();
    });

    // Click 7d filter
    fireEvent.click(screen.getByText('Last 7 days'));

    await waitFor(() => {
      expect(screen.getByText('Recent Lunch')).toBeInTheDocument();
    });
    // Old item should be gone, which means either it's filtered out or we see empty state
    // Since Old Lunch is 10 days old, it should be filtered for 7d
    await waitFor(() => {
      expect(screen.queryByText('Old Lunch')).not.toBeInTheDocument();
    });
  });

  it('renders change summary for "created" change type', async () => {
    const version = makeVersion({
      change_type: 'created',
      changes: { before: null, after: { amount: 50, currency: 'EUR' } },
    });
    const expense = makeExpense();
    mockGetRecentExpenseChanges.mockResolvedValue([version]);
    mockGetExpense.mockResolvedValue(expense);

    render(<ActivityFeed />);

    await waitFor(() => {
      expect(screen.getByText('Created new expense')).toBeInTheDocument();
    });
  });

  it('renders change summary for "updated" change type showing changed fields', async () => {
    const version = makeVersion({
      change_type: 'updated',
      changes: {
        before: { amount: 25, description: 'Lunch', category: 'food' },
        after: { amount: 50, description: 'Dinner', category: 'food' },
      },
    });
    const expense = makeExpense({ description: 'Dinner', amount: 50 });
    mockGetRecentExpenseChanges.mockResolvedValue([version]);
    mockGetExpense.mockResolvedValue(expense);

    render(<ActivityFeed />);

    await waitFor(() => {
      expect(screen.getByText('Changed: amount, description')).toBeInTheDocument();
    });
  });

  it('displays formatted relative time', async () => {
    const ts = '2025-01-01T12:00:00Z';
    const version = makeVersion({ created_at: ts });
    const expense = makeExpense();
    mockGetRecentExpenseChanges.mockResolvedValue([version]);
    mockGetExpense.mockResolvedValue(expense);

    render(<ActivityFeed />);

    await waitFor(() => {
      expect(screen.getByText(`time:${ts}`)).toBeInTheDocument();
    });
  });

  it('applies color classes based on change_type', async () => {
    const version = makeVersion({ change_type: 'deleted' });
    const expense = makeExpense();
    mockGetRecentExpenseChanges.mockResolvedValue([version]);
    mockGetExpense.mockResolvedValue(expense);

    render(<ActivityFeed />);

    await waitFor(() => {
      const badge = screen.getByText('deleted');
      expect(badge.className).toContain('text-ios-red');
    });
  });
});
