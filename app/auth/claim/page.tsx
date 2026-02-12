import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getClaimableParticipants } from '@/lib/actions/claim';
import { PageTransition } from '@/components/PageTransition';
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
      <PageTransition>
        <div className="min-h-screen bg-white dark:bg-black pt-safe-top pb-safe">
          <div className="mx-auto max-w-md px-4 py-6">
            <h1 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
              Claim Your Account
            </h1>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900 p-6 text-center shadow-sm">
              <p className="text-gray-600 dark:text-gray-400">
                No accounts found to claim for {user.email}
              </p>
              <Link
                href="/"
                className="mt-4 inline-block rounded-lg bg-ios-blue px-6 py-3 font-medium text-white hover:bg-blue-700 active:scale-95 transition-transform"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-white dark:bg-black pt-safe-top pb-safe">
        <div className="mx-auto max-w-md px-4 py-6">
          <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-white">
            Claim Your Account
          </h1>
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            We found {participants.length} account{participants.length > 1 ? 's' : ''} associated
            with {user.email}. Select which one you&apos;d like to claim.
          </p>
          <ClaimList participants={participants} />
        </div>
      </div>
    </PageTransition>
  );
}
