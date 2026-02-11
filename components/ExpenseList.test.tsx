import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock db/stores — must be before component import
const mockGetExpenses = vi.fn();
const mockGetExpenseParticipants = vi.fn();
const mockGetAllTags = vi.fn();
const mockGetExpenseTags = vi.fn();

vi.mock('@/lib/db/stores', () => ({
  getExpenses: (...args: unknown[]) => mockGetExpenses(...args),
  getExpenseParticipants: (...args: unknown[]) => mockGetExpenseParticipants(...args),
  getAllTags: (...args: unknown[]) => mockGetAllTags(...args),
  getExpenseTags: (...args: unknown[]) => mockGetExpenseTags(...args),
}));

// Mock next/link (ListRow uses it)
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { ExpenseList } from './ExpenseList';

const mockPush = vi.fn();
vi.mock('next/navigation', async () => {
  return {
    useRouter: () => ({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  };
});

function makeExpense(overrides: Record<string, unknown> = {}) {
  return {
    id: 'exp-1',
    amount: 42.5,
    currency: 'AUD',
    description: 'Test Dinner',
    category: 'Food',
    expense_date: '2025-01-15T00:00:00Z',
    paid_by_user_id: 'user-1',
    created_by_user_id: 'user-1',
    is_deleted: false,
    version: 1,
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
    deleted_at: null,
    sync_status: 'pending' as const,
    local_updated_at: '2025-01-15T00:00:00Z',
    ...overrides,
  };
}

describe('ExpenseList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllTags.mockResolvedValue([]);
    mockGetExpenses.mockResolvedValue([]);
    mockGetExpenseParticipants.mockResolvedValue([]);
    mockGetExpenseTags.mockResolvedValue([]);
  });

  it('renders loading skeleton initially', () => {
    // Make getExpenses hang so loading stays true
    mockGetExpenses.mockReturnValue(new Promise(() => {}));
    render(<ExpenseList />);

    // The loading skeleton has animate-pulse divs
    const pulseElements = document.querySelectorAll('.animate-pulse');
    expect(pulseElements.length).toBeGreaterThan(0);
  });

  it('renders empty state when no expenses exist', async () => {
    mockGetExpenses.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText(/No expenses yet/i)).toBeInTheDocument();
    });
  });

  it('renders expense items after loading', async () => {
    const expense = makeExpense();
    mockGetExpenses.mockResolvedValue([expense]);
    mockGetExpenseParticipants.mockResolvedValue([]);
    mockGetExpenseTags.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('Test Dinner')).toBeInTheDocument();
    });

    expect(screen.getByText('$42.50')).toBeInTheDocument();
  });

  it('renders expense with category and date in subtitle', async () => {
    const expense = makeExpense({ category: 'Food', expense_date: '2025-06-10T00:00:00Z' });
    mockGetExpenses.mockResolvedValue([expense]);
    mockGetExpenseParticipants.mockResolvedValue([]);
    mockGetExpenseTags.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('Test Dinner')).toBeInTheDocument();
    });

    // The subtitle contains "Food" and a date
    const subtitleText = screen.getByText(/Food/);
    expect(subtitleText).toBeInTheDocument();
  });

  it('shows expense count text', async () => {
    const expenses = [
      makeExpense({ id: 'exp-1', description: 'Dinner' }),
      makeExpense({ id: 'exp-2', description: 'Lunch', amount: 15 }),
    ];
    mockGetExpenses.mockResolvedValue(expenses);
    mockGetExpenseParticipants.mockResolvedValue([]);
    mockGetExpenseTags.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('Showing 2 expenses')).toBeInTheDocument();
    });
  });

  it('renders filter tabs and filters by 7 days', async () => {
    mockGetExpenses.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const sevenDaysBtn = screen.getByText('Last 7 days');
    expect(sevenDaysBtn).toBeInTheDocument();

    fireEvent.click(sevenDaysBtn);

    // getExpenses should be called again with a startDate
    await waitFor(() => {
      expect(mockGetExpenses).toHaveBeenCalledTimes(2);
      const lastCall = mockGetExpenses.mock.calls[1][0];
      expect(lastCall).toHaveProperty('startDate');
    });
  });

  it('renders filter tabs and filters by 30 days', async () => {
    mockGetExpenses.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('All')).toBeInTheDocument();
    });

    const thirtyDaysBtn = screen.getByText('Last 30 days');
    fireEvent.click(thirtyDaysBtn);

    await waitFor(() => {
      expect(mockGetExpenses).toHaveBeenCalledTimes(2);
      const lastCall = mockGetExpenses.mock.calls[1][0];
      expect(lastCall).toHaveProperty('startDate');
    });
  });

  it('renders tag chips when tags are available', async () => {
    mockGetAllTags.mockResolvedValue(['vacation', 'work']);
    mockGetExpenses.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('All Tags')).toBeInTheDocument();
    });

    expect(screen.getByText('vacation')).toBeInTheDocument();
    expect(screen.getByText('work')).toBeInTheDocument();
  });

  it('clicking a tag chip navigates to tag page', async () => {
    mockGetAllTags.mockResolvedValue(['vacation']);
    mockGetExpenses.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('vacation')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('vacation'));

    expect(mockPush).toHaveBeenCalledWith('/tags/vacation');
  });

  it('does not show tag chips when no tags exist', async () => {
    mockGetAllTags.mockResolvedValue([]);
    mockGetExpenses.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('Showing 0 expenses')).toBeInTheDocument();
    });

    expect(screen.queryByText('All Tags')).not.toBeInTheDocument();
  });

  it('shows View Balances button', async () => {
    mockGetExpenses.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('View Balances')).toBeInTheDocument();
    });
  });

  it('navigates to balances on View Balances click', async () => {
    mockGetExpenses.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('View Balances')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Balances'));
    expect(mockPush).toHaveBeenCalledWith('/balances');
  });

  it('navigates to expense detail on row click', async () => {
    const expense = makeExpense({ id: 'exp-42' });
    mockGetExpenses.mockResolvedValue([expense]);
    mockGetExpenseParticipants.mockResolvedValue([]);
    mockGetExpenseTags.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('Test Dinner')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Test Dinner'));
    expect(mockPush).toHaveBeenCalledWith('/expenses/exp-42');
  });

  it('shows FAB button to create new expense', async () => {
    mockGetExpenses.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByLabelText('Create new expense')).toBeInTheDocument();
    });
  });

  it('navigates to /expenses/new on FAB click', async () => {
    mockGetExpenses.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      const fab = screen.getByLabelText('Create new expense');
      fireEvent.click(fab);
    });

    expect(mockPush).toHaveBeenCalledWith('/expenses/new');
  });

  it('sorts expenses by date descending (most recent first)', async () => {
    const oldExpense = makeExpense({
      id: 'exp-old',
      description: 'Old One',
      expense_date: '2025-01-01T00:00:00Z',
    });
    const newExpense = makeExpense({
      id: 'exp-new',
      description: 'New One',
      expense_date: '2025-06-15T00:00:00Z',
    });

    // Return them in wrong order; component should sort descending
    mockGetExpenses.mockResolvedValue([oldExpense, newExpense]);
    mockGetExpenseParticipants.mockResolvedValue([]);
    mockGetExpenseTags.mockResolvedValue([]);

    render(<ExpenseList />);

    await waitFor(() => {
      expect(screen.getByText('New One')).toBeInTheDocument();
      expect(screen.getByText('Old One')).toBeInTheDocument();
    });

    // Both should render — the order verification is via the DOM order
    const titles = screen.getAllByText(/One/);
    expect(titles[0].textContent).toBe('New One');
    expect(titles[1].textContent).toBe('Old One');
  });
});
