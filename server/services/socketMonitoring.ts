/**
 * Socket.io Connection Monitoring Service
 * Provides utilities for monitoring Socket.io connections and logging events
 */

import { logEvent, LogLevel, LogEventType } from '../middleware/logging';

export interface SocketConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  disconnectedConnections: number;
  messagesSent: number;
  messagesReceived: number;
  notificationsSent: number;
  averageLatency: number;
  peakConnections: number;
  timestamp: Date;
}

export interface SocketConnectionLog {
  userId: string;
  eventType: 'connect' | 'disconnect' | 'message' | 'notification' | 'error';
  socketId: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export class SocketMonitoringService {
  private static metrics: SocketConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    disconnectedConnections: 0,
    messagesSent: 0,
    messagesReceived: 0,
    notificationsSent: 0,
    averageLatency: 0,
    peakConnections: 0,
    timestamp: new Date(),
  };

  private static connectionLogs: SocketConnectionLog[] = [];
  private static latencies: number[] = [];

  /**
   * Log a socket connection event
   */
  static logConnection(
    userId: string,
    socketId: string,
    eventType: 'connect' | 'disconnect',
    metadata?: Record<string, any>
  ): void {
    const log: SocketConnectionLog = {
      userId,
      eventType,
      socketId,
      message: `Socket.io ${eventType} for user ${userId}`,
      metadata,
      timestamp: new Date(),
    };

    this.connectionLogs.push(log);

    if (eventType === 'connect') {
      this.metrics.totalConnections++;
      this.metrics.activeConnections++;

      if (this.metrics.activeConnections > this.metrics.peakConnections) {
        this.metrics.peakConnections = this.metrics.activeConnections;
      }

      logEvent({
        level: LogLevel.INFO,
        eventType: LogEventType.SERVER_STARTUP,
        message: `Socket.io connection established for user ${userId}`,
        details: {
          socketId,
          userId,
          activeConnections: this.metrics.activeConnections,
        },
      });
    } else if (eventType === 'disconnect') {
      this.metrics.activeConnections--;
      this.metrics.disconnectedConnections++;

      logEvent({
        level: LogLevel.INFO,
        eventType: LogEventType.SERVER_STARTUP,
        message: `Socket.io disconnection for user ${userId}`,
        details: {
          socketId,
          userId,
          activeConnections: this.metrics.activeConnections,
        },
      });
    }

    // Keep only last 1000 logs
    if (this.connectionLogs.length > 1000) {
      this.connectionLogs = this.connectionLogs.slice(-1000);
    }
  }

  /**
   * Log a message event
   */
  static logMessage(
    userId: string,
    socketId: string,
    direction: 'sent' | 'received',
    metadata?: Record<string, any>
  ): void {
    const log: SocketConnectionLog = {
      userId,
      eventType: 'message',
      socketId,
      message: `Message ${direction} for user ${userId}`,
      metadata,
      timestamp: new Date(),
    };

    this.connectionLogs.push(log);

    if (direction === 'sent') {
      this.metrics.messagesSent++;
    } else {
      this.metrics.messagesReceived++;
    }

    // Keep only last 1000 logs
    if (this.connectionLogs.length > 1000) {
      this.connectionLogs = this.connectionLogs.slice(-1000);
    }
  }

  /**
   * Log a notification event
   */
  static logNotification(
    userId: string,
    socketId: string,
    notificationType: string,
    metadata?: Record<string, any>
  ): void {
    const log: SocketConnectionLog = {
      userId,
      eventType: 'notification',
      socketId,
      message: `Notification sent to user ${userId} (type: ${notificationType})`,
      metadata: {
        ...metadata,
        notificationType,
      },
      timestamp: new Date(),
    };

    this.connectionLogs.push(log);
    this.metrics.notificationsSent++;

    logEvent({
      level: LogLevel.INFO,
      eventType: LogEventType.SERVER_STARTUP,
      message: `Notification sent to user ${userId}`,
      details: {
        socketId,
        userId,
        notificationType,
        ...metadata,
      },
    });

    // Keep only last 1000 logs
    if (this.connectionLogs.length > 1000) {
      this.connectionLogs = this.connectionLogs.slice(-1000);
    }
  }

  /**
   * Log an error event
   */
  static logError(
    userId: string,
    socketId: string,
    error: Error | string,
    metadata?: Record<string, any>
  ): void {
    const errorMessage = error instanceof Error ? error.message : error;

    const log: SocketConnectionLog = {
      userId,
      eventType: 'error',
      socketId,
      message: `Socket.io error for user ${userId}: ${errorMessage}`,
      metadata,
      timestamp: new Date(),
    };

    this.connectionLogs.push(log);

    logEvent({
      level: LogLevel.ERROR,
      eventType: LogEventType.SERVER_STARTUP,
      message: `Socket.io error for user ${userId}`,
      details: {
        socketId,
        userId,
        error: errorMessage,
        ...metadata,
      },
    });

    // Keep only last 1000 logs
    if (this.connectionLogs.length > 1000) {
      this.connectionLogs = this.connectionLogs.slice(-1000);
    }
  }

  /**
   * Record message latency
   */
  static recordLatency(latencyMs: number): void {
    this.latencies.push(latencyMs);

    // Keep only last 100 latency measurements
    if (this.latencies.length > 100) {
      this.latencies = this.latencies.slice(-100);
    }

    // Calculate average latency
    this.metrics.averageLatency =
      this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
  }

  /**
   * Get current metrics
   */
  static getMetrics(): SocketConnectionMetrics {
    return {
      ...this.metrics,
      timestamp: new Date(),
    };
  }

  /**
   * Get connection logs
   */
  static getConnectionLogs(limit: number = 100): SocketConnectionLog[] {
    return this.connectionLogs.slice(-limit);
  }

  /**
   * Get logs for specific user
   */
  static getUserLogs(userId: string, limit: number = 50): SocketConnectionLog[] {
    return this.connectionLogs
      .filter(log => log.userId === userId)
      .slice(-limit);
  }

  /**
   * Reset metrics
   */
  static resetMetrics(): void {
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      disconnectedConnections: 0,
      messagesSent: 0,
      messagesReceived: 0,
      notificationsSent: 0,
      averageLatency: 0,
      peakConnections: 0,
      timestamp: new Date(),
    };
    this.connectionLogs = [];
    this.latencies = [];
  }

  /**
   * Generate monitoring report
   */
  static generateReport(): string {
    const metrics = this.getMetrics();

    return `
╔════════════════════════════════════════════════════════════╗
║         Socket.io Connection Monitoring Report             ║
╠════════════════════════════════════════════════════════════╣
║ Total Connections: ${metrics.totalConnections}
║ Active Connections: ${metrics.activeConnections}
║ Disconnected Connections: ${metrics.disconnectedConnections}
║ Peak Connections: ${metrics.peakConnections}
║
║ Messages Sent: ${metrics.messagesSent}
║ Messages Received: ${metrics.messagesReceived}
║ Notifications Sent: ${metrics.notificationsSent}
║
║ Average Latency: ${metrics.averageLatency.toFixed(2)}ms
║ Timestamp: ${metrics.timestamp.toISOString()}
╚════════════════════════════════════════════════════════════╝
    `;
  }
}
