'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TemplateForm } from '@/components/TemplateForm';
import { getTemplateById, updateTemplate, deleteTemplate, getParticipantById } from '@/lib/db/stores';
import type { TemplateFormData } from '@/components/TemplateForm';
import type { TemplateParticipant } from '@/lib/db/types';
import type { ParticipantWithDetails } from '@/hooks/useParticipants';

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;

  const [initialData, setInitialData] = useState<TemplateFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTemplate() {
      try {
        const result = await getTemplateById(templateId);
        if (!result) {
          alert('Template not found');
          router.push('/templates');
          return;
        }

        const { template, participants: templateParticipants } = result;

        // Load full participant details
        const participantDetails: ParticipantWithDetails[] = await Promise.all(
          templateParticipants.map(async (tp: TemplateParticipant) => {
            if (tp.participant_id) {
              const p = await getParticipantById(tp.participant_id);
              return p ? {
                id: tp.participant_id,
                type: 'participant' as const,
                name: p.name,
                email: p.email,
                phone: p.phone,
                split_value: tp.split_value
              } : null;
            } else if (tp.user_id) {
              // TODO: Load user details when getUserById exists
              return {
                id: tp.user_id,
                type: 'user' as const,
                name: 'User',
                split_value: tp.split_value
              };
            }
            return null;
          })
        ).then(results => results.filter(Boolean) as ParticipantWithDetails[]);

        // Create splits from template participants
        const splits = participantDetails.map(p => ({
          user_id: p.type === 'user' ? p.id : null,
          participant_id: p.type === 'participant' ? p.id : null,
          split_value: p.split_value || null
        }));

        setInitialData({
          name: template.name,
          split_type: template.split_type,
          participants: participantDetails,
          splits
        });
      } catch (error) {
        console.error('Failed to load template:', error);
        alert('Failed to load template');
        router.push('/templates');
      } finally {
        setLoading(false);
      }
    }

    loadTemplate();
  }, [templateId, router]);

  async function handleSubmit(formData: TemplateFormData) {
    try {
      // Delete old template and participants
      await deleteTemplate(templateId);

      // Create new template with updated data (simpler than update logic)
      const userId = 'temp-user-id'; // TODO: Get from auth context
      const { createTemplate } = await import('@/lib/db/stores');
      await createTemplate({
        name: formData.name,
        split_type: formData.split_type,
        created_by_user_id: userId,
        participants: formData.participants.map(p => ({
          user_id: p.type === 'user' ? p.id : null,
          participant_id: p.type === 'participant' ? p.id : null,
          split_value: formData.split_type === 'equal' ? null : (p.split_value || null)
        }))
      });

      router.push('/templates');
    } catch (error) {
      console.error('Failed to update template:', error);
      alert('Failed to update template. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ios-gray6 dark:bg-black flex items-center justify-center">
        <p className="text-ios-gray dark:text-ios-gray3">Loading template...</p>
      </div>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-ios-gray6 dark:bg-black pb-safe">
      <div className="max-w-2xl mx-auto px-4 pt-safe">
        <h1 className="text-2xl font-bold text-ios-black dark:text-white py-4 mb-4">
          Edit Template
        </h1>
        <TemplateForm
          initialData={initialData}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/templates')}
        />
      </div>
    </div>
  );
}
