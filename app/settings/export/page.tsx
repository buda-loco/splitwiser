'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getAllExpenses, getAllSettlements } from '@/lib/db/stores';
import { motion } from 'framer-motion';
import { Download, FileText, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * Data Export Page (GDPR Compliance)
 *
 * Allows users to download all their data in CSV format.
 * Required by GDPR Article 20 (Right to Data Portability).
 */
export default function ExportDataPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportToCSV = async () => {
    if (!user) return;

    setExporting(true);
    setError(null);

    try {
      // Fetch all user data
      const expenses = await getAllExpenses();
      const settlements = await getAllSettlements();

      // Filter to only user's data
      const userExpenses = expenses.filter(
        (e) => e.created_by_user_id === user.id && !e.is_deleted
      );

      // Convert expenses to CSV
      const expenseCSV = convertExpensesToCSV(userExpenses);

      // Convert settlements to CSV
      const settlementCSV = convertSettlementsToCSV(settlements);

      // Create and download files
      downloadCSV(expenseCSV, 'splitwiser-expenses.csv');
      downloadCSV(settlementCSV, 'splitwiser-settlements.csv');

      setExported(true);
      setTimeout(() => setExported(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const convertExpensesToCSV = (expenses: any[]): string => {
    const headers = [
      'ID',
      'Date',
      'Description',
      'Category',
      'Amount',
      'Currency',
      'Created At',
    ];

    const rows = expenses.map((e) => [
      e.id,
      e.expense_date,
      `"${e.description}"`,
      e.category,
      e.amount,
      e.currency,
      e.created_at,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const convertSettlementsToCSV = (settlements: any[]): string => {
    const headers = [
      'ID',
      'From User ID',
      'To User ID',
      'Amount',
      'Currency',
      'Date',
      'Notes',
    ];

    const rows = settlements.map((s) => [
      s.id,
      s.from_user_id,
      s.to_user_id,
      s.amount,
      s.currency,
      s.settlement_date,
      `"${s.notes || ''}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Export Your Data
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Download all your expense and settlement data in CSV format
        </p>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Your Data, Your Rights
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                In compliance with GDPR Article 20, you can export all your data at any time.
                This includes all expenses you&apos;ve created and settlements you&apos;ve made.
              </p>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <motion.button
          onClick={exportToCSV}
          disabled={exporting || !user}
          className="w-full py-4 bg-ios-blue text-white rounded-xl font-semibold text-lg
                   disabled:opacity-50 disabled:cursor-not-allowed
                   active:bg-blue-600 transition-colors
                   flex items-center justify-center gap-2"
          whileTap={{ scale: 0.98 }}
        >
          {exporting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Download className="w-5 h-5" />
              </motion.div>
              Exporting...
            </>
          ) : exported ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Exported Successfully!
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Export Data as CSV
            </>
          )}
        </motion.button>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* What's Exported */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
            What will be exported:
          </h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>All expenses you&apos;ve created</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>All settlements you&apos;ve made</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Expense dates, amounts, categories, and descriptions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Settlement details and notes</span>
            </li>
          </ul>
        </div>

        {/* File Format Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            File Format
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Your data will be exported as CSV (Comma-Separated Values) files.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            You&apos;ll receive two files:
            <br />
            • <strong>splitwiser-expenses.csv</strong> - All your expenses
            <br />
            • <strong>splitwiser-settlements.csv</strong> - All your settlements
          </p>
        </div>
      </div>
    </div>
  );
}
