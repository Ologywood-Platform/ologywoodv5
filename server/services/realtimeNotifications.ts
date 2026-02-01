import { EventEmitter } from 'events';

export interface NotificationPayload {
  type: 'booking_request' | 'booking_confirmed' | 'booking_cancelled' | 'message' | 'review' | 'availability_update';
  userId: number;
  title: string;
  message: string;
  data: Record<string, any>;
  timestamp: Date;
}

class RealtimeNotificationService extends EventEmitter {
  private userConnections = new Map<number, Set<string>>();

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Register a user connection
   */
  registerConnection(userId: number, connectionId: string) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);
    console.log(`[Notifications] User ${userId} connected (${connectionId})`);
  }

  /**
   * Unregister a user connection
   */
  unregisterConnection(userId: number, connectionId: string) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(connectionId);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }
    console.log(`[Notifications] User ${userId} disconnected (${connectionId})`);
  }

  /**
   * Send notification to a specific user
   */
  notifyUser(payload: NotificationPayload) {
    const connections = this.userConnections.get(payload.userId);
    if (connections && connections.size > 0) {
      this.emit(`user:${payload.userId}`, payload);
      console.log(`[Notifications] Sent ${payload.type} to user ${payload.userId}`);
    } else {
      console.log(`[Notifications] User ${payload.userId} not connected, notification queued`);
    }
  }

  /**
   * Send notification to multiple users
   */
  notifyUsers(userIds: number[], payload: Omit<NotificationPayload, 'userId'>) {
    userIds.forEach(userId => {
      this.notifyUser({
        ...payload,
        userId,
      });
    });
  }

  /**
   * Broadcast notification to all connected users
   */
  broadcast(payload: Omit<NotificationPayload, 'userId'>) {
    this.emit('broadcast', payload);
    console.log(`[Notifications] Broadcast ${payload.type} to all users`);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userConnections.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: number): boolean {
    return this.userConnections.has(userId) && this.userConnections.get(userId)!.size > 0;
  }
}

export const realtimeNotificationService = new RealtimeNotificationService();

/**
 * Helper functions for common notification types
 */

export async function notifyBookingRequest(
  venueId: number,
  artistName: string,
  eventDate: Date,
  bookingId: number
) {
  realtimeNotificationService.notifyUser({
    type: 'booking_request',
    userId: venueId,
    title: 'New Booking Request',
    message: `${artistName} is interested in performing on ${eventDate.toLocaleDateString()}`,
    data: { bookingId, artistName, eventDate },
    timestamp: new Date(),
  });
}

export async function notifyBookingConfirmed(
  artistId: number,
  venueId: number,
  venueName: string,
  eventDate: Date,
  bookingId: number
) {
  // Notify artist
  realtimeNotificationService.notifyUser({
    type: 'booking_confirmed',
    userId: artistId,
    title: 'Booking Confirmed',
    message: `Your booking with ${venueName} on ${eventDate.toLocaleDateString()} is confirmed!`,
    data: { bookingId, venueName, eventDate },
    timestamp: new Date(),
  });

  // Notify venue
  realtimeNotificationService.notifyUser({
    type: 'booking_confirmed',
    userId: venueId,
    title: 'Booking Confirmed',
    message: `Booking confirmed for ${eventDate.toLocaleDateString()}`,
    data: { bookingId, eventDate },
    timestamp: new Date(),
  });
}

export async function notifyBookingCancelled(
  artistId: number,
  venueId: number,
  reason: string,
  bookingId: number
) {
  // Notify artist
  realtimeNotificationService.notifyUser({
    type: 'booking_cancelled',
    userId: artistId,
    title: 'Booking Cancelled',
    message: `A booking has been cancelled. Reason: ${reason}`,
    data: { bookingId, reason },
    timestamp: new Date(),
  });

  // Notify venue
  realtimeNotificationService.notifyUser({
    type: 'booking_cancelled',
    userId: venueId,
    title: 'Booking Cancelled',
    message: `A booking has been cancelled. Reason: ${reason}`,
    data: { bookingId, reason },
    timestamp: new Date(),
  });
}

export async function notifyNewMessage(
  recipientId: number,
  senderName: string,
  messagePreview: string,
  bookingId: number
) {
  realtimeNotificationService.notifyUser({
    type: 'message',
    userId: recipientId,
    title: 'New Message',
    message: `${senderName}: ${messagePreview}`,
    data: { bookingId, senderName, messagePreview },
    timestamp: new Date(),
  });
}

export async function notifyNewReview(
  recipientId: number,
  reviewerName: string,
  rating: number,
  reviewId: number
) {
  realtimeNotificationService.notifyUser({
    type: 'review',
    userId: recipientId,
    title: `New ${rating}-Star Review`,
    message: `${reviewerName} left a review: "${reviewerName}"`,
    data: { reviewId, reviewerName, rating },
    timestamp: new Date(),
  });
}

export async function notifyAvailabilityUpdate(
  favoredByUserIds: number[],
  artistName: string,
  availableDate: Date,
  artistId: number
) {
  favoredByUserIds.forEach(userId => {
    realtimeNotificationService.notifyUser({
      type: 'availability_update',
      userId,
      title: 'Artist Availability Updated',
      message: `${artistName} is now available on ${availableDate.toLocaleDateString()}`,
      data: { artistId, artistName, availableDate },
      timestamp: new Date(),
    });
  });
}
