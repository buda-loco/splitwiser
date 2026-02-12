'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TemplateForm } from '@/components/TemplateForm';
import { PageTransition } from '@/components/PageTransition';
import { getTemplateById, deleteTemplate } from '@/lib/db/stores';
import type { TemplateFormData } from '@/components/TemplateForm';
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

        // Build ParticipantWithDetails from TemplateParticipant
        // Note: We don't have access to full participant details (name, email)
        // so we create minimal records with display names
        const participantDetails: ParticipantWithDetails[] = templateParticipants.map(tp => {
          const name = tp.user_id 
            ? `User ${tp.user_id.slice(0, 8)}` 
            : tp.participant_id 
            ? `Participant ${tp.participant_id.slice(0, 8)}`
            : 'Unknown';

          return {
            user_id: tp.user_id,
            participant_id: tp.participant_id,
            name,
            email: null
          };
        });

        // Create splits from template participants
        const splits = templateParticipants.map(tp => ({
          user_id: tp.user_id,
          participant_id: tp.participant_id,
          split_value: tp.split_value
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
          user_id: p.user_id,
          participant_id: p.participant_id,
          split_value: formData.split_type === 'equal' ? null : (
            formData.splits.find(s => 
              (s.user_id && s.user_id === p.user_id) || 
              (s.participant_id && s.participant_id === p.participant_id)
            )?.split_value || null
          )
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
      <PageTransition>
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
          <p className="text-ios-gray dark:text-ios-gray3">Loading template...</p>
        </div>
      </PageTransition>
    );
  }

  if (!initialData) {
    return null;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-black pt-safe-top pb-safe">
        <div className="max-w-md mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-ios-black dark:text-white mb-4">
            Edit Template
          </h1>
          <TemplateForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/templates')}
          />
        </div>
      </div>
    </PageTransition>
  );
}
