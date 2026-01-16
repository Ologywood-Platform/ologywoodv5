/**
 * Ologywood Server Entry Point
 * Integrates all security, logging, and performance middleware
 */

import express, { Express } from 'express';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './routers';
import { createTRPCContext } from './_core/trpc';
import { configureServer, printSecuritySetup } from './middleware/serverConfig';
import { createExternalLoggingService } from './services/externalLoggingService';
import { DatabaseOptimizationService } from './services/databaseOptimization';
import { logEvent, LogLevel, LogEventType } from './middleware/logging';

/**
 * Initialize server with all middleware and services
 */
async function initializeServer(): Promise<void> {
  const app = express();

  // Initialize external logging service
  const externalLogger = createExternalLoggingService();
  const dbOptimization = new DatabaseOptimizationService();

  // Configure all security middleware
  configureServer(app);
  printSecuritySetup();

  // Log server startup
  logEvent({
    level: LogLevel.INFO,
    eventType: LogEventType.SERVER_START,
    message: 'Server initializing with security middleware',
    details: {
      environment: process.env.NODE_ENV,
      externalLoggingEnabled: !!externalLogger,
      port: process.env.PORT || 3000,
    },
  });

  // Create TRPC HTTP server
  const trpcServer = createHTTPServer({
    middleware: express.json(),
    router: appRouter,
    createContext: createTRPCContext,
  });

  // Mount TRPC routes
  app.use('/trpc', trpcServer);

  // Health check endpoint
  app.get('/health', (req, res) => {
    const metrics = dbOptimization.getMetrics();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        queryCount: metrics.queryCount,
        averageQueryTime: `${metrics.averageQueryTime.toFixed(2)}ms`,
        cacheHitRate: `${(metrics.cacheHitRate * 100).toFixed(2)}%`,
      },
      logging: externalLogger?.getStatus(),
    });
  });

  // Status endpoint
  app.get('/status', (req, res) => {
    res.json({
      status: 'running',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION || '1.0.0',
    });
  });

  // Metrics endpoint
  app.get('/metrics', (req, res) => {
    const metrics = dbOptimization.getMetrics();
    const suggestions = dbOptimization.getOptimizationSuggestions();

    res.json({
      database: metrics,
      suggestions,
      timestamp: new Date().toISOString(),
    });
  });

  // Start server
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════╗
║         Ologywood Server Started Successfully              ║
╠════════════════════════════════════════════════════════════╣
║ Port: ${PORT}                                                 ║
║ Environment: ${process.env.NODE_ENV || 'development'}                                   ║
║ External Logging: ${externalLogger ? 'ENABLED' : 'DISABLED'}                              ║
║ Security Middleware: ENABLED                               ║
║ Database Optimization: ENABLED                             ║
║                                                            ║
║ Health Check: GET /health                                  ║
║ Status: GET /status                                        ║
║ Metrics: GET /metrics                                      ║
║ TRPC: /trpc                                                ║
╚════════════════════════════════════════════════════════════╝
    `);

    logEvent({
      level: LogLevel.INFO,
      eventType: LogEventType.SERVER_STARTUP,
      message: `Server started on port ${PORT}`,
      details: {
        port: PORT,
        environment: process.env.NODE_ENV,
        externalLogging: !!externalLogger,
      },
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         Shutting Down Gracefully...                        ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    logEvent({
      level: LogLevel.INFO,
      eventType: LogEventType.SERVER_SHUTDOWN,
      message: 'Server shutting down gracefully',
    });

    // Flush logs
    if (externalLogger) {
      console.log('Flushing external logs...');
      await externalLogger.stop();
    }

    // Close server
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      console.error('Forced shutdown after 30 seconds');
      process.exit(1);
    }, 30000);
  });

  process.on('SIGINT', async () => {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║         Received SIGINT - Shutting Down...                 ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    logEvent({
      level: LogLevel.INFO,
      eventType: LogEventType.SERVER_SHUTDOWN,
      message: 'Server received SIGINT',
    });

    // Flush logs
    if (externalLogger) {
      console.log('Flushing external logs...');
      await externalLogger.stop();
    }

    // Close server
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });

  // Error handling
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);

    logEvent({
      level: LogLevel.CRITICAL,
      eventType: LogEventType.ERROR,
      message: 'Uncaught exception',
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    });

    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);

    logEvent({
      level: LogLevel.CRITICAL,
      eventType: LogEventType.ERROR,
      message: 'Unhandled promise rejection',
      details: {
        reason: String(reason),
        promise: String(promise),
      },
      error: {
        name: 'UnhandledPromiseRejection',
        message: String(reason),
      },
    });
  });
}

// Start server
initializeServer().catch((error) => {
  console.error('Failed to initialize server:', error);
  process.exit(1);
});
