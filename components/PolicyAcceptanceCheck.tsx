'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { PolicyAcceptanceBanner } from './PolicyAcceptanceBanner';

/**
 * Policy Acceptance Check Component
 *
 * Shows the PolicyAcceptanceBanner for existing users who haven't accepted policies.
 * This component is included in the root layout to check all authenticated users.
 */
export function PolicyAcceptanceCheck() {
  const { user, profile } = useAuth();
  const [hasAccepted, setHasAccepted] = useState(false);

  // Don't show if not authenticated
  if (!user || !profile) {
    return null;
  }

  // Don't show if already accepted (either from DB or from this session)
  if (hasAccepted || (profile.privacy_policy_accepted_at && profile.terms_accepted_at)) {
    return null;
  }

  return (
    <PolicyAcceptanceBanner
      userId={user.id}
      onAccepted={() => setHasAccepted(true)}
    />
  );
}
