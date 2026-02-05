import { syncEngine } from '@/lib/sync/engine';

export type NetworkStatus = {
  online: boolean;
  connection_type?: 'wifi' | 'cellular' | 'none' | 'unknown';
  effective_type?: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
};

export class NetworkStatusManager {
  private status: NetworkStatus = {
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    connection_type: 'unknown',
    effective_type: 'unknown'
  };

  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private syncOnReconnect = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initListeners();
      this.detectConnectionType();
    }
  }

  // Initialize online/offline event listeners
  private initListeners(): void {
    window.addEventListener('online', () => {
      this.status.online = true;
      this.notifyListeners();

      // Auto-sync when connection restored
      if (this.syncOnReconnect) {
        this.triggerSync();
      }
    });

    window.addEventListener('offline', () => {
      this.status.online = false;
      this.notifyListeners();
    });

    // Listen to connection changes (if available)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.detectConnectionType();
      });
    }
  }

  // Detect connection type using Network Information API
  private detectConnectionType(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      // connection.type: 'wifi', 'cellular', 'none', etc.
      this.status.connection_type = connection.type || 'unknown';

      // connection.effectiveType: '4g', '3g', '2g', 'slow-2g'
      this.status.effective_type = connection.effectiveType || 'unknown';

      this.notifyListeners();
    }
  }

  // Trigger sync manually or automatically
  private async triggerSync(): Promise<void> {
    try {
      await syncEngine.triggerSync();
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }

  // Subscribe to status changes
  subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status); // Call immediately with current status

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.status);
    }
  }

  // Get current status
  getStatus(): NetworkStatus {
    return { ...this.status };
  }

  // Enable/disable auto-sync on reconnect
  setAutoSync(enabled: boolean): void {
    this.syncOnReconnect = enabled;
  }
}

export const networkStatusManager = new NetworkStatusManager();
