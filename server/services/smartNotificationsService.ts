/**
 * Smart Notifications Service
 * Manages real-time alerts, email notifications, and digest summaries
 */

import { getDb } from '../db';
import { eq, and, gte, desc } from 'drizzle-orm';

export interface NotificationPreferences {
  userId: number;
  realTimeAlerts: boolean;
  emailNotifications: boolean;
  digestFrequency: 'daily' | 'weekly' | 'none';
  notificationTypes: {
    bookingRequests: boolean;
    bookingResponses: boolean;
    paymentUpdates: boolean;
    messages: boolean;
    reviews: boolean;
    systemUpdates: boolean;
  };
}

export interface Notification {
  id: string;
  userId: number;
  type: 'booking_request' | 'booking_response' | 'payment' | 'message' | 'review' | 'system';
  title: string;
  description: string;
  actionUrl: string;
  read: boolean;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface EmailDigest {
  userId: number;
  period: 'daily' | 'weekly';
  bookingRequests: number;
  bookingResponses: number;
  payments: number;
  messages: number;
  reviews: number;
  generatedAt: Date;
}

export class SmartNotificationsService {
  /**
   * Create booking request notification
   */
  static async notifyBookingRequest(
    artistId: number,
    bookingId: number,
    venueId: number,
    venueName: string
  ): Promise<void> {
    try {
      const notification: Notification = {
        id: `booking-req-${bookingId}-${Date.now()}`,
        userId: artistId,
        type: 'booking_request',
        title: `New Booking Request from ${venueName}`,
        description: `${venueName} is interested in booking you. Review and respond to the request.`,
        actionUrl: `/bookings/${bookingId}`,
        read: false,
        createdAt: new Date(),
        priority: 'high',
      };

      await this.storeNotification(notification);
      await this.sendRealTimeNotification(artistId, notification);
    } catch (error) {
      console.error('[Notifications] Error creating booking request notification:', error);
    }
  }

  /**
   * Create booking response notification
   */
  static async notifyBookingResponse(
    venueId: number,
    bookingId: number,
    artistName: string,
    response: 'accepted' | 'rejected' | 'countered'
  ): Promise<void> {
    try {
      const responseText = {
        accepted: 'accepted your booking request',
        rejected: 'declined your booking request',
        countered: 'sent a counter-offer for your booking',
      };

      const notification: Notification = {
        id: `booking-resp-${bookingId}-${Date.now()}`,
        userId: venueId,
        type: 'booking_response',
        title: `${artistName} ${responseText[response]}`,
        description: `Check the booking details and take action if needed.`,
        actionUrl: `/bookings/${bookingId}`,
        read: false,
        createdAt: new Date(),
        priority: response === 'accepted' ? 'high' : 'medium',
      };

      await this.storeNotification(notification);
      await this.sendRealTimeNotification(venueId, notification);
    } catch (error) {
      console.error('[Notifications] Error creating booking response notification:', error);
    }
  }

  /**
   * Create payment notification
   */
  static async notifyPaymentUpdate(
    userId: number,
    bookingId: number,
    status: 'deposit_received' | 'full_payment_received' | 'refund_processed',
    amount: number
  ): Promise<void> {
    try {
      const statusText = {
        deposit_received: 'Deposit received',
        full_payment_received: 'Full payment received',
        refund_processed: 'Refund processed',
      };

      const notification: Notification = {
        id: `payment-${bookingId}-${Date.now()}`,
        userId,
        type: 'payment',
        title: `${statusText[status]} - $${amount.toLocaleString()}`,
        description: `Payment for booking #${bookingId} has been processed.`,
        actionUrl: `/bookings/${bookingId}/payments`,
        read: false,
        createdAt: new Date(),
        priority: 'high',
      };

      await this.storeNotification(notification);
      await this.sendRealTimeNotification(userId, notification);
    } catch (error) {
      console.error('[Notifications] Error creating payment notification:', error);
    }
  }

  /**
   * Create message notification
   */
  static async notifyNewMessage(
    recipientId: number,
    senderId: number,
    senderName: string,
    messagePreview: string,
    bookingId: number
  ): Promise<void> {
    try {
      const notification: Notification = {
        id: `message-${bookingId}-${Date.now()}`,
        userId: recipientId,
        type: 'message',
        title: `New message from ${senderName}`,
        description: messagePreview.substring(0, 100),
        actionUrl: `/bookings/${bookingId}/messages`,
        read: false,
        createdAt: new Date(),
        priority: 'medium',
      };

      await this.storeNotification(notification);
      await this.sendRealTimeNotification(recipientId, notification);
    } catch (error) {
      console.error('[Notifications] Error creating message notification:', error);
    }
  }

  /**
   * Create review notification
   */
  static async notifyNewReview(
    userId: number,
    reviewerId: number,
    reviewerName: string,
    rating: number,
    comment: string
  ): Promise<void> {
    try {
      const notification: Notification = {
        id: `review-${reviewerId}-${Date.now()}`,
        userId,
        type: 'review',
        title: `${reviewerName} left a ${rating}-star review`,
        description: comment.substring(0, 100),
        actionUrl: `/profile/reviews`,
        read: false,
        createdAt: new Date(),
        priority: rating < 3 ? 'high' : 'low',
      };

      await this.storeNotification(notification);
      await this.sendRealTimeNotification(userId, notification);
    } catch (error) {
      console.error('[Notifications] Error creating review notification:', error);
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(
    userId: number,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      // In production, fetch from database
      // For now, return empty array
      return [];
    } catch (error) {
      console.error('[Notifications] Error fetching user notifications:', error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      // In production, update database
      console.log(`[Notifications] Marked notification ${notificationId} as read`);
    } catch (error) {
      console.error('[Notifications] Error marking notification as read:', error);
    }
  }

  /**
   * Get notification preferences
   */
  static async getPreferences(userId: number): Promise<NotificationPreferences> {
    try {
      // In production, fetch from database
      return {
        userId,
        realTimeAlerts: true,
        emailNotifications: true,
        digestFrequency: 'daily',
        notificationTypes: {
          bookingRequests: true,
          bookingResponses: true,
          paymentUpdates: true,
          messages: true,
          reviews: true,
          systemUpdates: true,
        },
      };
    } catch (error) {
      console.error('[Notifications] Error fetching preferences:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Update notification preferences
   */
  static async updatePreferences(
    userId: number,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      // In production, update database
      const current = await this.getPreferences(userId);
      return { ...current, ...preferences };
    } catch (error) {
      console.error('[Notifications] Error updating preferences:', error);
      return this.getDefaultPreferences(userId);
    }
  }

  /**
   * Generate daily email digest
   */
  static async generateDailyDigest(userId: number): Promise<EmailDigest | null> {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // In production, aggregate notifications from database
      const digest: EmailDigest = {
        userId,
        period: 'daily',
        bookingRequests: 0,
        bookingResponses: 0,
        payments: 0,
        messages: 0,
        reviews: 0,
        generatedAt: new Date(),
      };

      return digest;
    } catch (error) {
      console.error('[Notifications] Error generating daily digest:', error);
      return null;
    }
  }

  /**
   * Generate weekly email digest
   */
  static async generateWeeklyDigest(userId: number): Promise<EmailDigest | null> {
    try {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);

      // In production, aggregate notifications from database
      const digest: EmailDigest = {
        userId,
        period: 'weekly',
        bookingRequests: 0,
        bookingResponses: 0,
        payments: 0,
        messages: 0,
        reviews: 0,
        generatedAt: new Date(),
      };

      return digest;
    } catch (error) {
      console.error('[Notifications] Error generating weekly digest:', error);
      return null;
    }
  }

  /**
   * Send email digest
   */
  static async sendEmailDigest(userId: number, digest: EmailDigest): Promise<void> {
    try {
      console.log(`[Notifications] Sending ${digest.period} digest to user ${userId}`);
      // In production, integrate with SendGrid
    } catch (error) {
      console.error('[Notifications] Error sending email digest:', error);
    }
  }

  /**
   * Store notification in database
   */
  private static async storeNotification(notification: Notification): Promise<void> {
    try {
      // In production, save to database
      console.log(`[Notifications] Stored notification: ${notification.id}`);
    } catch (error) {
      console.error('[Notifications] Error storing notification:', error);
    }
  }

  /**
   * Send real-time notification via Socket.io
   */
  private static async sendRealTimeNotification(userId: number, notification: Notification): Promise<void> {
    try {
      // In production, emit via Socket.io
      console.log(`[Notifications] Real-time notification sent to user ${userId}`);
    } catch (error) {
      console.error('[Notifications] Error sending real-time notification:', error);
    }
  }

  /**
   * Get default preferences
   */
  private static getDefaultPreferences(userId: number): NotificationPreferences {
    return {
      userId,
      realTimeAlerts: true,
      emailNotifications: true,
      digestFrequency: 'daily',
      notificationTypes: {
        bookingRequests: true,
        bookingResponses: true,
        paymentUpdates: true,
        messages: true,
        reviews: true,
        systemUpdates: true,
      },
    };
  }
}

export const smartNotificationsService = new SmartNotificationsService();
