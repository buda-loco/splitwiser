import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { OfflineSplitTemplate, TemplateParticipant } from '@/lib/db/types';

// Mock the stores module before importing the hooks
vi.mock('@/lib/db/stores', () => ({
  getTemplatesByUser: vi.fn(),
  getTemplateById: vi.fn(),
}));

import { useTemplates, useTemplate } from './useTemplates';
import { getTemplatesByUser, getTemplateById } from '@/lib/db/stores';

const mockGetTemplatesByUser = vi.mocked(getTemplatesByUser);
const mockGetTemplateById = vi.mocked(getTemplateById);

const makeTemplate = (overrides: Partial<OfflineSplitTemplate> = {}): OfflineSplitTemplate => ({
  id: crypto.randomUUID(),
  name: 'Test Template',
  split_type: 'equal',
  created_by_user_id: 'user-1',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  sync_status: 'synced',
  local_updated_at: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

const makeTemplateParticipant = (overrides: Partial<TemplateParticipant> = {}): TemplateParticipant => ({
  id: crypto.randomUUID(),
  template_id: 'template-1',
  user_id: 'user-1',
  participant_id: null,
  split_value: null,
  created_at: '2025-01-01T00:00:00.000Z',
  ...overrides,
});

describe('useTemplates', () => {
  beforeEach(() => {
    mockGetTemplatesByUser.mockReset();
  });

  it('starts in loading state with empty templates', () => {
    mockGetTemplatesByUser.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTemplates('user-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.templates).toEqual([]);
  });

  it('fetches templates for a given user on mount', async () => {
    const templates = [
      makeTemplate({ id: 't1', name: 'Half-and-Half' }),
      makeTemplate({ id: 't2', name: 'Roommates' }),
    ];
    mockGetTemplatesByUser.mockResolvedValue(templates);

    const { result } = renderHook(() => useTemplates('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toHaveLength(2);
    expect(result.current.templates[0].name).toBe('Half-and-Half');
    expect(mockGetTemplatesByUser).toHaveBeenCalledWith('user-1');
  });

  it('returns empty templates and stops loading when userId is null', async () => {
    const { result } = renderHook(() => useTemplates(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toEqual([]);
    expect(mockGetTemplatesByUser).not.toHaveBeenCalled();
  });

  it('handles fetch errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetTemplatesByUser.mockRejectedValue(new Error('DB error'));

    const { result } = renderHook(() => useTemplates('user-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toEqual([]);
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load templates:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('re-fetches when userId changes', async () => {
    const user1Templates = [makeTemplate({ id: 't1', name: 'User1 Template' })];
    const user2Templates = [makeTemplate({ id: 't2', name: 'User2 Template' })];

    mockGetTemplatesByUser.mockResolvedValueOnce(user1Templates);

    const { result, rerender } = renderHook(
      ({ userId }: { userId: string | null }) => useTemplates(userId),
      { initialProps: { userId: 'user-1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates[0].name).toBe('User1 Template');

    mockGetTemplatesByUser.mockResolvedValueOnce(user2Templates);

    rerender({ userId: 'user-2' });

    await waitFor(() => {
      expect(result.current.templates[0]?.name).toBe('User2 Template');
    });

    expect(mockGetTemplatesByUser).toHaveBeenCalledWith('user-2');
  });

  it('clears templates and stops loading when userId changes from valid to null', async () => {
    const templates = [makeTemplate({ id: 't1' })];
    mockGetTemplatesByUser.mockResolvedValue(templates);

    const { result, rerender } = renderHook(
      ({ userId }: { userId: string | null }) => useTemplates(userId),
      { initialProps: { userId: 'user-1' as string | null } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.templates).toHaveLength(1);

    rerender({ userId: null });

    await waitFor(() => {
      expect(result.current.templates).toEqual([]);
      expect(result.current.loading).toBe(false);
    });
  });
});

describe('useTemplate', () => {
  beforeEach(() => {
    mockGetTemplateById.mockReset();
  });

  it('starts in loading state with null data', () => {
    mockGetTemplateById.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useTemplate('template-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('fetches a template with participants by id', async () => {
    const template = makeTemplate({ id: 'template-1' });
    const participants = [
      makeTemplateParticipant({ template_id: 'template-1', user_id: 'user-1' }),
      makeTemplateParticipant({ template_id: 'template-1', user_id: 'user-2' }),
    ];
    mockGetTemplateById.mockResolvedValue({ template, participants });

    const { result } = renderHook(() => useTemplate('template-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.template.id).toBe('template-1');
    expect(result.current.data!.participants).toHaveLength(2);
    expect(mockGetTemplateById).toHaveBeenCalledWith('template-1');
  });

  it('returns null data and stops loading when templateId is null', async () => {
    const { result } = renderHook(() => useTemplate(null));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(mockGetTemplateById).not.toHaveBeenCalled();
  });

  it('handles fetch errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockGetTemplateById.mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useTemplate('template-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load template:', expect.any(Error));
    consoleSpy.mockRestore();
  });

  it('returns null when template is not found (store returns null)', async () => {
    mockGetTemplateById.mockResolvedValue(null);

    const { result } = renderHook(() => useTemplate('nonexistent'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
  });

  it('re-fetches when templateId changes', async () => {
    const template1 = makeTemplate({ id: 'template-1', name: 'First' });
    const template2 = makeTemplate({ id: 'template-2', name: 'Second' });

    mockGetTemplateById.mockResolvedValueOnce({
      template: template1,
      participants: [],
    });

    const { result, rerender } = renderHook(
      ({ templateId }: { templateId: string | null }) => useTemplate(templateId),
      { initialProps: { templateId: 'template-1' } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data!.template.name).toBe('First');

    mockGetTemplateById.mockResolvedValueOnce({
      template: template2,
      participants: [],
    });

    rerender({ templateId: 'template-2' });

    await waitFor(() => {
      expect(result.current.data?.template.name).toBe('Second');
    });

    expect(mockGetTemplateById).toHaveBeenCalledWith('template-2');
  });
});
