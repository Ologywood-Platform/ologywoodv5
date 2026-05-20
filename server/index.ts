/**
 * Ologywood Server Entry Point
 * Integrates all security, logging, and performance middleware
 */

import express, { Express } from 'express';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './routers';
import { configureServer, printSecuritySetup } from './middleware/serverConfig';
import { createExternalLoggingService } from './services/externalLoggingService';
import { DatabaseOptimizationService } from './services/databaseOptimization';
import { logEvent, LogLevel, LogEventType } from './middleware/logging';
import { socketService } from './services/socketService';
import sitemapRoutes from './routes/sitemapRoutes';
import emailRoutes from './routes/emailRoutes';
import releaseCheckoutRoutes from './routes/releaseCheckout';
import releaseDownloadRoutes from './routes/releaseDownload';
import calendarFeedRoutes from './routes/calendarFeed';
import invoiceDownloadRoutes from './routes/invoiceDownload';
import videoUploadRoutes from './routes/videoUpload';
import videoProxyRoutes from './routes/videoProxy';
import path from 'path';
import http from 'http';
import { ogMetaInjectionMiddleware, venueOgMetaInjectionMiddleware, eventOgMetaInjectionMiddleware } from './middleware/ogMetaInjection';
import ogImageProxyRouter from './middleware/ogImageProxy';

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
    eventType: LogEventType.SERVER_STARTUP,
    message: 'Server initializing with security middleware',
    details: {
      environment: process.env.NODE_ENV,
      externalLoggingEnabled: !!externalLogger,
      port: process.env.PORT || 3000,
    },
  });

  // Mount sitemap and SEO routes FIRST (before static files)
  app.use('/', sitemapRoutes);

  // Mount API routes BEFORE static files (important: API routes must come before static middleware)
  app.use('/api/email', emailRoutes);
  app.use('/api/release/checkout', releaseCheckoutRoutes);
  app.use('/api/release/download', releaseDownloadRoutes);
  app.use('/api/calendar', calendarFeedRoutes);
  app.use('/api/invoice', invoiceDownloadRoutes);
  app.use('/api/video', videoUploadRoutes);
  app.use('/api/video', videoProxyRoutes);
  app.use('/api/og-image', ogImageProxyRouter);

  // Serve static files from dist/public (after SEO routes)
  const publicPath = path.join(process.cwd(), 'dist', 'public');
  app.use(express.static(publicPath, { maxAge: '1h' }));

  // Create TRPC HTTP server
  const trpcServer = createHTTPServer({
    middleware: express.json({ limit: '500mb' }),
    router: appRouter,
    createContext: async (opts: any) => ({
      req: opts?.req,
      res: opts?.res,
      user: null,
    }),
  });

  // Mount TRPC routes
  app.use('/trpc', (req, res) => {
    (trpcServer as any).handler(req, res);
  });

  // Mount payment routes
  // app.use('/api/payment', paymentRoutes); // Disabled (email routes already mounted at /api/email)

  // Initialize Socket.io for real-time notifications
  const httpServer = http.createServer(app);
  socketService.initialize(httpServer);

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



  // OG Meta Tag injection for social media crawlers (before SPA fallback)
  // This ensures shared links show artist/venue/event previews on Facebook, Twitter, WhatsApp, iMessage, etc.
  app.use(ogMetaInjectionMiddleware(publicPath));
  app.use(venueOgMetaInjectionMiddleware(publicPath));
  app.use(eventOgMetaInjectionMiddleware(publicPath));

  // Serve index.html for all other routes (SPA fallback) - MUST be last
  app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Error loading application');
      }
    });
  });

  // Start server
  const PORT = process.env.PORT || 3000;
  const server = httpServer.listen(PORT, () => {

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

    logEvent({
      level: LogLevel.INFO,
      eventType: LogEventType.SERVER_SHUTDOWN,
      message: 'Server shutting down gracefully',
    });

    // Flush logs
    if (externalLogger) {
      await externalLogger.stop();
    }

    // Close server
    server.close(() => {
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      console.error('Forced shutdown after 30 seconds');
      process.exit(1);
    }, 30000);
  });

  process.on('SIGINT', async () => {

    logEvent({
      level: LogLevel.INFO,
      eventType: LogEventType.SERVER_SHUTDOWN,
      message: 'Server received SIGINT',
    });

    // Flush logs
    if (externalLogger) {
      await externalLogger.stop();
    }

    // Close server
    server.close(() => {
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
