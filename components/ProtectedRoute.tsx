'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

/**
 * ProtectedRoute component
 *
 * Wrapper component that protects routes from unauthenticated access.
 * Redirects to /auth/login if the user is not authenticated.
 * Shows a loading spinner while authentication state is being determined.
 *
 * @example
 * ```tsx
 * export default function SecurePage() {
 *   return (
 *     <ProtectedRoute>
 *       <div>This content is only visible to authenticated users</div>
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-safe-top pb-safe-bottom">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-ios-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ios-gray">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render content if not authenticated (redirect in progress)
  if (!user) {
    return null;
  }

  // Render protected content for authenticated users
  return <>{children}</>;
}
