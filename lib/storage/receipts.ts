/**
 * Receipt upload utilities with image compression and offline queueing
 *
 * This module provides functions for uploading receipt photos to Supabase Storage
 * with automatic image compression to reduce bandwidth and storage costs.
 * Implements offline-first pattern: queues uploads if no network available.
 */

import { createClient } from '@/lib/supabase/client';
import { getDatabase, promisifyRequest, STORES } from '@/lib/db/indexeddb';

/**
 * Compress an image file using Canvas API
 *
 * Reduces image dimensions and quality to optimize for web storage.
 * Maintains aspect ratio while limiting maximum width.
 *
 * @param file - Original image file
 * @param maxWidth - Maximum width in pixels (default: 1200)
 * @param quality - JPEG compression quality 0-1 (default: 0.8)
 * @returns Promise resolving to compressed Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Create image element
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read image file'));
    };

    img.onload = () => {
      // Calculate scaled dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      // Create canvas and draw scaled image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to Blob with compression
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Start the process
    reader.readAsDataURL(file);
  });
}

/**
 * Generate unique filename for receipt
 *
 * @returns Filename in format: {timestamp}_{random}.jpg
 */
function generateFilename(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}_${random}.jpg`;
}

/**
 * Get current user ID from Supabase auth
 *
 * @returns User ID or null if not authenticated
 */
async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('Failed to get current user:', error);
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Check if network is available
 *
 * @returns true if online, false if offline
 */
function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Upload receipt to Supabase Storage (main function)
 *
 * Implements offline-first pattern:
 * - If online: compresses and uploads immediately
 * - If offline: queues upload to IndexedDB for later sync
 *
 * @param expenseId - ID of expense this receipt belongs to
 * @param file - Image file to upload
 * @param userId - Optional user ID (fetched automatically if not provided)
 * @returns Promise resolving to public URL of uploaded receipt
 */
export async function uploadReceipt(
  expenseId: string,
  file: File,
  userId?: string
): Promise<string> {
  // Get user ID
  const currentUserId = userId || await getCurrentUserId();
  if (!currentUserId) {
    throw new Error('User not authenticated');
  }

  // Compress image
  const compressedBlob = await compressImage(file);

  // Generate unique filename
  const filename = generateFilename();

  // Build storage path: receipts/{userId}/{expenseId}/{filename}
  const storagePath = `${currentUserId}/${expenseId}/${filename}`;

  // Check if online
  if (!isOnline()) {
    // Queue upload for later
    await queueReceiptUpload(expenseId, compressedBlob, storagePath, currentUserId);

    // Return placeholder URL (will be replaced when upload completes)
    return `pending://${storagePath}`;
  }

  try {
    // Upload to Supabase Storage
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from('receipts')
      .upload(storagePath, compressedBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const publicUrl = getReceiptUrl(data.path);
    return publicUrl;
  } catch (error) {
    console.error('Failed to upload receipt:', error);

    // If upload fails, queue for retry
    await queueReceiptUpload(expenseId, compressedBlob, storagePath, currentUserId);

    // Return pending URL
    return `pending://${storagePath}`;
  }
}

/**
 * Queue receipt upload to IndexedDB for later sync
 *
 * @param expenseId - Expense ID
 * @param blob - Compressed image blob
 * @param storagePath - Supabase Storage path
 * @param userId - User ID
 */
async function queueReceiptUpload(
  expenseId: string,
  blob: Blob,
  storagePath: string,
  userId: string
): Promise<void> {
  const db = await getDatabase();

  // Convert blob to base64 for storage
  const reader = new FileReader();
  const base64Data = await new Promise<string>((resolve, reject) => {
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data (remove "data:image/jpeg;base64," prefix)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });

  // Create pending upload record
  const pendingUpload = {
    id: crypto.randomUUID(),
    expense_id: expenseId,
    user_id: userId,
    storage_path: storagePath,
    image_data: base64Data,
    status: 'pending',
    created_at: new Date().toISOString(),
    retry_count: 0,
  };

  // Store in SYNC_QUEUE (reuse existing sync infrastructure)
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);

  const operation = {
    id: pendingUpload.id,
    type: 'upload_receipt',
    table: 'receipts',
    record_id: expenseId,
    data: pendingUpload,
    timestamp: pendingUpload.created_at,
    status: 'pending',
  };

  await promisifyRequest(store.add(operation));

  console.log('Receipt upload queued for later sync:', storagePath);
}

/**
 * Get public URL for a receipt from storage path
 *
 * @param path - Storage path (e.g., "userId/expenseId/filename.jpg")
 * @returns Public URL for accessing the receipt
 */
export function getReceiptUrl(path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage
    .from('receipts')
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Delete receipt from Supabase Storage
 *
 * @param path - Storage path to delete
 * @returns Promise resolving to success boolean
 */
export async function deleteReceipt(path: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase.storage
      .from('receipts')
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to delete receipt:', error);
    return false;
  }
}

/**
 * Process pending receipt uploads from queue
 *
 * Called by sync engine when network becomes available.
 * Attempts to upload all queued receipts.
 *
 * @returns Promise resolving to number of successful uploads
 */
export async function processPendingReceiptUploads(): Promise<number> {
  const db = await getDatabase();
  const transaction = db.transaction([STORES.SYNC_QUEUE], 'readonly');
  const store = transaction.objectStore(STORES.SYNC_QUEUE);

  // Get all pending receipt uploads
  const allOperations = await promisifyRequest(store.getAll());
  const receiptUploads = allOperations.filter(
    (op: any) => op.type === 'upload_receipt' && op.status === 'pending'
  );

  let successCount = 0;

  for (const operation of receiptUploads) {
    try {
      const { storage_path, image_data } = operation.data;

      // Convert base64 back to Blob
      const byteString = atob(image_data);
      const arrayBuffer = new ArrayBuffer(byteString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < byteString.length; i++) {
        uint8Array[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([uint8Array], { type: 'image/jpeg' });

      // Upload to Supabase
      const supabase = createClient();
      const { error } = await supabase.storage
        .from('receipts')
        .upload(storage_path, blob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        console.error('Failed to upload queued receipt:', error);
        continue;
      }

      // Mark as synced
      const writeTransaction = db.transaction([STORES.SYNC_QUEUE], 'readwrite');
      const writeStore = writeTransaction.objectStore(STORES.SYNC_QUEUE);
      const updatedOperation = { ...operation, status: 'synced' };
      await promisifyRequest(writeStore.put(updatedOperation));

      successCount++;
    } catch (error) {
      console.error('Error processing pending receipt upload:', error);
    }
  }

  return successCount;
}
