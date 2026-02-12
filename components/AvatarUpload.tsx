'use client';

import { useState, useCallback } from 'react';
import { User, Upload } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';

interface AvatarUploadProps {
  value: string | null;
  onChange: (url: string) => void;
  userId: string;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Creates a cropped image from canvas
 */
async function createCroppedImage(
  imageSrc: string,
  pixelCrop: CropArea
): Promise<Blob> {
  const image = await createImageElement(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Set canvas size to match crop area
  canvas.width = 200;
  canvas.height = 200;

  // Draw cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    200,
    200
  );

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/jpeg',
      0.9
    );
  });
}

/**
 * Create image element from source
 */
function createImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = src;
  });
}

export function AvatarUpload({ value, onChange, userId }: AvatarUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);

  const onCropComplete = useCallback(
    (_croppedArea: CropArea, croppedAreaPixels: CropArea) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowCropModal(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCrop = async () => {
    if (!selectedImage || !croppedAreaPixels) return;

    setUploading(true);
    try {
      // Create cropped image blob
      const croppedBlob = await createCroppedImage(selectedImage, croppedAreaPixels);

      // Upload to Supabase Storage
      const supabase = createClient();
      const fileName = `avatar-${Date.now()}.jpg`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Call onChange with new URL
      onChange(publicUrl);

      // Close modal and reset state
      setShowCropModal(false);
      setSelectedImage(null);
      setCroppedAreaPixels(null);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setShowCropModal(false);
    setSelectedImage(null);
    setCroppedAreaPixels(null);
  };

  return (
    <>
      {/* Avatar Display */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => document.getElementById('avatar-input')?.click()}
          className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 active:scale-95 transition-transform"
        >
          {value ? (
            <img
              src={value}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
            <Upload className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity" />
          </div>
        </button>
        <input
          id="avatar-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Crop Modal */}
      <AnimatePresence>
        {showCropModal && selectedImage && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50"
              onClick={handleCancel}
            />

            {/* Modal Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl"
              style={{ maxHeight: '90vh' }}
            >
              {/* Handle Bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Crop Avatar
                </h2>
              </div>

              {/* Crop Area */}
              <div className="relative h-96 bg-gray-100 dark:bg-gray-800">
                <Cropper
                  image={selectedImage}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>

              {/* Zoom Slider */}
              <div className="px-6 py-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Zoom
                </label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Action Buttons */}
              <div className="px-4 pb-safe-bottom pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={uploading}
                  className="flex-1 py-3 px-4 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCrop}
                  disabled={uploading}
                  className="flex-1 py-3 px-4 bg-ios-blue text-white font-semibold rounded-lg active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                >
                  {uploading ? 'Uploading...' : 'Save'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
