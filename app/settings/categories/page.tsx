'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { PageTransition } from '@/components/PageTransition';
import ProtectedRoute from '@/components/ProtectedRoute';
import { CategoryManager } from '@/components/CategoryManager';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function CategoriesManagementPage() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) {
    return null;
  }

  return (
    <ProtectedRoute>
      <PageTransition>
        <main className="min-h-screen pt-safe-top pb-safe-bottom px-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md mx-auto pt-4">
            {/* Header */}
            <div className="flex items-center mb-6">
              <button
                onClick={() => router.back()}
                className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-ios-blue" />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-2">
                Manage Categories
              </h1>
            </div>

            {/* Category Manager Component */}
            <CategoryManager userId={user.id} />
          </div>
        </main>
      </PageTransition>
    </ProtectedRoute>
  );
}
