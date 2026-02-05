'use client';

import { useEffect, useState } from 'react';
import { networkStatusManager, NetworkStatus } from '@/lib/network/status';

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>(
    networkStatusManager.getStatus()
  );

  useEffect(() => {
    // Subscribe to network status changes
    const unsubscribe = networkStatusManager.subscribe(setStatus);

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}
