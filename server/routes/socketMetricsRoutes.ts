/**
 * Socket.io Metrics Routes
 * Provides endpoints for retrieving real-time Socket.io metrics
 */

import { Router, Request, Response } from 'express';

const router = Router();

// In-memory metrics storage
let socketMetrics = {
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

/**
 * GET /api/socket/metrics
 * Get current Socket.io metrics
 */
router.get('/metrics', (req: Request, res: Response) => {
  res.json({
    success: true,
    metrics: socketMetrics,
  });
});

/**
 * POST /api/socket/metrics/update
 * Update Socket.io metrics (called from Socket.io service)
 */
router.post('/metrics/update', (req: Request, res: Response) => {
  try {
    const { activeConnections, messagesSent, messagesReceived, notificationsSent, averageLatency, peakConnections } = req.body;

    socketMetrics = {
      totalConnections: socketMetrics.totalConnections,
      activeConnections: activeConnections ?? socketMetrics.activeConnections,
      disconnectedConnections: socketMetrics.totalConnections - (activeConnections ?? socketMetrics.activeConnections),
      messagesSent: messagesSent ?? socketMetrics.messagesSent,
      messagesReceived: messagesReceived ?? socketMetrics.messagesReceived,
      notificationsSent: notificationsSent ?? socketMetrics.notificationsSent,
      averageLatency: averageLatency ?? socketMetrics.averageLatency,
      peakConnections: peakConnections ?? socketMetrics.peakConnections,
      timestamp: new Date(),
    };

    res.json({
      success: true,
      metrics: socketMetrics,
    });
  } catch (error) {
    console.error('[SocketMetricsRoutes] Error updating metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/socket/metrics/connection
 * Record a new connection
 */
router.post('/metrics/connection', (req: Request, res: Response) => {
  try {
    socketMetrics.totalConnections++;
    socketMetrics.activeConnections++;
    
    if (socketMetrics.activeConnections > socketMetrics.peakConnections) {
      socketMetrics.peakConnections = socketMetrics.activeConnections;
    }

    res.json({
      success: true,
      metrics: socketMetrics,
    });
  } catch (error) {
    console.error('[SocketMetricsRoutes] Error recording connection:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/socket/metrics/disconnection
 * Record a disconnection
 */
router.post('/metrics/disconnection', (req: Request, res: Response) => {
  try {
    if (socketMetrics.activeConnections > 0) {
      socketMetrics.activeConnections--;
    }
    socketMetrics.disconnectedConnections++;

    res.json({
      success: true,
      metrics: socketMetrics,
    });
  } catch (error) {
    console.error('[SocketMetricsRoutes] Error recording disconnection:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/socket/metrics/message
 * Record a message sent/received
 */
router.post('/metrics/message', (req: Request, res: Response) => {
  try {
    const { type, latency } = req.body;

    if (type === 'sent') {
      socketMetrics.messagesSent++;
    } else if (type === 'received') {
      socketMetrics.messagesReceived++;
    }

    if (latency) {
      // Update average latency
      const totalMessages = socketMetrics.messagesSent + socketMetrics.messagesReceived;
      socketMetrics.averageLatency = 
        (socketMetrics.averageLatency * (totalMessages - 1) + latency) / totalMessages;
    }

    res.json({
      success: true,
      metrics: socketMetrics,
    });
  } catch (error) {
    console.error('[SocketMetricsRoutes] Error recording message:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/socket/metrics/notification
 * Record a notification sent
 */
router.post('/metrics/notification', (req: Request, res: Response) => {
  try {
    socketMetrics.notificationsSent++;

    res.json({
      success: true,
      metrics: socketMetrics,
    });
  } catch (error) {
    console.error('[SocketMetricsRoutes] Error recording notification:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/socket/metrics/reset
 * Reset all metrics
 */
router.post('/metrics/reset', (req: Request, res: Response) => {
  try {
    socketMetrics = {
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

    res.json({
      success: true,
      message: 'Metrics reset successfully',
      metrics: socketMetrics,
    });
  } catch (error) {
    console.error('[SocketMetricsRoutes] Error resetting metrics:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
