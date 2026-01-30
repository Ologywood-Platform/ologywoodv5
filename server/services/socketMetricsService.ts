/**
 * Socket Metrics Service
 * Manages Socket.io metrics collection and real-time updates
 */

export interface SocketMetrics {
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

class SocketMetricsServiceClass {
  private metrics: SocketMetrics = {
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

  private metricsHistory: SocketMetrics[] = [];
  private maxHistorySize = 100;

  getMetrics(): SocketMetrics {
    return { ...this.metrics };
  }

  getMetricsHistory(limit: number = 20): SocketMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  recordConnection(): void {
    this.metrics.totalConnections++;
    this.metrics.activeConnections++;
    if (this.metrics.activeConnections > this.metrics.peakConnections) {
      this.metrics.peakConnections = this.metrics.activeConnections;
    }
    this.metrics.timestamp = new Date();
    this.saveMetricsSnapshot();
  }

  recordDisconnection(): void {
    if (this.metrics.activeConnections > 0) {
      this.metrics.activeConnections--;
    }
    this.metrics.disconnectedConnections++;
    this.metrics.timestamp = new Date();
    this.saveMetricsSnapshot();
  }

  recordMessageSent(latency?: number): void {
    this.metrics.messagesSent++;
    if (latency !== undefined) {
      this.updateAverageLatency(latency);
    }
    this.metrics.timestamp = new Date();
    this.saveMetricsSnapshot();
  }

  recordMessageReceived(latency?: number): void {
    this.metrics.messagesReceived++;
    if (latency !== undefined) {
      this.updateAverageLatency(latency);
    }
    this.metrics.timestamp = new Date();
    this.saveMetricsSnapshot();
  }

  recordNotificationSent(): void {
    this.metrics.notificationsSent++;
    this.metrics.timestamp = new Date();
    this.saveMetricsSnapshot();
  }

  private updateAverageLatency(newLatency: number): void {
    const totalMessages = this.metrics.messagesSent + this.metrics.messagesReceived;
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (totalMessages - 1) + newLatency) / totalMessages;
  }

  private saveMetricsSnapshot(): void {
    this.metricsHistory.push({ ...this.metrics });
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }
  }

  reset(): void {
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
    this.metricsHistory = [];
  }

  getSummary() {
    return {
      activeConnections: this.metrics.activeConnections,
      totalConnections: this.metrics.totalConnections,
      messagesSent: this.metrics.messagesSent,
      messagesReceived: this.metrics.messagesReceived,
      notificationsSent: this.metrics.notificationsSent,
      averageLatency: this.metrics.averageLatency,
      peakConnections: this.metrics.peakConnections,
    };
  }
}

export const SocketMetricsService = new SocketMetricsServiceClass();
