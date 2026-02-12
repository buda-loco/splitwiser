'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, ImagePlus, X, Loader2 } from 'lucide-react';

type ReceiptUploadProps = {
  expenseId: string;
  onUpload: (fileUrl: string) => void;
  existingReceipts?: string[];
};

/**
 * ReceiptUpload component - Upload receipt photos with camera or file picker
 *
 * Features:
 * - Camera capture on mobile devices (rear camera)
 * - File picker for desktop and mobile
 * - Upload progress indicator (iOS-style progress bar)
 * - Thumbnail previews with remove functionality
 * - Framer Motion animations for smooth UX
 * - Dark mode support
 * - Error handling with toast notifications
 * - Responsive: Camera icon on mobile, ImagePlus on desktop
 *
 * Usage:
 * ```tsx
 * <ReceiptUpload
 *   expenseId="expense-123"
 *   onUpload={(url) => console.log('Receipt uploaded:', url)}
 *   existingReceipts={['url1', 'url2']}
 * />
 * ```
 */
export function ReceiptUpload({
  expenseId,
  onUpload,
  existingReceipts = []
}: ReceiptUploadProps) {
  const [receipts, setReceipts] = useState<string[]>(existingReceipts);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Detect mobile device on mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync with external receipts prop
  useEffect(() => {
    setReceipts(existingReceipts);
  }, [existingReceipts]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, WebP, or HEIC images.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      setTimeout(() => setError(null), 5000);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Import upload function dynamically to avoid circular deps
      const { uploadReceipt } = await import('@/lib/storage/receipts');

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const fileUrl = await uploadReceipt(expenseId, file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to receipts list
      setReceipts(prev => [...prev, fileUrl]);
      onUpload(fileUrl);

      // Reset states
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploading(false);
      setUploadProgress(0);
      setTimeout(() => setError(null), 5000);
    }

    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveReceipt = (index: number) => {
    setReceipts(prev => prev.filter((_, i) => i !== index));
  };

  const handleCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload buttons */}
      <div className="flex gap-3">
        {/* Camera button (mobile only) */}
        {isMobile && (
          <button
            onClick={handleCameraClick}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-ios-blue dark:bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
          >
            <Camera className="w-5 h-5" />
            <span>Camera</span>
          </button>
        )}

        {/* File picker button */}
        <button
          onClick={handleFileClick}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          <ImagePlus className="w-5 h-5" />
          <span>{isMobile ? 'Gallery' : 'Upload Image'}</span>
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload progress */}
      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.2 }}
                className="h-full bg-ios-blue dark:bg-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Compressing and uploading...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 bg-ios-red/10 dark:bg-red-900/20 border border-ios-red/20 dark:border-red-800 rounded-xl"
          >
            <p className="text-sm text-ios-red dark:text-red-400">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt thumbnails */}
      {receipts.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {receipts.map((url, index) => (
              <motion.div
                key={url}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-md"
              >
                {/* Thumbnail image */}
                <img
                  src={url}
                  alt={`Receipt ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Remove button */}
                <button
                  onClick={() => handleRemoveReceipt(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center active:scale-90 transition-transform"
                >
                  <X className="w-4 h-4 text-white" />
                </button>

                {/* Overlay on tap (for better visual feedback) */}
                <div className="absolute inset-0 bg-black/0 active:bg-black/10 transition-colors pointer-events-none" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
