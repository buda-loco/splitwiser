import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagInput } from './TagInput';

// Mock the db stores module
vi.mock('@/lib/db/stores', () => ({
  getAllTags: vi.fn().mockResolvedValue(['food', 'travel', 'work', 'entertainment', 'groceries']),
}));

describe('TagInput', () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders existing tags as chips', () => {
    render(<TagInput tags={['food', 'travel']} onChange={onChange} />);
    expect(screen.getByText('food')).toBeInTheDocument();
    expect(screen.getByText('travel')).toBeInTheDocument();
  });

  it('renders the input field with placeholder', () => {
    render(<TagInput tags={[]} onChange={onChange} />);
    expect(screen.getByPlaceholderText('Add tags (press Enter or comma)')).toBeInTheDocument();
  });

  it('renders remove buttons with correct aria labels', () => {
    render(<TagInput tags={['food', 'travel']} onChange={onChange} />);
    expect(screen.getByLabelText('Remove food')).toBeInTheDocument();
    expect(screen.getByLabelText('Remove travel')).toBeInTheDocument();
  });

  it('calls onChange to remove a tag when remove button is clicked', () => {
    render(<TagInput tags={['food', 'travel']} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Remove food'));
    expect(onChange).toHaveBeenCalledWith(['travel']);
  });

  it('adds a tag on Enter key', () => {
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.change(input, { target: { value: 'NewTag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['newtag']); // normalizes to lowercase
  });

  it('adds a tag on comma key', () => {
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.change(input, { target: { value: 'shopping' } });
    fireEvent.keyDown(input, { key: ',' });

    expect(onChange).toHaveBeenCalledWith(['shopping']);
  });

  it('does not add empty tags on Enter', () => {
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not add empty tags on comma', () => {
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.keyDown(input, { key: ',' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('prevents duplicate tags', () => {
    render(<TagInput tags={['food']} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.change(input, { target: { value: 'Food' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    // onChange should NOT be called because 'food' already exists (case-insensitive)
    expect(onChange).not.toHaveBeenCalled();
  });

  it('removes last tag on Backspace when input is empty', () => {
    render(<TagInput tags={['food', 'travel']} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    // Input is empty, pressing Backspace should remove last tag
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith(['food']); // 'travel' removed
  });

  it('does not remove tag on Backspace when input has value', () => {
    render(<TagInput tags={['food']} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.keyDown(input, { key: 'Backspace' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not remove tag on Backspace when there are no tags', () => {
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('shows autocomplete suggestions after typing and debounce', async () => {
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.change(input, { target: { value: 'foo' } });

    // Advance past debounce timer (300ms)
    act(() => {
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText('food')).toBeInTheDocument();
    });
  });

  it('filters out already selected tags from suggestions', async () => {
    render(<TagInput tags={['food']} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.change(input, { target: { value: 'foo' } });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      // 'food' is already a tag, so it should not appear as a suggestion
      // Only the tag chip should show 'food', not as a button suggestion
      const buttons = screen.queryAllByRole('button', { name: /food/i });
      // The only 'food' button is the remove button on the tag chip
      const suggestionButtons = buttons.filter(b => b.getAttribute('aria-label')?.startsWith('Remove') === false);
      expect(suggestionButtons).toHaveLength(0);
    });
  });

  it('adds a tag when a suggestion is clicked', async () => {
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.change(input, { target: { value: 'trav' } });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    await waitFor(() => {
      expect(screen.getByText('travel')).toBeInTheDocument();
    });

    // Click the suggestion
    fireEvent.click(screen.getByText('travel'));
    expect(onChange).toHaveBeenCalledWith(['travel']);
  });

  it('clears input after adding a tag', () => {
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)') as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'newtag' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe('');
  });

  it('trims whitespace from tags', () => {
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.change(input, { target: { value: '  spacey  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onChange).toHaveBeenCalledWith(['spacey']);
  });

  it('does not show dropdown when input is empty', () => {
    render(<TagInput tags={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText('Add tags (press Enter or comma)');

    fireEvent.change(input, { target: { value: '' } });

    act(() => {
      vi.advanceTimersByTime(350);
    });

    // No suggestion buttons should be visible (aside from potential remove buttons)
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });
});
