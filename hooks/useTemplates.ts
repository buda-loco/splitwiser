'use client';

import { useState, useEffect } from 'react';
import { getTemplatesByUser, getTemplateById } from '@/lib/db/stores';
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
