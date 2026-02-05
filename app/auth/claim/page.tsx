import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getClaimableParticipants } from '@/lib/actions/claim';
import ClaimList from './ClaimList';

/**
 * Account claiming page
 * Shows participants that can be claimed by the current user
 */
export default async function ClaimPage() {
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    redirect('/auth/login');
  }

  // Get claimable participants for this email
  const participants = await getClaimableParticipants(user.email);

  // No participants to claim
  if (participants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-8 pb-safe-bottom">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-4 text-2xl font-semibold text-gray-900">
            Claim Your Account
          </h1>
          <div className="rounded-xl bg-white p-6 text-center shadow-sm">
            <p className="text-gray-600">
              No accounts found to claim for {user.email}
            </p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Go to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 pb-safe-bottom">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">
          Claim Your Account
        </h1>
        <p className="mb-6 text-gray-600">
          We found {participants.length} account{participants.length > 1 ? 's' : ''} associated
          with {user.email}. Select which one you&apos;d like to claim.
        </p>
        <ClaimList participants={participants} />
      </div>
    </div>
  );
}
