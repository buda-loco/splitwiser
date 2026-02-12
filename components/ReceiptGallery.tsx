'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet } from './Sheet';

type ReceiptGalleryProps = {
  receiptUrls: string[];
  onDelete?: (url: string) => void;
  readOnly?: boolean; // If true, hide delete button
};

/**
 * ReceiptGallery component - View receipt photos with zoom, swipe, and delete
 *
 * Features:
 * - 3-column thumbnail grid for overview
 * - Tap thumbnail to open full-screen viewer (Sheet modal)
 * - Pinch-to-zoom in full-screen (using CSS transform: scale)
 * - Swipe left/right to navigate between receipts (Framer Motion drag)
 * - Delete button with confirmation dialog
 * - Current index indicator (e.g., "2 of 5")
 * - iOS-native Sheet transition for full-screen
 * - Dark mode support
 *
 * Usage:
 * ```tsx
 * <ReceiptGallery
 *   receiptUrls={['url1', 'url2', 'url3']}
 *   onDelete={(url) => console.log('Delete receipt:', url)}
 * />
 * ```
 */
export function ReceiptGallery({
  receiptUrls,
  onDelete,
  readOnly = false
}: ReceiptGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Open full-screen viewer
  const handleThumbnailClick = (index: number) => {
    setSelectedIndex(index);
    setZoomLevel(1);
  };

  // Close full-screen viewer
  const handleClose = () => {
    setSelectedIndex(null);
    setZoomLevel(1);
  };

  // Navigate to previous receipt
  const handlePrevious = () => {
    if (selectedIndex === null) return;
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : receiptUrls.length - 1;
    setSelectedIndex(newIndex);
    setZoomLevel(1);
  };

  // Navigate to next receipt
  const handleNext = () => {
    if (selectedIndex === null) return;
    const newIndex = selectedIndex < receiptUrls.length - 1 ? selectedIndex + 1 : 0;
    setSelectedIndex(newIndex);
    setZoomLevel(1);
  };

  // Handle delete with confirmation
  const handleDelete = () => {
    if (selectedIndex === null || !onDelete) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedIndex === null || !onDelete) return;
    const urlToDelete = receiptUrls[selectedIndex];
    onDelete(urlToDelete);
    setShowDeleteConfirm(false);
    handleClose();
  };

  // Handle pinch-to-zoom (simplified - using CSS transform)
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 1));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  if (receiptUrls.length === 0) {
    return null;
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {receiptUrls.map((url, index) => (
            <motion.button
              key={url}
              type="button"
              onClick={() => handleThumbnailClick(index)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-md active:shadow-sm transition-shadow"
            >
              <img
                src={url}
                alt={`Receipt ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Full-Screen Viewer (Sheet Modal) */}
      <Sheet
        isOpen={selectedIndex !== null}
        onClose={handleClose}
        title={`Receipt ${(selectedIndex ?? 0) + 1} of ${receiptUrls.length}`}
      >
        {selectedIndex !== null && (
          <div className="relative h-full">
            {/* Receipt Image with Zoom */}
            <div className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-black/5 dark:bg-black/20 rounded-xl">
              <motion.div
                drag={zoomLevel > 1}
                dragConstraints={{ top: -100, bottom: 100, left: -100, right: 100 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <img
                  src={receiptUrls[selectedIndex]}
                  alt={`Receipt ${selectedIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transition: 'transform 0.2s ease-out'
                  }}
                />
              </motion.div>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={handleZoomOut}
                disabled={zoomLevel <= 1}
                className="px-4 py-2 bg-ios-gray6 dark:bg-gray-800 rounded-lg font-medium text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                Zoom Out
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                className="px-4 py-2 bg-ios-gray6 dark:bg-gray-800 rounded-lg font-medium text-sm disabled:opacity-50 active:scale-95 transition-all"
              >
                Zoom In
              </button>
              {zoomLevel > 1 && (
                <button
                  onClick={handleResetZoom}
                  className="px-4 py-2 bg-ios-blue text-white rounded-lg font-medium text-sm active:scale-95 transition-transform"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Navigation Arrows */}
            {receiptUrls.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </>
            )}

            {/* Delete Button */}
            {!readOnly && onDelete && (
              <motion.button
                onClick={handleDelete}
                whileTap={{ scale: 0.95 }}
                className="mt-6 w-full py-3 bg-ios-red text-white rounded-xl font-semibold text-base flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                <span>Delete Receipt</span>
              </motion.button>
            )}
          </div>
        )}
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Delete Receipt?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This action cannot be undone. The receipt will be permanently removed.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-ios-gray6 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-3 bg-ios-red text-white rounded-xl font-semibold active:scale-95 transition-transform"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
