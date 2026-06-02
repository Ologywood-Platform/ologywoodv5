/**
 * Express Server Configuration with Security Middleware
 * Integrates all security, logging, and performance middleware
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { Request as ExpressRequest } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createRateLimiter, RATE_LIMIT_CONFIGS } from './rateLimiter';
import { configureSecurityHeaders, securityHeadersMiddleware } from './securityHeaders';
import { requestLoggingMiddleware, logEvent, LogLevel, LogEventType } from './logging';
import { fileUploadValidation, FILE_SIZE_LIMITS, ALLOWED_MIME_TYPES } from './fileUploadSecurity';

/**
 * Configure Express server with all security and performance middleware
 */
export function configureServer(app: Express): void {
  // Trust proxy - important for rate limiting behind reverse proxies
  // Always trust proxy in production (Cloud Run is behind a load balancer)
  // This ensures x-forwarded-proto and x-forwarded-host headers are respected
  const isProduction = !!process.env.BASE_URL;
  app.set('trust proxy', isProduction || process.env.TRUST_PROXY === 'true' ? 1 : false);

  // Disable powered by header
  app.disable('x-powered-by');

  // HTTPS redirect middleware - redirect all HTTP requests to HTTPS
  // This ensures browsers default to https:// even on first visit
  if (process.env.NODE_ENV === 'production') {
    app.use((req: Request, res: Response, next: NextFunction) => {
      // Check if request came through HTTP (not HTTPS)
      const isSecure = req.secure || req.get('x-forwarded-proto') === 'https';
      if (!isSecure && req.method === 'GET') {
        // Redirect to HTTPS version of the same URL
        const httpsUrl = `https://${req.get('host')}${req.originalUrl}`;
        return res.redirect(301, httpsUrl);
      }
      next();
    });
  }

  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };

  app.use(cors(corsOptions));

  // Security headers using Helmet
  app.use(configureSecurityHeaders());
  app.use(securityHeadersMiddleware);

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Request logging middleware
  app.use(requestLoggingMiddleware);

  // Global rate limiter - apply to all routes
  const globalLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.auth);
  app.use(globalLimiter);

  // Health check endpoint (no rate limiting)
  app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Status endpoint
  app.get('/status', (req: Request, res: Response) => {
    res.json({
      status: 'running',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
  });

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('[Error]', err);

    logEvent({
      level: LogLevel.ERROR,
      eventType: LogEventType.ERROR,
      userId: (req as any).user?.id,
      ipAddress: req.ip,
      endpoint: req.path,
      method: req.method,
      message: err.message || 'Unknown error',
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack,
      },
    });

    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
      method: req.method,
    });
  });
}

/**
 * Configure authentication endpoint rate limiter
 */
export function applyAuthRateLimiter(app: Express, path: string = '/auth'): void {
  const authLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.auth);
  app.use(path, authLimiter);
}

/**
 * Configure API endpoint rate limiter
 */
export function applyApiRateLimiter(app: Express, path: string = '/api'): void {
  const apiLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.api);
  app.use(path, apiLimiter);
}

/**
 * Configure sensitive operation rate limiter
 */
export function applySensitiveRateLimiter(app: Express, path: string): void {
  const sensitiveLimiter = createRateLimiter(RATE_LIMIT_CONFIGS.sensitive);
  app.use(path, sensitiveLimiter);
}

/**
 * Configure file upload middleware
 */
export function configureFileUpload(app: Express, uploadPath: string = '/upload'): void {
  app.post(uploadPath, fileUploadValidation({
    maxSize: FILE_SIZE_LIMITS.default,
    allowedTypes: Object.values(ALLOWED_MIME_TYPES).flat(),
  }), (req: Request & { file?: any }, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    logEvent({
      level: LogLevel.INFO,
      eventType: LogEventType.FILE_UPLOAD,
      userId: (req as any).user?.id,
      ipAddress: req.ip,
      message: `File uploaded: ${req.file.filename}`,
      details: {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });

    res.json({
      success: true,
      file: req.file ? {
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
      } : null,
    });
  });
}

/**
 * Security configuration object
 */
export const securityConfig = {
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  rateLimiting: {
    enabled: process.env.RATE_LIMITING_ENABLED !== 'false',
    global: RATE_LIMIT_CONFIGS.api,
    auth: RATE_LIMIT_CONFIGS.auth,
    sensitive: RATE_LIMIT_CONFIGS.sensitive,
  },
  fileUpload: {
    maxSize: FILE_SIZE_LIMITS.default,
    allowedTypes: Object.values(ALLOWED_MIME_TYPES).flat(),
    uploadDir: process.env.UPLOAD_DIR || '/tmp/uploads',
  },
  headers: {
    contentSecurityPolicy: true,
    hsts: true,
    frameGuard: true,
    noSniff: true,
    xssFilter: true,
  },
  logging: {
    enabled: true,
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};

/**
 * Middleware setup summary
 */
export function printSecuritySetup(): void {
}
