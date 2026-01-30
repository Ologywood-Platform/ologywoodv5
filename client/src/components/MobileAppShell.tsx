import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface MobileAppShellProps {
  onDismiss?: () => void;
}

export function MobileAppShell({ onDismiss }: MobileAppShellProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    // Check if app is already installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    // Handle online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check if running as standalone app
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (isStandalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
      setIsInstalled(true);
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    onDismiss?.();
  };

  // Don't show on desktop
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null;
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-yellow-50 border-t border-yellow-200 px-4 py-3 z-40">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse" />
          <p className="text-sm text-yellow-800">You're offline. Some features may be limited.</p>
        </div>
      </div>
    );
  }

  // Show install prompt
  if (showPrompt && deferredPrompt && !isInstalled) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="px-4 py-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Install Ologywood</h3>
              <p className="text-xs text-gray-600 mt-1">
                Get quick access - add to your home screen for the best experience
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDismiss}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Install
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Service Worker Registration Hook
 * Enables offline support and caching
 */
export function useServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[ServiceWorker] Registered:', registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute
        })
        .catch((error) => {
          console.error('[ServiceWorker] Registration failed:', error);
        });

      // Listen for controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[ServiceWorker] Controller changed - app updated');
        // Optionally show update notification
      });
    }
  }, []);
}

/**
 * Offline Data Sync Hook
 * Queues actions when offline and syncs when online
 */
export function useOfflineSync() {
  const [syncQueue, setSyncQueue] = useState<Array<{ action: string; data: any }>>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const addToQueue = (action: string, data: any) => {
    setSyncQueue((prev) => [...prev, { action, data }]);
    localStorage.setItem('syncQueue', JSON.stringify([...syncQueue, { action, data }]));
  };

  const processSyncQueue = async () => {
    if (isSyncing || syncQueue.length === 0 || !navigator.onLine) return;

    setIsSyncing(true);
    try {
      for (const item of syncQueue) {
        console.log(`[OfflineSync] Processing: ${item.action}`, item.data);
        // TODO: Send to server
        // await fetch('/api/sync', { method: 'POST', body: JSON.stringify(item) });
      }
      setSyncQueue([]);
      localStorage.removeItem('syncQueue');
    } catch (error) {
      console.error('[OfflineSync] Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Load queue from localStorage
    const saved = localStorage.getItem('syncQueue');
    if (saved) {
      setSyncQueue(JSON.parse(saved));
    }

    // Process queue when online
    window.addEventListener('online', processSyncQueue);
    return () => window.removeEventListener('online', processSyncQueue);
  }, []);

  return { addToQueue, processSyncQueue, syncQueue, isSyncing };
}
