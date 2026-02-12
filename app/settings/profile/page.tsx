'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ProfileForm } from '@/components/ProfileForm';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { Profile } from '@/lib/db/types';

export default function ProfileEditPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState<Profile | null>(null);

  useEffect(() => {
    if (!authLoading && profile) {
      setProfileData(profile);
      setLoadingProfile(false);
    }
  }, [authLoading, profile]);

  const handleSuccess = () => {
    // Profile updated successfully
    // AuthContext will automatically refetch the profile
  };

  if (authLoading || loadingProfile) {
    return (
      <ProtectedRoute>
        <PageTransition>
          <main className="min-h-screen pt-safe-top pb-safe-bottom px-4">
            <div className="max-w-md mx-auto pt-4">
              {/* Header Skeleton */}
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                <div className="ml-4 h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              </div>

              {/* Form Skeleton */}
              <div className="space-y-6">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                </div>
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
            </div>
          </main>
        </PageTransition>
      </ProtectedRoute>
    );
  }

  if (!profileData) {
    return (
      <ProtectedRoute>
        <PageTransition>
          <main className="min-h-screen pt-safe-top pb-safe-bottom px-4">
            <div className="max-w-md mx-auto pt-4">
              <p className="text-center text-gray-500 dark:text-gray-400">
                Failed to load profile. Please try again.
              </p>
            </div>
          </main>
        </PageTransition>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <PageTransition>
        <main className="min-h-screen pt-safe-top pb-safe-bottom px-4">
          <div className="max-w-md mx-auto pt-4">
            {/* Header */}
            <div className="flex items-center mb-6">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 text-ios-blue active:scale-95 transition-transform"
                aria-label="Go back"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-2">
                Edit Profile
              </h1>
            </div>

            {/* Profile Form */}
            <ProfileForm profile={profileData} onSuccess={handleSuccess} />
          </div>
        </main>
      </PageTransition>
    </ProtectedRoute>
  );
}
