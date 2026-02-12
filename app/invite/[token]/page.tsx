/**
 * Invite Landing Page
 *
 * Dynamic route for /invite/[token]
 * Validates invite tokens and displays participant information with CTAs
 * for account creation or guest viewing.
 */

import { getInviteByToken } from '@/lib/actions/invite';
import Link from 'next/link';

interface InvitePageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  // Fetch and validate invite token
  const invite = await getInviteByToken(token);

  // Invalid or expired token
  if (!invite || !invite.isValid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-safe-top pb-safe-bottom bg-gray-50 dark:bg-black">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm text-center">
          <div className="text-5xl mb-4">&#9888;&#65039;</div>
          <h1 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            Invalid Invite Link
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            This invite link has expired or is invalid. Please ask the person who invited you to
            send a new link.
          </p>
        </div>
      </div>
    );
  }

  const { participant } = invite;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-safe-top pb-safe-bottom bg-gray-50 dark:bg-black">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl p-8 shadow-sm">
        <div className="text-5xl text-center mb-4">&#128075;</div>

        <h1 className="text-[28px] font-semibold mb-2 text-gray-900 dark:text-white text-center">
          Hi, {participant.name}!
        </h1>

        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed text-center mb-6">
          You&apos;ve been added to shared expenses by a friend. Create an account to view and
          settle your balances.
        </p>

        {participant.email && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg mb-6">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Your contact info:
            </div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {participant.email}
            </div>
          </div>
        )}

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-6 border border-ios-blue">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Your current balance:
          </div>
          <div className="text-xl font-semibold text-gray-900 dark:text-white">
            Coming soon
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Balance calculation will be available in Phase 6
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={`/auth/claim?participant=${participant.id}&token=${token}`}
            className="block py-3.5 bg-ios-blue text-white text-center rounded-xl no-underline font-medium text-base"
          >
            Create Account to Claim
          </Link>

          <button
            className="py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-center rounded-xl border-none font-medium text-base cursor-not-allowed opacity-60"
            disabled
          >
            View as Guest (Coming in Phase 6)
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-6 leading-relaxed">
          By creating an account, you&apos;ll be able to manage your expenses, view your balance
          history, and settle up with friends.
        </p>
      </div>
    </div>
  );
}
