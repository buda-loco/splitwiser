'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText } from 'lucide-react';

/**
 * Terms of Service Page
 *
 * Establishes the legal agreement between Splitwiser and its users.
 * Defines acceptable use, liability limits, and service terms.
 */
export default function TermsOfServicePage() {
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
          <FileText className="w-8 h-8 text-ios-blue" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Terms of Service
          </h1>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Last updated: February 12, 2026
        </p>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Acceptance */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            1. Acceptance of Terms
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            By creating an account and using Splitwiser, you agree to these Terms of Service. If you do not
            agree, please do not use our service. These terms constitute a legally binding agreement between
            you and Splitwiser.
          </p>
        </section>

        {/* Service Description */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            2. Service Description
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            Splitwiser is a Progressive Web Application (PWA) that helps you:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span>Track shared expenses with friends, roommates, and groups</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span>Calculate who owes whom and how much</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span>Record settlements when debts are paid back</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span>Organize expenses with tags and templates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-ios-blue mt-1">•</span>
              <span>Work offline with automatic sync when connected</span>
            </li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
            Splitwiser is a tool for tracking expenses, not a payment processor or financial service.
          </p>
        </section>

        {/* User Accounts */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            3. User Accounts and Security
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p className="leading-relaxed">
              <strong>Registration:</strong> You can create an account using your email address via passwordless
              magic link authentication. You are responsible for maintaining access to your email account.
            </p>
            <p className="leading-relaxed">
              <strong>Account Security:</strong> You are responsible for all activity under your account. Notify us
              immediately if you suspect unauthorized access.
            </p>
            <p className="leading-relaxed">
              <strong>Accurate Information:</strong> You agree to provide accurate information when creating expenses
              and settlements. Do not impersonate others or create fraudulent records.
            </p>
          </div>
        </section>

        {/* Acceptable Use */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            4. Acceptable Use Policy
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            You agree NOT to:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span>Use the service for illegal activities or money laundering</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span>Abuse, harass, or harm other users</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span>Attempt to hack, reverse engineer, or compromise the service</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span>Upload malware, viruses, or malicious code</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span>Scrape or systematically extract data from the service</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-1">✗</span>
              <span>Create fake accounts or automate account creation</span>
            </li>
          </ul>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed mt-3">
            Violation of these terms may result in immediate account termination.
          </p>
        </section>

        {/* Intellectual Property */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            5. Intellectual Property
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p className="leading-relaxed">
              <strong>Splitwiser Ownership:</strong> The Splitwiser application, including its design, code,
              features, and branding, is owned by Splitwiser and protected by copyright and other intellectual
              property laws.
            </p>
            <p className="leading-relaxed">
              <strong>Your Data:</strong> You retain all rights to your expense data, settlement records, and
              other content you create in the app. We do not claim ownership of your data.
            </p>
            <p className="leading-relaxed">
              <strong>License to Use:</strong> By using Splitwiser, you grant us a limited license to store and
              process your data to provide the service.
            </p>
          </div>
        </section>

        {/* Limitation of Liability */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            6. Limitation of Liability
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p className="leading-relaxed">
              <strong>Service Provided "As-Is":</strong> Splitwiser is provided without warranties of any kind.
              We do not guarantee the service will be error-free, uninterrupted, or meet your specific needs.
            </p>
            <p className="leading-relaxed">
              <strong>Not Financial Advice:</strong> Splitwiser is a record-keeping tool, not a financial advisor.
              Balance calculations are based on the data you input. We are not responsible for disputes between
              users or incorrect expense entries.
            </p>
            <p className="leading-relaxed">
              <strong>Data Loss:</strong> While we take precautions to protect your data, we cannot guarantee
              against data loss due to technical failures, security breaches, or other unforeseen events. You
              should regularly export your data as a backup.
            </p>
            <p className="leading-relaxed">
              <strong>Maximum Liability:</strong> Our total liability for any claims related to the service is
              limited to the amount you paid us in the past 12 months (currently $0 for free tier users).
            </p>
          </div>
        </section>

        {/* Changes to Terms */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            7. Changes to Terms
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            We may update these Terms of Service from time to time. We will notify you of material changes via
            email at least 30 days before they take effect. Continued use of the service after changes take
            effect constitutes your acceptance of the new terms. If you do not agree to the changes, you must
            stop using the service and delete your account.
          </p>
        </section>

        {/* Termination */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            8. Account Termination
          </h2>
          <div className="space-y-3 text-gray-700 dark:text-gray-300">
            <p className="leading-relaxed">
              <strong>Your Right to Terminate:</strong> You can delete your account at any time via Settings →
              Delete Account. All your data will be permanently erased within 30 days.
            </p>
            <p className="leading-relaxed">
              <strong>Our Right to Terminate:</strong> We reserve the right to suspend or terminate accounts that
              violate these terms, engage in abusive behavior, or for other legitimate reasons. We will provide
              notice when possible.
            </p>
            <p className="leading-relaxed">
              <strong>Data After Termination:</strong> After account deletion, your data is no longer accessible
              and will be permanently deleted. This action cannot be undone.
            </p>
          </div>
        </section>

        {/* Governing Law */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            9. Governing Law and Disputes
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            These terms are governed by the laws of the jurisdiction where Splitwiser operates. Any disputes
            will be resolved through good-faith negotiation first, then through binding arbitration if necessary.
            You agree to resolve disputes on an individual basis, not as part of a class action.
          </p>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
            10. Contact Information
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            For questions about these Terms of Service, contact us at:
          </p>
          <p className="text-ios-blue mt-2">
            <a href="mailto:legal@splitwiser.app" className="underline">
              legal@splitwiser.app
            </a>
          </p>
        </section>

        {/* Footer Link */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
          <Link
            href="/legal/privacy"
            className="text-ios-blue hover:underline"
          >
            View Privacy Policy →
          </Link>
        </div>
      </div>
    </div>
  );
}
