import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock db/stores
vi.mock('@/lib/db/stores', () => ({
  getTemplatesByUser: vi.fn().mockResolvedValue([]),
  getTemplateById: vi.fn().mockResolvedValue(null),
  getAllTags: vi.fn().mockResolvedValue([]),
}));

// Mock currency geolocation
vi.mock('@/lib/currency/geolocation', () => ({
  detectCurrencyFromLocation: vi.fn().mockResolvedValue(null),
}));

// Mock AuthContext
const mockUser = { id: 'user-1', email: 'test@example.com' };
vi.mock('@/lib/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    profile: null,
    loading: false,
    signOut: vi.fn(),
  }),
}));

// Mock useTemplates hook
vi.mock('@/hooks/useTemplates', () => ({
  useTemplates: () => ({
    templates: [],
    loading: false,
  }),
}));

// Mock child components that rely on db
vi.mock('./ParticipantPicker', () => ({
  ParticipantPicker: ({ selected, onChange }: { selected: unknown[]; onChange: (p: unknown[]) => void }) => (
    <div data-testid="participant-picker">
      <span>Participants: {selected.length}</span>
      <button
        type="button"
        data-testid="add-participant"
        onClick={() => onChange([...selected, {
          user_id: 'user-2',
          participant_id: null,
          name: 'TestParticipant',
          email: null,
        }])}
      >
        Add Participant
      </button>
    </div>
  ),
}));

vi.mock('./SplitEqual', () => ({
  SplitEqual: ({ amount, participants, onChange }: { amount: number; participants: unknown[]; onChange: (s: unknown[]) => void }) => {
    // Auto-generate splits when rendered
    const splits = (participants as { user_id: string | null; participant_id: string | null }[]).map((p) => ({
      id: crypto.randomUUID(),
      expense_id: '',
      user_id: p.user_id,
      participant_id: p.participant_id,
      amount: amount / (participants as unknown[]).length,
      split_type: 'equal',
      split_value: null,
      created_at: new Date().toISOString(),
    }));
    return (
      <div data-testid="split-equal">
        <span>Equal Split</span>
        <button type="button" data-testid="apply-splits" onClick={() => onChange(splits)}>
          Apply Equal Splits
        </button>
      </div>
    );
  },
}));

vi.mock('./SplitByPercentage', () => ({
  SplitByPercentage: () => <div data-testid="split-percentage">Percentage Split</div>,
}));

vi.mock('./SplitByShares', () => ({
  SplitByShares: () => <div data-testid="split-shares">Shares Split</div>,
}));

vi.mock('./TagInput', () => ({
  TagInput: ({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) => (
    <div data-testid="tag-input">
      <span>Tags: {tags.join(', ')}</span>
      <button type="button" data-testid="add-tag" onClick={() => onChange([...tags, 'test-tag'])}>
        Add Tag
      </button>
    </div>
  ),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { ExpenseForm } from './ExpenseForm';

describe('ExpenseForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  describe('Step 1: Basic Info', () => {
    it('renders all basic info fields', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('What was this expense for?')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
    });

    it('renders step indicator with 3 steps', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      // The step indicator has 3 flex-1 divs
      const stepIndicatorContainer = document.querySelector('.flex.gap-2.mb-6');
      expect(stepIndicatorContainer).toBeInTheDocument();
      const steps = stepIndicatorContainer!.querySelectorAll('.flex-1');
      expect(steps.length).toBe(3);
    });

    it('renders currency selector with default AUD', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      const currencySelect = screen.getByDisplayValue('AUD');
      expect(currencySelect).toBeInTheDocument();
    });

    it('renders currency options', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('AUD')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
      expect(screen.getByText('EUR')).toBeInTheDocument();
      expect(screen.getByText('GBP')).toBeInTheDocument();
    });

    it('renders category options', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('Transport')).toBeInTheDocument();
      expect(screen.getByText('Accommodation')).toBeInTheDocument();
      expect(screen.getByText('Activities')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('renders TagInput component', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      expect(screen.getByTestId('tag-input')).toBeInTheDocument();
    });

    it('renders cancel button when onCancel is provided', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('calls onCancel when cancel button is clicked', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByText('Cancel'));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });

    it('renders Next button on step 1', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('Next button is disabled when form is invalid (empty fields)', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      const nextButton = screen.getByText('Next');
      expect(nextButton.closest('button')).toBeDisabled();
    });

    it('shows validation error on amount after blur with empty value', async () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.focus(amountInput);
      fireEvent.blur(amountInput);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Amount is required');
      });
    });

    it('shows validation error for negative amount when form is submitted', async () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      const amountInput = screen.getByPlaceholderText('0.00');
      fireEvent.change(amountInput, { target: { value: '-5' } });

      // Submit the form which marks all fields as touched
      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Amount must be greater than 0')).toBeInTheDocument();
      });
    });

    it('shows validation error for description after blur', async () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      const descInput = screen.getByPlaceholderText('What was this expense for?');
      fireEvent.focus(descInput);
      fireEvent.blur(descInput);

      await waitFor(() => {
        expect(screen.getByText('Description is required')).toBeInTheDocument();
      });
    });

    it('shows validation error for category after blur', async () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      const catSelect = screen.getByDisplayValue('Select a category');
      fireEvent.focus(catSelect);
      fireEvent.blur(catSelect);

      await waitFor(() => {
        expect(screen.getByText('Category is required')).toBeInTheDocument();
      });
    });

    it('uses initialData when provided', () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 99.99,
            currency: 'USD',
            description: 'Initial description',
            category: 'Food',
            expense_date: '2025-06-01',
          }}
        />
      );

      expect(screen.getByDisplayValue('99.99')).toBeInTheDocument();
      expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Initial description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Food')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-06-01')).toBeInTheDocument();
    });

    it('shows all validation errors when Next is clicked with empty form', async () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      // Submit the form (which triggers Next on step 1)
      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Amount is required')).toBeInTheDocument();
        expect(screen.getByText('Description is required')).toBeInTheDocument();
        expect(screen.getByText('Category is required')).toBeInTheDocument();
      });
    });

    it('shows exchange rate option when non-AUD currency selected', async () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      const currencySelect = screen.getByDisplayValue('AUD');
      fireEvent.change(currencySelect, { target: { value: 'USD' } });

      await waitFor(() => {
        expect(screen.getByText('+ Set custom exchange rate')).toBeInTheDocument();
      });
    });

    it('does not show exchange rate option for AUD', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      expect(screen.queryByText('+ Set custom exchange rate')).not.toBeInTheDocument();
    });
  });

  describe('Step 2: Participants', () => {
    it('advances to participant step when basic info is valid', async () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 50,
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          }}
        />
      );

      // Submit form to advance from step 1 to step 2
      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('participant-picker')).toBeInTheDocument();
      });
    });

    it('shows Back button on participant step', async () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 50,
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          }}
        />
      );

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });
    });

    it('goes back to basic info when Back is clicked', async () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 50,
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          }}
        />
      );

      // Advance to step 2
      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });

      // Go back
      fireEvent.click(screen.getByText('Back'));

      // Should see step 1 fields again
      expect(screen.getByText('Amount')).toBeInTheDocument();
    });

    it('shows validation message when no participants selected', async () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 50,
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          }}
        />
      );

      // Advance to step 2
      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Please select at least one participant')).toBeInTheDocument();
      });
    });
  });

  describe('Step 3: Splits', () => {
    it('advances to split step when participants are selected', async () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 50,
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          }}
        />
      );

      // Advance to step 2
      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('participant-picker')).toBeInTheDocument();
      });

      // Add a participant
      fireEvent.click(screen.getByTestId('add-participant'));

      // Submit to advance to step 3
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('How to split?')).toBeInTheDocument();
      });
    });

    it('renders split method buttons (Equal, %, Shares)', async () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 50,
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          }}
        />
      );

      // Navigate to step 3
      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('participant-picker')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('add-participant'));
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Equally')).toBeInTheDocument();
        expect(screen.getByText('By %')).toBeInTheDocument();
        expect(screen.getByText('By Shares')).toBeInTheDocument();
      });
    });

    it('shows SplitEqual by default on step 3', async () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 50,
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          }}
        />
      );

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('participant-picker')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('add-participant'));
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('split-equal')).toBeInTheDocument();
      });
    });

    it('switches to percentage split on click', async () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 50,
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          }}
        />
      );

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('participant-picker')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('add-participant'));
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('By %')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('By %'));

      expect(screen.getByTestId('split-percentage')).toBeInTheDocument();
    });

    it('switches to shares split on click', async () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 50,
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          }}
        />
      );

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('participant-picker')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('add-participant'));
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('By Shares')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('By Shares'));

      expect(screen.getByTestId('split-shares')).toBeInTheDocument();
    });

    it('shows Create Expense button on step 3', async () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 50,
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          }}
        />
      );

      const form = document.querySelector('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('participant-picker')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('add-participant'));
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Create Expense')).toBeInTheDocument();
      });
    });

    it('calls onSubmit with correct data when splits are valid', async () => {
      render(
        <ExpenseForm
          onSubmit={mockOnSubmit}
          initialData={{
            amount: 50,
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          }}
        />
      );

      const form = document.querySelector('form')!;

      // Step 1 -> Step 2
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('participant-picker')).toBeInTheDocument();
      });

      // Add participant
      fireEvent.click(screen.getByTestId('add-participant'));

      // Step 2 -> Step 3
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByTestId('split-equal')).toBeInTheDocument();
      });

      // Apply splits so they total to the amount
      fireEvent.click(screen.getByTestId('apply-splits'));

      // Step 3 -> Submit
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            amount: 50,
            currency: 'AUD',
            description: 'Test',
            category: 'Food',
            expense_date: '2025-01-15',
          })
        );
      });
    });
  });

  describe('Currency symbol display', () => {
    it('shows A$ for AUD currency', () => {
      render(<ExpenseForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText('A$')).toBeInTheDocument();
    });

    it('shows $ for USD currency', () => {
      render(
        <ExpenseForm onSubmit={mockOnSubmit} initialData={{ currency: 'USD' }} />
      );

      expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('shows euro sign for EUR currency', () => {
      render(
        <ExpenseForm onSubmit={mockOnSubmit} initialData={{ currency: 'EUR' }} />
      );

      // euro symbol
      expect(screen.getByText('\u20AC')).toBeInTheDocument();
    });

    it('shows pound sign for GBP currency', () => {
      render(
        <ExpenseForm onSubmit={mockOnSubmit} initialData={{ currency: 'GBP' }} />
      );

      expect(screen.getByText('\u00A3')).toBeInTheDocument();
    });
  });
});
