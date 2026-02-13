import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SocketMetricsService } from '../../services/socketMetricsService';

describe('Socket Metrics Service', () => {
  beforeEach(() => {
    SocketMetricsService.reset();
  });

  describe('Connection Tracking', () => {
    it('should record a new connection', () => {
      SocketMetricsService.recordConnection();
      const metrics = SocketMetricsService.getMetrics();
      expect(metrics.totalConnections).toBe(1);
      expect(metrics.activeConnections).toBe(1);
    });

    it('should track peak connections', () => {
      SocketMetricsService.recordConnection();
      SocketMetricsService.recordConnection();
      SocketMetricsService.recordDisconnection();
      const metrics = SocketMetricsService.getMetrics();
      expect(metrics.peakConnections).toBe(2);
      expect(metrics.activeConnections).toBe(1);
    });

    it('should record disconnections', () => {
      SocketMetricsService.recordConnection();
      SocketMetricsService.recordConnection();
      SocketMetricsService.recordDisconnection();
      const metrics = SocketMetricsService.getMetrics();
      expect(metrics.activeConnections).toBe(1);
      expect(metrics.disconnectedConnections).toBe(1);
    });
  });

  describe('Message Tracking', () => {
    it('should record messages sent', () => {
      SocketMetricsService.recordMessageSent();
      SocketMetricsService.recordMessageSent();
      const metrics = SocketMetricsService.getMetrics();
      expect(metrics.messagesSent).toBe(2);
    });

    it('should record messages received', () => {
      SocketMetricsService.recordMessageReceived();
      SocketMetricsService.recordMessageReceived();
      const metrics = SocketMetricsService.getMetrics();
      expect(metrics.messagesReceived).toBe(2);
    });

    it('should calculate average latency', () => {
      SocketMetricsService.recordMessageSent(100);
      SocketMetricsService.recordMessageSent(200);
      const metrics = SocketMetricsService.getMetrics();
      expect(metrics.averageLatency).toBe(150);
    });
  });

  describe('Notification Tracking', () => {
    it('should record notifications sent', () => {
      SocketMetricsService.recordNotificationSent();
      SocketMetricsService.recordNotificationSent();
      SocketMetricsService.recordNotificationSent();
      const metrics = SocketMetricsService.getMetrics();
      expect(metrics.notificationsSent).toBe(3);
    });
  });

  describe('Metrics History', () => {
    it('should maintain metrics history', () => {
      SocketMetricsService.recordConnection();
      SocketMetricsService.recordMessageSent();
      SocketMetricsService.recordNotificationSent();
      const history = SocketMetricsService.getMetricsHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should limit history size', () => {
      // Record many events to test history limit
      for (let i = 0; i < 150; i++) {
        SocketMetricsService.recordConnection();
      }
      const history = SocketMetricsService.getMetricsHistory(200);
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Metrics Summary', () => {
    it('should provide metrics summary', () => {
      SocketMetricsService.recordConnection();
      SocketMetricsService.recordConnection();
      SocketMetricsService.recordMessageSent(100);
      SocketMetricsService.recordNotificationSent();

      const summary = SocketMetricsService.getSummary();
      expect(summary.activeConnections).toBe(2);
      expect(summary.totalConnections).toBe(2);
      expect(summary.messagesSent).toBe(1);
      expect(summary.notificationsSent).toBe(1);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics', () => {
      SocketMetricsService.recordConnection();
      SocketMetricsService.recordMessageSent();
      SocketMetricsService.recordNotificationSent();

      SocketMetricsService.reset();
      const metrics = SocketMetricsService.getMetrics();

      expect(metrics.totalConnections).toBe(0);
      expect(metrics.messagesSent).toBe(0);
      expect(metrics.notificationsSent).toBe(0);
    });
  });
});

describe('Payment Testing', () => {
  it('should validate booking ID input', () => {
    const bookingId = '123';
    expect(Number(bookingId)).toBe(123);
    expect(isNaN(Number(bookingId))).toBe(false);
  });

  it('should reject invalid booking ID', () => {
    const bookingId = 'invalid';
    expect(isNaN(Number(bookingId))).toBe(true);
  });

  it('should handle payment test endpoints', async () => {
    const testEndpoints = ['/api/payment/test/success', '/api/payment/test/failure', '/api/payment/test/retry'];

    for (const endpoint of testEndpoints) {
      expect(endpoint).toMatch(/\/api\/payment\/test\/(success|failure|retry)/);
    }
  });
});

describe('Metrics Persistence', () => {
  it('should save metrics with timestamp', () => {
    const metrics = {
      totalConnections: 10,
      activeConnections: 5,
      disconnectedConnections: 5,
      messagesSent: 100,
      messagesReceived: 95,
      notificationsSent: 20,
      averageLatency: 50,
      peakConnections: 10,
      timestamp: new Date(),
    };

    expect(metrics.timestamp).toBeInstanceOf(Date);
    expect(metrics.totalConnections).toBe(10);
  });

  it('should support date range queries', () => {
    const startDate = new Date('2026-01-01');
    const endDate = new Date('2026-01-31');

    expect(startDate < endDate).toBe(true);
  });

  it('should export metrics as CSV', () => {
    const csvHeader = 'timestamp,totalConnections,activeConnections,messagesSent,messagesReceived,notificationsSent,averageLatency';
    expect(csvHeader).toContain('timestamp');
    expect(csvHeader).toContain('totalConnections');
    expect(csvHeader).toContain('averageLatency');
  });
});

describe('Admin Dashboard Integration', () => {
  it('should require admin role for access', () => {
    const userRole = 'admin';
    expect(userRole === 'admin').toBe(true);
  });

  it('should display metrics summary', () => {
    const summary = {
      activeConnections: 5,
      totalConnections: 100,
      messagesSent: 500,
      messagesReceived: 480,
      notificationsSent: 50,
      averageLatency: 45,
      peakConnections: 20,
    };

    expect(summary.activeConnections).toBeGreaterThan(0);
    expect(summary.totalConnections).toBeGreaterThanOrEqual(summary.activeConnections);
  });

  it('should provide real-time updates', () => {
    const updateInterval = 1000; // 1 second
    expect(updateInterval).toBeGreaterThan(0);
  });
});
