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
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          backgroundColor: '#f5f5f7',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '48px',
              marginBottom: '16px',
            }}
          >
            ⚠️
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '12px',
              color: '#1d1d1f',
            }}
          >
            Invalid Invite Link
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: '#6e6e73',
              lineHeight: '1.5',
            }}
          >
            This invite link has expired or is invalid. Please ask the person who invited you to
            send a new link.
          </p>
        </div>
      </div>
    );
  }

  const { participant } = invite;

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        backgroundColor: '#f5f5f7',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div
          style={{
            fontSize: '48px',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          👋
        </div>

        <h1
          style={{
            fontSize: '28px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#1d1d1f',
            textAlign: 'center',
          }}
        >
          Hi, {participant.name}!
        </h1>

        <p
          style={{
            fontSize: '16px',
            color: '#6e6e73',
            lineHeight: '1.5',
            textAlign: 'center',
            marginBottom: '24px',
          }}
        >
          You&apos;ve been added to shared expenses by a friend. Create an account to view and
          settle your balances.
        </p>

        {participant.email && (
          <div
            style={{
              padding: '16px',
              backgroundColor: '#f5f5f7',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                color: '#6e6e73',
                marginBottom: '4px',
              }}
            >
              Your contact info:
            </div>
            <div
              style={{
                fontSize: '14px',
                color: '#1d1d1f',
                fontWeight: '500',
              }}
            >
              {participant.email}
            </div>
          </div>
        )}

        <div
          style={{
            padding: '16px',
            backgroundColor: '#f0f9ff',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #0071e3',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#6e6e73',
              marginBottom: '4px',
            }}
          >
            Your current balance:
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#1d1d1f',
              fontWeight: '600',
            }}
          >
            Coming soon
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#6e6e73',
              marginTop: '4px',
            }}
          >
            Balance calculation will be available in Phase 6
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <Link
            href={`/auth/claim?participant=${participant.id}&token=${token}`}
            style={{
              display: 'block',
              padding: '14px',
              backgroundColor: '#0071e3',
              color: 'white',
              textAlign: 'center',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '16px',
            }}
          >
            Create Account to Claim
          </Link>

          <button
            style={{
              padding: '14px',
              backgroundColor: '#f5f5f7',
              color: '#1d1d1f',
              textAlign: 'center',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '500',
              fontSize: '16px',
              cursor: 'pointer',
            }}
            disabled
          >
            View as Guest (Coming in Phase 6)
          </button>
        </div>

        <p
          style={{
            fontSize: '12px',
            color: '#6e6e73',
            textAlign: 'center',
            marginTop: '24px',
            lineHeight: '1.5',
          }}
        >
          By creating an account, you&apos;ll be able to manage your expenses, view your balance
          history, and settle up with friends.
        </p>
      </div>
    </div>
  );
}
