'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { Sheet } from '@/components/Sheet';

export type DateRange = {
  start: Date;
  end: Date;
  preset: string;
};

type DateRangeSelectorProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
};

const presets = [
  'This Week',
  'This Month',
  'Last 3 Months',
  'This Year',
  'All Time',
  'Custom',
] as const;

/**
 * Helper function to convert preset string to start/end dates
 */
export function getDateRangePreset(preset: string): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'This Week': {
      const dayOfWeek = today.getDay();
      const start = new Date(today);
      start.setDate(today.getDate() - dayOfWeek); // Sunday
      return { start, end: new Date() };
    }

    case 'This Month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: new Date() };
    }

    case 'Last 3 Months': {
      const start = new Date(now);
      start.setMonth(now.getMonth() - 3);
      return { start, end: new Date() };
    }

    case 'This Year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end: new Date() };
    }

    case 'All Time': {
      const start = new Date(2020, 0, 1); // Arbitrary past date
      return { start, end: new Date() };
    }

    default:
      return { start: today, end: new Date() };
  }
}

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState(
    value.start.toISOString().split('T')[0]
  );
  const [customEnd, setCustomEnd] = useState(
    value.end.toISOString().split('T')[0]
  );

  const handlePresetClick = (preset: string) => {
    if (preset === 'Custom') {
      setShowCustomPicker(true);
    } else {
      const range = getDateRangePreset(preset);
      onChange({
        start: range.start,
        end: range.end,
        preset,
      });
    }
  };

  const handleCustomApply = () => {
    onChange({
      start: new Date(customStart),
      end: new Date(customEnd),
      preset: 'Custom',
    });
    setShowCustomPicker(false);
  };

  return (
    <>
      {/* Horizontal scrollable tabs */}
      <div className="overflow-x-auto hide-scrollbar">
        <div className="flex gap-2 min-w-max">
          {presets.map((preset) => {
            const isActive = value.preset === preset;
            return (
              <motion.button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`
                  relative px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
                  transition-colors
                  ${
                    isActive
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                `}
                whileTap={{ scale: 0.95 }}
              >
                {preset === 'Custom' && (
                  <Calendar className="w-4 h-4 inline-block mr-1 -mt-0.5" />
                )}
                {preset}
                {isActive && (
                  <motion.div
                    layoutId="activePreset"
                    className="absolute inset-0 bg-ios-blue rounded-full -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Custom date picker sheet */}
      <AnimatePresence>
        {showCustomPicker && (
          <Sheet
            isOpen={showCustomPicker}
            onClose={() => setShowCustomPicker(false)}
            title="Select Custom Range"
          >
            <div className="p-4 space-y-4">
              {/* Start Date */}
              <div>
                <label
                  htmlFor="start-date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Start Date
                </label>
                <input
                  id="start-date"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ios-blue"
                />
              </div>

              {/* End Date */}
              <div>
                <label
                  htmlFor="end-date"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-ios-blue"
                />
              </div>

              {/* Apply Button */}
              <button
                onClick={handleCustomApply}
                className="w-full bg-ios-blue text-white font-semibold py-3 px-4 rounded-lg hover:bg-ios-blue/90 transition-colors"
              >
                Apply
              </button>
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  );
}
