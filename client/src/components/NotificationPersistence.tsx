/**
 * Notification Persistence Component
 * Loads unread notifications from database on page load
 * Ensures users don't miss notifications if they refresh
 */

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';

export interface Notification {
  id: string;
  userId: string;
  type: 'message' | 'booking' | 'payment' | 'rating' | 'system';
  title: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

interface NotificationPersistenceProps {
  onNotificationsLoaded?: (notifications: Notification[]) => void;
  onNotificationReceived?: (notification: Notification) => void;
}

export function NotificationPersistence({
  onNotificationsLoaded,
  onNotificationReceived,
}: NotificationPersistenceProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load unread notifications on component mount
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadUnreadNotifications = async () => {
      try {
        setIsLoading(true);

        // Query unread notifications from database
        // This would be implemented in your TRPC router
        const response = await fetch(`/api/notifications/unread?userId=${user.id}`);

        if (!response.ok) {
          throw new Error('Failed to load notifications');
        }

        const data = await response.json();
        const loadedNotifications: Notification[] = data.notifications || [];

        setNotifications(loadedNotifications);

        // Call callback with loaded notifications
        if (onNotificationsLoaded) {
          onNotificationsLoaded(loadedNotifications);
        }

        // Log loaded notifications
        console.log(
          `[NotificationPersistence] Loaded ${loadedNotifications.length} unread notifications`
        );
      } catch (error) {
        console.error('[NotificationPersistence] Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUnreadNotifications();
  }, [user?.id, onNotificationsLoaded]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId
            ? { ...n, isRead: true }
            : n
        )
      );

      console.log(`[NotificationPersistence] Marked notification ${notificationId} as read`);
    } catch (error) {
      console.error('[NotificationPersistence] Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'PUT',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );

      console.log('[NotificationPersistence] Marked all notifications as read');
    } catch (error) {
      console.error('[NotificationPersistence] Error marking all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      // Update local state
      setNotifications(prev =>
        prev.filter(n => n.id !== notificationId)
      );

      console.log(`[NotificationPersistence] Deleted notification ${notificationId}`);
    } catch (error) {
      console.error('[NotificationPersistence] Error deleting notification:', error);
    }
  };

  // Delete all notifications
  const deleteAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete all notifications');
      }

      // Update local state
      setNotifications([]);

      console.log('[NotificationPersistence] Deleted all notifications');
    } catch (error) {
      console.error('[NotificationPersistence] Error deleting all notifications:', error);
    }
  };

  // Get unread count
  const getUnreadCount = (): number => {
    return notifications.filter(n => !n.isRead).length;
  };

  // Get notifications by type
  const getNotificationsByType = (type: Notification['type']): Notification[] => {
    return notifications.filter(n => n.type === type);
  };

  // This component doesn't render anything visible
  // It just manages notification persistence in the background
  return null;
}

// Hook for accessing notification persistence
export function useNotificationPersistence() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/notifications/unread?userId=${user.id}`);

        if (!response.ok) {
          throw new Error('Failed to load notifications');
        }

        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('[useNotificationPersistence] Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, [user?.id]);

  return {
    notifications,
    isLoading,
    unreadCount: notifications.filter(n => !n.isRead).length,
  };
}
