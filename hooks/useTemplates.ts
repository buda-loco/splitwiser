'use client';

import { useState, useEffect } from 'react';
import { getTemplatesByUser, getTemplateById, getCategoryTemplates } from '@/lib/db/stores';
import type { OfflineSplitTemplate, TemplateParticipant } from '@/lib/db/types';

export type TemplateWithParticipants = {
  template: OfflineSplitTemplate;
  participants: TemplateParticipant[];
};

/**
 * Hook to fetch templates for current user
 */
export function useTemplates(userId: string | null) {
  const [templates, setTemplates] = useState<OfflineSplitTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    async function loadTemplates() {
      try {
        const userTemplates = await getTemplatesByUser(userId!);
        setTemplates(userTemplates);
      } catch (error) {
        console.error('Failed to load templates:', error);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    }

    loadTemplates();
  }, [userId]);

  return { templates, loading };
}

/**
 * Hook to fetch a single template with participants
 */
export function useTemplate(templateId: string | null) {
  const [data, setData] = useState<TemplateWithParticipants | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!templateId) {
      setData(null);
      setLoading(false);
      return;
    }

    async function loadTemplate() {
      try {
        const result = await getTemplateById(templateId!);
        setData(result);
      } catch (error) {
        console.error('Failed to load template:', error);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [templateId]);

  return { data, loading };
}

/**
 * Hook to fetch templates for a specific category
 * Sorted by usage frequency (would need usage tracking)
 */
export function useCategoryTemplates(categoryId: string | null, userId: string | null) {
  const [templates, setTemplates] = useState<OfflineSplitTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId || !userId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    async function loadCategoryTemplates() {
      if (!categoryId || !userId) return; // Type guard
      try {
        const categoryTemplates = await getCategoryTemplates(categoryId, userId);
        // TODO: Sort by usage frequency when usage tracking is implemented
        // For now, sort by most recently created
        const sorted = categoryTemplates.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setTemplates(sorted);
      } catch (error) {
        console.error('Failed to load category templates:', error);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryTemplates();
  }, [categoryId, userId]);

  return { templates, loading };
}
