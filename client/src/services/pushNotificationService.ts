/**
 * Push Notification Service
 * Handles browser push notifications for booking updates and important events
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: Record<string, any>;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize push notifications
   */
  async init(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  /**
   * Request permission for push notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return 'denied';
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return Notification.permission === 'granted';
  }

  /**
   * Send a notification
   */
  async notify(options: NotificationOptions): Promise<void> {
    if (!this.isEnabled() || !this.registration) {
      console.log('Notifications not enabled or service worker not ready');
      return;
    }

    try {
      await this.registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        badge: options.badge || '/favicon.png',
        tag: options.tag || 'ologywood-notification',
        requireInteraction: options.requireInteraction || false,
        actions: options.actions || [],
        data: options.data || {},
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  /**
   * Send booking request notification
   */
  async notifyBookingRequest(artistName: string, eventDate: string): Promise<void> {
    await this.notify({
      title: 'New Booking Request',
      body: `${artistName} wants to book you for ${eventDate}`,
      tag: 'booking-request',
      requireInteraction: true,
      actions: [
        { action: 'view', title: 'View Details' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      data: { type: 'booking-request' },
    });
  }

  /**
   * Send booking confirmation notification
   */
  async notifyBookingConfirmed(venueName: string): Promise<void> {
    await this.notify({
      title: 'Booking Confirmed',
      body: `Your booking with ${venueName} has been confirmed!`,
      tag: 'booking-confirmed',
      data: { type: 'booking-confirmed' },
    });
  }

  /**
   * Send message notification
   */
  async notifyMessage(senderName: string, preview: string): Promise<void> {
    await this.notify({
      title: `Message from ${senderName}`,
      body: preview,
      tag: 'message',
      requireInteraction: false,
      actions: [
        { action: 'reply', title: 'Reply' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
      data: { type: 'message', sender: senderName },
    });
  }

  /**
   * Send payment received notification
   */
  async notifyPaymentReceived(amount: string): Promise<void> {
    await this.notify({
      title: 'Payment Received',
      body: `You've received a payment of ${amount}`,
      tag: 'payment',
      data: { type: 'payment' },
    });
  }

  /**
   * Send event reminder notification
   */
  async notifyEventReminder(eventName: string, timeUntil: string): Promise<void> {
    await this.notify({
      title: 'Event Reminder',
      body: `${eventName} is coming up in ${timeUntil}`,
      tag: 'event-reminder',
      requireInteraction: false,
      data: { type: 'event-reminder' },
    });
  }
}

export const pushNotificationService = new PushNotificationService();
