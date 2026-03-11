import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Hook for browser Notification API integration.
 * Shows desktop/mobile notifications when new in-app notifications arrive.
 * Works when the tab is in background or minimized.
 */
export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [isSupported] = useState(() => typeof Notification !== 'undefined');

  const requestPermission = useCallback(async () => {
    if (!isSupported) return 'denied' as NotificationPermission;
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return 'denied' as NotificationPermission;
    }
  }, [isSupported]);

  const showNotification = useCallback(
    (title: string, options?: NotificationOptions & { onClick?: () => void }) => {
      if (!isSupported || permission !== 'granted') return null;

      // Only show if page is not focused (user is away)
      if (document.hasFocus()) return null;

      try {
        const notification = new Notification(title, {
          icon: '/favicon-192.png',
          badge: '/favicon-192.png',
          tag: options?.tag || 'ologywood-notification',
          ...options,
        });

        if (options?.onClick) {
          notification.onclick = () => {
            window.focus();
            options.onClick!();
            notification.close();
          };
        } else {
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }

        // Auto-close after 8 seconds
        setTimeout(() => notification.close(), 8000);

        return notification;
      } catch {
        return null;
      }
    },
    [isSupported, permission]
  );

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
  };
}

/**
 * Hook that monitors unread count changes and triggers browser notifications.
 * Integrates with the existing tRPC notification polling system.
 */
export function useNotificationWatcher(unreadCount: number) {
  const prevCountRef = useRef(unreadCount);
  const { showNotification, permission } = useBrowserNotifications();

  useEffect(() => {
    // Only fire when count increases (new notification arrived)
    if (unreadCount > prevCountRef.current && permission === 'granted') {
      const newCount = unreadCount - prevCountRef.current;
      showNotification(
        newCount === 1
          ? 'New notification on Ologywood'
          : `${newCount} new notifications on Ologywood`,
        {
          body: 'Click to view your notifications',
          tag: 'ologywood-unread',
        }
      );
    }
    prevCountRef.current = unreadCount;
  }, [unreadCount, showNotification, permission]);
}
