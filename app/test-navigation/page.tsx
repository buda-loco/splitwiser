'use client'

import { PageTransition } from '@/components/PageTransition'

/**
 * Test page for navigation testing
 * This page provides a simple landing page for testing the BottomNav
 * The BottomNav is rendered by the root layout, so we don't include it here
 */
export default function TestNavigationPage() {
  return (
    <PageTransition>
      <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-black">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Navigation Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This page is used for automated navigation testing.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>Test the bottom navigation by clicking the tabs below.</p>
            <p>All icons should be SVG elements (Lucide icons).</p>
            <p>No emojis should be present in the navigation.</p>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
