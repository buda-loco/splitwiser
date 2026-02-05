'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Participant } from '@/lib/db/types';
import { claimParticipantAccount } from '@/lib/actions/claim';

interface ClaimListProps {
  participants: Participant[];
}

export default function ClaimList({ participants }: ClaimListProps) {
  const router = useRouter();
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async (participantId: string) => {
    setClaimingId(participantId);
    setError(null);

    const result = await claimParticipantAccount(participantId);

    if (result.success) {
      // Redirect to home on success
      router.push('/');
    } else {
      // Show error
      setError(result.error || 'Failed to claim account');
      setClaimingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className={`border-gray-200 p-4 ${
              index !== participants.length - 1 ? 'border-b' : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {participant.name}
                </h3>
                <p className="text-sm text-gray-600">
                  Created on {new Date(participant.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleClaim(participant.id)}
                disabled={claimingId !== null}
                className={`rounded-lg px-4 py-2 font-medium text-white transition-colors ${
                  claimingId === participant.id
                    ? 'bg-gray-400'
                    : claimingId !== null
                    ? 'bg-gray-300'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {claimingId === participant.id ? 'Claiming...' : 'Claim This Account'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
