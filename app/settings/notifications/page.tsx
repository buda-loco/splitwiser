import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import NotificationPreferences from '@/components/NotificationPreferences';
import { SwipeNavigation } from '@/components/SwipeNavigation';
import { PageTransition } from '@/components/PageTransition';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Notification Preferences - Splitwiser',
  description: 'Manage your notification settings',
};

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <SwipeNavigation>
      <PageTransition>
        <div className="min-h-screen bg-white dark:bg-black pt-safe-top pb-safe">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-safe-top z-10">
            <div className="max-w-md mx-auto px-4 py-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/settings"
                  className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-5 h-5 text-ios-blue" />
                </Link>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h1>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="max-w-md mx-auto px-4 py-6">
            <NotificationPreferences userId={user.id} />
          </div>
        </div>
      </PageTransition>
    </SwipeNavigation>
  );
}
