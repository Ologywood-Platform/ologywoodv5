/**
 * Push Notifications Service
 * Handles browser push notifications and notification preferences
 */

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: Array<{
    action: string;
    title: string;
  }>;
  data?: Record<string, any>;
}

export interface NotificationPreferences {
  bookingUpdates: boolean;
  paymentNotifications: boolean;
  artistRecommendations: boolean;
  messages: boolean;
  systemAlerts: boolean;
  emailDigest: 'daily' | 'weekly' | 'never';
}

class PushNotificationsService {
  private static notificationStore = new Map<number, NotificationPreferences>();
  private static subscriptionStore = new Map<number, PushSubscriptionJSON>();

  /**
   * Register a user for push notifications
   */
  static async registerPushSubscription(
    userId: number,
    subscription: PushSubscriptionJSON
  ): Promise<void> {
    try {
      this.subscriptionStore.set(userId, subscription);
      console.log(`[PushNotifications] Registered subscription for user ${userId}`);
    } catch (error) {
      console.error('[PushNotifications] Error registering subscription:', error);
      throw error;
    }
  }

  /**
   * Unregister a user from push notifications
   */
  static async unregisterPushSubscription(userId: number): Promise<void> {
    try {
      this.subscriptionStore.delete(userId);
      console.log(`[PushNotifications] Unregistered subscription for user ${userId}`);
    } catch (error) {
      console.error('[PushNotifications] Error unregistering subscription:', error);
      throw error;
    }
  }

  /**
   * Send a push notification to a user
   */
  static async sendNotification(
    userId: number,
    payload: PushNotificationPayload
  ): Promise<void> {
    try {
      const subscription = this.subscriptionStore.get(userId);

      if (!subscription) {
        console.log(`[PushNotifications] No subscription found for user ${userId}`);
        return;
      }

      console.log(`[PushNotifications] Sending notification to user ${userId}:`, payload);

      // TODO: Integrate with web-push library to send actual notifications
      // const webpush = require('web-push');
      // await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
      console.error('[PushNotifications] Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Send booking confirmation notification
   */
  static async sendBookingConfirmation(
    userId: number,
    bookingDetails: {
      artistName: string;
      eventDate: string;
      eventLocation: string;
    }
  ): Promise<void> {
    const preferences = await this.getNotificationPreferences(userId);
    if (!preferences.bookingUpdates) return;

    const payload: PushNotificationPayload = {
      title: '✅ Booking Confirmed',
      body: `Your booking with ${bookingDetails.artistName} on ${bookingDetails.eventDate} is confirmed!`,
      tag: 'booking-confirmation',
      data: {
        type: 'booking',
        action: 'view-booking',
      },
    };

    await this.sendNotification(userId, payload);
  }

  /**
   * Send payment notification
   */
  static async sendPaymentNotification(
    userId: number,
    paymentDetails: {
      amount: number;
      status: 'success' | 'failed';
      bookingId?: number;
    }
  ): Promise<void> {
    const preferences = await this.getNotificationPreferences(userId);
    if (!preferences.paymentNotifications) return;

    const isSuccess = paymentDetails.status === 'success';
    const payload: PushNotificationPayload = {
      title: isSuccess ? '💳 Payment Received' : '❌ Payment Failed',
      body: isSuccess
        ? `Payment of $${paymentDetails.amount} has been processed successfully.`
        : `Payment of $${paymentDetails.amount} failed. Please try again.`,
      tag: 'payment-notification',
      data: {
        type: 'payment',
        status: paymentDetails.status,
        bookingId: paymentDetails.bookingId,
      },
    };

    await this.sendNotification(userId, payload);
  }

  /**
   * Send artist recommendation notification
   */
  static async sendArtistRecommendation(
    userId: number,
    artistDetails: {
      artistName: string;
      genre: string;
      rating: number;
    }
  ): Promise<void> {
    const preferences = await this.getNotificationPreferences(userId);
    if (!preferences.artistRecommendations) return;

    const payload: PushNotificationPayload = {
      title: '🎵 New Artist Recommendation',
      body: `Check out ${artistDetails.artistName} - ${artistDetails.genre} artist with ${artistDetails.rating}★ rating`,
      tag: 'artist-recommendation',
      data: {
        type: 'recommendation',
        action: 'view-artist',
      },
    };

    await this.sendNotification(userId, payload);
  }

  /**
   * Send message notification
   */
  static async sendMessageNotification(
    userId: number,
    messageDetails: {
      senderName: string;
      messagePreview: string;
      conversationId: number;
    }
  ): Promise<void> {
    const preferences = await this.getNotificationPreferences(userId);
    if (!preferences.messages) return;

    const payload: PushNotificationPayload = {
      title: `💬 Message from ${messageDetails.senderName}`,
      body: messageDetails.messagePreview.substring(0, 100),
      tag: `message-${messageDetails.conversationId}`,
      data: {
        type: 'message',
        conversationId: messageDetails.conversationId,
        action: 'view-message',
      },
    };

    await this.sendNotification(userId, payload);
  }

  /**
   * Send system alert notification
   */
  static async sendSystemAlert(
    userId: number,
    alertDetails: {
      title: string;
      message: string;
      severity: 'info' | 'warning' | 'error';
    }
  ): Promise<void> {
    const preferences = await this.getNotificationPreferences(userId);
    if (!preferences.systemAlerts) return;

    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
    };

    const payload: PushNotificationPayload = {
      title: `${severityEmoji[alertDetails.severity]} ${alertDetails.title}`,
      body: alertDetails.message,
      tag: 'system-alert',
      requireInteraction: alertDetails.severity === 'error',
      data: {
        type: 'system-alert',
        severity: alertDetails.severity,
      },
    };

    await this.sendNotification(userId, payload);
  }

  /**
   * Update notification preferences for a user
   */
  static async updateNotificationPreferences(
    userId: number,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const current = this.notificationStore.get(userId) || this.getDefaultPreferences();
      const updated = { ...current, ...preferences };
      this.notificationStore.set(userId, updated);
      console.log(`[PushNotifications] Updated preferences for user ${userId}`);
    } catch (error) {
      console.error('[PushNotifications] Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences for a user
   */
  static async getNotificationPreferences(userId: number): Promise<NotificationPreferences> {
    try {
      return this.notificationStore.get(userId) || this.getDefaultPreferences();
    } catch (error) {
      console.error('[PushNotifications] Error getting preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Get default notification preferences
   */
  private static getDefaultPreferences(): NotificationPreferences {
    return {
      bookingUpdates: true,
      paymentNotifications: true,
      artistRecommendations: true,
      messages: true,
      systemAlerts: true,
      emailDigest: 'weekly',
    };
  }

  /**
   * Send email digest for notifications
   */
  static async sendEmailDigest(
    userId: number,
    notifications: Array<{
      title: string;
      body: string;
      timestamp: Date;
    }>
  ): Promise<void> {
    try {
      console.log(
        `[PushNotifications] Sending email digest to user ${userId} with ${notifications.length} notifications`
      );

      // TODO: Integrate with email service (SendGrid, etc.)
      // Generate HTML email with notification summary
      // Send via email service
    } catch (error) {
      console.error('[PushNotifications] Error sending email digest:', error);
      throw error;
    }
  }
}

export { PushNotificationsService };
export default PushNotificationsService;
