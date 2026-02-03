import { EventEmitter } from 'events';

interface RealtimeNotification {
  id: string;
  userId: number;
  type: 'booking_request' | 'booking_approved' | 'booking_declined' | 'message' | 'payment' | 'verification';
  title: string;
  message: string;
  data: Record<string, any>;
  createdAt: Date;
  read: boolean;
}

interface NotificationSubscriber {
  userId: number;
  callback: (notification: RealtimeNotification) => void;
}

/**
 * Real-time notification service using EventEmitter
 * In production, this would use Socket.io or WebSocket directly
 */
class RealtimeNotificationService extends EventEmitter {
  private subscribers: Map<number, Set<NotificationSubscriber['callback']>> = new Map();
  private notificationHistory: Map<number, RealtimeNotification[]> = new Map();
  private maxHistorySize = 100;

  /**
   * Subscribe to notifications for a specific user
   */
  subscribe(userId: number, callback: (notification: RealtimeNotification) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set());
    }
    this.subscribers.get(userId)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(userId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(userId);
        }
      }
    };
  }

  /**
   * Send notification to a user
   */
  sendNotification(notification: RealtimeNotification): void {
    // Store in history
    if (!this.notificationHistory.has(notification.userId)) {
      this.notificationHistory.set(notification.userId, []);
    }
    const history = this.notificationHistory.get(notification.userId)!;
    history.push(notification);
    
    // Keep only recent notifications
    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    // Send to all subscribers
    const callbacks = this.subscribers.get(notification.userId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(notification);
        } catch (error) {
          console.error('[RealtimeNotification] Error in callback:', error);
        }
      });
    }

    // Emit event for logging/analytics
    this.emit('notification:sent', notification);
  }

  /**
   * Send booking request notification
   */
  sendBookingRequestNotification(data: {
    recipientId: number;
    senderName: string;
    bookingId: number;
    eventDate: string;
    eventDetails: string;
  }): void {
    const notification: RealtimeNotification = {
      id: `booking_${data.bookingId}_${Date.now()}`,
      userId: data.recipientId,
      type: 'booking_request',
      title: `New Booking Request from ${data.senderName}`,
      message: `${data.senderName} has requested to book you for ${new Date(data.eventDate).toLocaleDateString()}`,
      data: {
        bookingId: data.bookingId,
        senderName: data.senderName,
        eventDate: data.eventDate,
        eventDetails: data.eventDetails,
      },
      createdAt: new Date(),
      read: false,
    };

    this.sendNotification(notification);
  }

  /**
   * Send booking approved notification
   */
  sendBookingApprovedNotification(data: {
    recipientId: number;
    bookingId: number;
    eventDate: string;
  }): void {
    const notification: RealtimeNotification = {
      id: `approved_${data.bookingId}_${Date.now()}`,
      userId: data.recipientId,
      type: 'booking_approved',
      title: 'Booking Approved!',
      message: `Your booking for ${new Date(data.eventDate).toLocaleDateString()} has been approved`,
      data: {
        bookingId: data.bookingId,
        eventDate: data.eventDate,
      },
      createdAt: new Date(),
      read: false,
    };

    this.sendNotification(notification);
  }

  /**
   * Send booking declined notification
   */
  sendBookingDeclinedNotification(data: {
    recipientId: number;
    bookingId: number;
    reason?: string;
  }): void {
    const notification: RealtimeNotification = {
      id: `declined_${data.bookingId}_${Date.now()}`,
      userId: data.recipientId,
      type: 'booking_declined',
      title: 'Booking Declined',
      message: data.reason || 'Your booking request has been declined',
      data: {
        bookingId: data.bookingId,
        reason: data.reason,
      },
      createdAt: new Date(),
      read: false,
    };

    this.sendNotification(notification);
  }

  /**
   * Send message notification
   */
  sendMessageNotification(data: {
    recipientId: number;
    senderName: string;
    messagePreview: string;
    conversationId: number;
  }): void {
    const notification: RealtimeNotification = {
      id: `message_${data.conversationId}_${Date.now()}`,
      userId: data.recipientId,
      type: 'message',
      title: `New message from ${data.senderName}`,
      message: data.messagePreview,
      data: {
        conversationId: data.conversationId,
        senderName: data.senderName,
      },
      createdAt: new Date(),
      read: false,
    };

    this.sendNotification(notification);
  }

  /**
   * Send payment notification
   */
  sendPaymentNotification(data: {
    recipientId: number;
    amount: number;
    bookingId: number;
    status: 'success' | 'failed' | 'pending';
  }): void {
    const statusText = {
      success: 'Payment Received',
      failed: 'Payment Failed',
      pending: 'Payment Pending',
    };

    const notification: RealtimeNotification = {
      id: `payment_${data.bookingId}_${Date.now()}`,
      userId: data.recipientId,
      type: 'payment',
      title: statusText[data.status],
      message: `${statusText[data.status]} - $${(data.amount / 100).toFixed(2)}`,
      data: {
        bookingId: data.bookingId,
        amount: data.amount,
        status: data.status,
      },
      createdAt: new Date(),
      read: false,
    };

    this.sendNotification(notification);
  }

  /**
   * Send verification notification
   */
  sendVerificationNotification(data: {
    recipientId: number;
    type: 'approved' | 'rejected' | 'pending';
    message: string;
  }): void {
    const notification: RealtimeNotification = {
      id: `verification_${data.recipientId}_${Date.now()}`,
      userId: data.recipientId,
      type: 'verification',
      title: `Verification ${data.type === 'approved' ? 'Approved' : data.type === 'rejected' ? 'Rejected' : 'Pending'}`,
      message: data.message,
      data: {
        verificationStatus: data.type,
      },
      createdAt: new Date(),
      read: false,
    };

    this.sendNotification(notification);
  }

  /**
   * Get notification history for a user
   */
  getHistory(userId: number, limit: number = 50): RealtimeNotification[] {
    const history = this.notificationHistory.get(userId) || [];
    return history.slice(-limit).reverse();
  }

  /**
   * Mark notification as read
   */
  markAsRead(userId: number, notificationId: string): boolean {
    const history = this.notificationHistory.get(userId);
    if (!history) return false;

    const notification = history.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      return true;
    }
    return false;
  }

  /**
   * Get unread count for a user
   */
  getUnreadCount(userId: number): number {
    const history = this.notificationHistory.get(userId) || [];
    return history.filter(n => !n.read).length;
  }

  /**
   * Clear history for a user
   */
  clearHistory(userId: number): void {
    this.notificationHistory.delete(userId);
  }
}

export const realtimeNotificationService = new RealtimeNotificationService();
