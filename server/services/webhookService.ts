/**
 * Webhook Service
 * Manages webhook subscriptions and event delivery for contract events
 */

export interface WebhookSubscription {
  id: string;
  userId: number;
  url: string;
  events: WebhookEventType[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
  failureCount: number;
  maxRetries: number;
}

export type WebhookEventType = 'contract.signed' | 'contract.archived' | 'contract.expired' | 'contract.created' | 'contract.updated';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  contractId: number;
  timestamp: Date;
  data: Record<string, any>;
  userId: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventId: string;
  status: 'pending' | 'delivered' | 'failed';
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  response?: {
    statusCode: number;
    body: string;
  };
}

export class WebhookService {
  /**
   * Create a new webhook subscription
   */
  static createSubscription(
    userId: number,
    url: string,
    events: WebhookEventType[],
    maxRetries: number = 5
  ): WebhookSubscription {
    return {
      id: `webhook_${userId}_${Date.now()}`,
      userId,
      url,
      events,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      failureCount: 0,
      maxRetries,
    };
  }

  /**
   * Create a webhook event
   */
  static createEvent(
    type: WebhookEventType,
    contractId: number,
    userId: number,
    data: Record<string, any>
  ): WebhookEvent {
    return {
      id: `event_${contractId}_${type}_${Date.now()}`,
      type,
      contractId,
      timestamp: new Date(),
      data,
      userId,
    };
  }

  /**
   * Create a webhook delivery record
   */
  static createDelivery(webhookId: string, eventId: string): WebhookDelivery {
    return {
      id: `delivery_${webhookId}_${eventId}_${Date.now()}`,
      webhookId,
      eventId,
      status: 'pending',
      attempts: 0,
    };
  }

  /**
   * Build webhook payload
   */
  static buildPayload(event: WebhookEvent, subscription: WebhookSubscription): string {
    const payload = {
      id: event.id,
      type: event.type,
      timestamp: event.timestamp.toISOString(),
      contractId: event.contractId,
      data: event.data,
      webhookId: subscription.id,
    };

    return JSON.stringify(payload);
  }

  /**
   * Generate retry delay (exponential backoff)
   */
  static getRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 5s, 25s, 125s, 625s, 3125s (max ~52 minutes)
    const baseDelay = 5000; // 5 seconds
    const maxDelay = 3600000; // 1 hour
    const delay = baseDelay * Math.pow(5, attemptNumber - 1);
    return Math.min(delay, maxDelay);
  }

  /**
   * Calculate next retry time
   */
  static calculateNextRetryTime(attemptNumber: number): Date {
    const delay = this.getRetryDelay(attemptNumber);
    const nextRetry = new Date();
    nextRetry.setMilliseconds(nextRetry.getMilliseconds() + delay);
    return nextRetry;
  }

  /**
   * Validate webhook URL
   */
  static isValidWebhookUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Filter subscriptions by event type
   */
  static filterSubscriptionsByEvent(
    subscriptions: WebhookSubscription[],
    eventType: WebhookEventType
  ): WebhookSubscription[] {
    return subscriptions.filter((sub) => sub.active && sub.events.includes(eventType));
  }

  /**
   * Generate webhook signature (HMAC-SHA256)
   */
  static generateSignature(payload: string, secret: string): string {
    const crypto = require('crypto');
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Format webhook delivery status
   */
  static formatDeliveryStatus(delivery: WebhookDelivery): string {
    let status = `Status: ${delivery.status.toUpperCase()}`;
    status += `\nAttempts: ${delivery.attempts}`;

    if (delivery.lastAttemptAt) {
      status += `\nLast Attempt: ${delivery.lastAttemptAt.toISOString()}`;
    }

    if (delivery.nextRetryAt) {
      status += `\nNext Retry: ${delivery.nextRetryAt.toISOString()}`;
    }

    if (delivery.response) {
      status += `\nResponse Code: ${delivery.response.statusCode}`;
    }

    return status;
  }

  /**
   * Generate webhook test event
   */
  static generateTestEvent(userId: number): WebhookEvent {
    return {
      id: `test_event_${Date.now()}`,
      type: 'contract.created',
      contractId: 0,
      timestamp: new Date(),
      data: {
        test: true,
        message: 'This is a test webhook event',
      },
      userId,
    };
  }

  /**
   * Get webhook statistics
   */
  static getStatistics(deliveries: WebhookDelivery[]): {
    total: number;
    delivered: number;
    failed: number;
    pending: number;
    successRate: number;
  } {
    const total = deliveries.length;
    const delivered = deliveries.filter((d) => d.status === 'delivered').length;
    const failed = deliveries.filter((d) => d.status === 'failed').length;
    const pending = deliveries.filter((d) => d.status === 'pending').length;
    const successRate = total > 0 ? (delivered / total) * 100 : 0;

    return {
      total,
      delivered,
      failed,
      pending,
      successRate,
    };
  }

  /**
   * Format webhook event for logging
   */
  static formatEventLog(event: WebhookEvent): string {
    return `[${event.timestamp.toISOString()}] ${event.type} - Contract #${event.contractId} - User #${event.userId}`;
  }
}
