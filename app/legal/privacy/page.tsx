'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield } from 'lucide-react';

/**
 * Privacy Policy Page (GDPR Compliance)
 *
 * Provides transparent information about data collection, processing, and user rights.
 * Required by GDPR for any service processing EU user data.
 */
export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white dark:bg-black pb-24 pt-safe-top">
      {/* Header */}
      <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => router.back()}
          className="text-ios-blue mb-4"
        >
          ← Back
        </button>
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-ios-blue" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Last updated: February 12, 2026
        </p>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Introduction */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Introduction
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Splitwiser is committed to protecting your privacy. This policy explains what data we collect,
            how we use it, and your rights regarding your personal information. We believe in transparency
            and give you full control over your data.
          </p>
        </section>

        {/* Data We Collect */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Data We Collect
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            We collect only the information necessary to provide expense splitting services:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Account Information:</strong> Email address (for passwordless authentication), display name, profile picture (optional), and currency preference</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Expense Data:</strong> Expense descriptions, amounts, dates, categories, participant names, and split calculations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Settlement Data:</strong> Payment records, settlement dates, and notes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Usage Information:</strong> Device type, browser, and timestamps for security and service improvement</span>
            </li>
          </ul>
        </section>

        {/* How We Use Data */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            How We Use Your Data
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            Your data is used exclusively to provide and improve our expense splitting service:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Expense Tracking:</strong> Store and calculate shared expenses and balances</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Offline Functionality:</strong> Sync data across your devices for offline access</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Authentication:</strong> Verify your identity via magic link emails</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Service Improvement:</strong> Analyze usage patterns to enhance features (anonymized data only)</span>
            </li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
            <strong>We never:</strong> Sell your data, show advertisements, or share your information with third parties
            except as required by law.
          </p>
        </section>

        {/* Data Storage */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Data Storage and Security
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            Your data is stored securely in two locations:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Local Storage (IndexedDB):</strong> Expenses are stored on your device for offline access. This data never leaves your device unless you sync it.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Cloud Storage (Supabase):</strong> When connected to the internet, data is synced to our secure PostgreSQL database hosted by Supabase (ISO 27001 certified).</span>
            </li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
            All data is encrypted in transit using TLS 1.3. Database access is protected by row-level security
            policies ensuring you can only access your own data.
          </p>
        </section>

        {/* Your Rights */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Your Rights (GDPR)
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            Under GDPR, you have the following rights:
          </p>
          <ul className="space-y-3 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <div>
                <strong>Right to Access:</strong> Export all your data at any time via Settings → Export Data
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <div>
                <strong>Right to Rectification:</strong> Edit or correct any expense or settlement data directly in the app
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <div>
                <strong>Right to Erasure:</strong> Delete your account and all associated data via Settings → Delete Account
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <div>
                <strong>Right to Portability:</strong> Download your data in CSV format for use in other applications
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <div>
                <strong>Right to Object:</strong> Contact us to object to specific data processing activities
              </div>
            </li>
          </ul>
        </section>

        {/* Data Retention */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Data Retention
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            We retain your data as long as your account is active. If you delete your account, all data is
            permanently erased within 30 days. Accounts inactive for 3 consecutive years will be automatically
            deleted after email notification. You can request immediate deletion at any time.
          </p>
        </section>

        {/* Third-Party Services */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Third-Party Services
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            We use the following trusted third-party services:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Supabase:</strong> Database hosting and authentication (ISO 27001, SOC 2 Type II certified)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span><strong>Exchange Rate API:</strong> Currency conversion rates (no personal data shared)</span>
            </li>
          </ul>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Contact Us
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            For privacy questions, data requests, or to exercise your rights, contact us at:
          </p>
          <p className="text-ios-blue mt-2">
            <a href="mailto:privacy@splitwiser.app" className="underline">
              privacy@splitwiser.app
            </a>
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            We will respond to all requests within 30 days as required by GDPR.
          </p>
        </section>

        {/* Updates to Policy */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            Changes to This Policy
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            We may update this privacy policy from time to time. We will notify you of any material changes
            via email. Continued use of the service after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        {/* Footer Link */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/legal/terms"
            className="text-ios-blue hover:underline"
          >
            View Terms of Service →
          </Link>
        </div>
      </div>
    </div>
  );
}
