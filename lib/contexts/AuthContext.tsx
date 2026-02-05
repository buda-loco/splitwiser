'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getCurrentUserProfile } from '@/lib/actions/user';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/db/types';

/**
 * Authentication context providing client-side auth state
 *
 * This context provides the current authenticated user and their profile
 * throughout the application. It automatically syncs with Supabase auth
 * state changes and keeps the profile up to date.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, profile, loading, signOut } = useAuth();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Please log in</div>;
 *
 *   return <div>Welcome {profile?.display_name || user.email}</div>;
 * }
 * ```
 */
interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Fetch profile for authenticated user
        getCurrentUserProfile().then((profile) => {
          setProfile(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        // Fetch updated profile when auth state changes
        const updatedProfile = await getCurrentUserProfile();
        setProfile(updatedProfile);
      } else {
        // Clear profile when logged out
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 *
 * Must be used within an AuthProvider component.
 *
 * @throws Error if used outside of AuthProvider
 * @returns The authentication context with user, profile, loading state, and signOut function
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
