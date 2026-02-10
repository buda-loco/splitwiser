'use client';

import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ReactNode } from 'react';

type SheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/**
 * Sheet component - Reusable iOS-style bottom sheet modal
 *
 * Features:
 * - Slide-up animation from bottom with spring transition
 * - Drag-to-dismiss gesture (drag down >100px or velocity >500)
 * - Backdrop tap to dismiss
 * - Rounded top corners with drag handle
 * - Optional title section
 * - Scrollable content area
 * - Safe area padding for notched devices
 * - Full dark mode support
 *
 * Usage:
 * ```tsx
 * <Sheet isOpen={isOpen} onClose={onClose} title="My Title">
 *   <div>Content here</div>
 * </Sheet>
 * ```
 */
export function Sheet({ isOpen, onClose, title, children }: SheetProps) {
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const shouldClose = info.offset.y > 100 || info.velocity.y > 500;

    if (shouldClose) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 z-40"
          />

          {/* Sheet modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, duration: 0.3 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl shadow-xl z-50 max-h-[85vh] flex flex-col"
          >
            {/* Drag handle */}
            <div className="flex justify-center py-3 flex-shrink-0">
              <div className="w-9 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>

            {/* Title section (if provided) */}
            {title && (
              <div className="px-4 pb-3 flex-shrink-0">
                <h2 className="text-lg font-semibold text-ios-blue dark:text-blue-400">
                  {title}
                </h2>
              </div>
            )}

            {/* Content area - scrollable */}
            <div className="flex-1 overflow-y-auto pb-safe-bottom">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
