'use client';

export default function DebugEnvPage() {
  if (typeof window === 'undefined') {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black p-8">
      <h1 className="text-2xl font-bold mb-6">Environment Debug</h1>

      <div className="space-y-4 font-mono text-sm">
        <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded">
          <strong>Current Origin:</strong>
          <br />
          {window.location.origin}
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded">
          <strong>Current Hostname:</strong>
          <br />
          {window.location.hostname}
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded">
          <strong>Supabase URL:</strong>
          <br />
          {process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET'}
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded">
          <strong>App URL:</strong>
          <br />
          {process.env.NEXT_PUBLIC_APP_URL || 'NOT SET'}
        </div>

        <div className="p-4 bg-gray-100 dark:bg-gray-900 rounded">
          <strong>Expected Callback URL:</strong>
          <br />
          {window.location.origin}/auth/callback
        </div>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900 rounded">
          <strong>✓ If origin shows localhost:</strong> You're on localhost, not Vercel!
          <br />
          <strong>✓ If origin shows vercel.app:</strong> You're on Vercel correctly
        </div>
      </div>
    </div>
  );
}
