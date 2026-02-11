'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, Clock, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { queueManager } from '@/lib/offline/queue';
import { syncEngine } from '@/lib/sync/engine';

export function SyncIndicator() {
  const { online } = useNetworkStatus();
  const [syncStatus, setSyncStatus] = useState<{
    pending: number;
    syncing: boolean;
  }>({
    pending: 0,
    syncing: false
  });

  // Update sync status periodically
  useEffect(() => {
    async function checkSyncStatus() {
      try {
        const { pending } = await queueManager.getQueueSize();
        const status = syncEngine.getStatus();

        setSyncStatus({
          pending,
          syncing: status.is_syncing
        });
      } catch {
        // IndexedDB may be unavailable (e.g. Safari private browsing)
      }
    }

    checkSyncStatus();

    // Poll every 2 seconds when there are pending operations
    const interval = setInterval(checkSyncStatus, 2000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const getIndicatorState = () => {
    if (!online) {
      return { color: 'bg-yellow-500', text: 'Offline', icon: <WifiOff className="w-4 h-4" /> };
    } else if (syncStatus.syncing) {
      return { color: 'bg-blue-500', text: 'Syncing...', icon: <RefreshCw className="w-4 h-4" /> };
    } else if (syncStatus.pending > 0) {
      return { color: 'bg-orange-500', text: `${syncStatus.pending} pending`, icon: <Clock className="w-4 h-4" /> };
    } else {
      return { color: 'bg-green-500', text: 'Synced', icon: <Wifi className="w-4 h-4" /> };
    }
  };

  const indicator = getIndicatorState();

  // Only show when offline or syncing/pending
  const shouldShow = !online || syncStatus.syncing || syncStatus.pending > 0;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-50 pointer-events-none"
        >
          <div className="max-w-md mx-auto px-4 pt-safe">
            <div
              className={`
                ${indicator.color}
                text-white text-sm font-medium
                px-4 py-2 rounded-full
                shadow-lg
                flex items-center justify-center gap-2
              `}
            >
              <span className={syncStatus.syncing ? "animate-spin-slow" : ""}>{indicator.icon}</span>
              <span>{indicator.text}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
