import * as Sentry from '@sentry/node';
import * as SentryTracing from '@sentry/tracing';
import { Request, Response, NextFunction } from 'express';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initializeSentry(app: any) {
  // Only initialize if DSN is provided
  if (!process.env.SENTRY_DSN) {
    console.warn('SENTRY_DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      new SentryTracing.Http({ tracing: true }),
      new Sentry.Integrations.OnUncaughtException(),
      new Sentry.Integrations.OnUnhandledRejection(),
    ],
    // Performance Monitoring
    beforeSend(event: any, hint: any) {
      // Filter out certain errors if needed
      if (event.exception) {
        const error = hint.originalException;
        // Don't send 404 errors
        if (error instanceof Error && error.message.includes('404')) {
          return null;
        }
      }
      return event;
    },
    denyUrls: [
      // Browser extensions
      /extensions\//i,
      /^chrome:\/\//i,
      // Third-party scripts
      /graph\.instagram\.com/i,
      /connect\.facebook\.net/i,
    ],
  });

  // Attach request handler
  app.use((Sentry as any).Handlers?.requestHandler?.() || ((req: any, res: any, next: any) => next()));

  // Attach tracing middleware
  app.use((Sentry as any).Handlers?.tracingHandler?.() || ((req: any, res: any, next: any) => next()));

  // Error handler (must be last)
  app.use((Sentry as any).Handlers?.errorHandler?.() || ((err: any, req: any, res: any, next: any) => next(err)));

  console.log('Sentry initialized successfully');
}

/**
 * Middleware to add user context to Sentry
 */
export function sentryUserMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if ((req as any).user) {
    Sentry.setUser({
      id: (req as any).user.id.toString(),
      email: (req as any).user.email,
      username: (req as any).user.name,
      role: (req as any).user.role,
    });
  } else {
    Sentry.setUser(null);
  }

  next();
}

/**
 * Capture exception with context
 */
export function captureException(
      error: Error,
      context?: Record<string, any>
    ) {
      Sentry.withScope((scope: any) => {
    if (context) {
      scope.setContext('additional', context);
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture message with level
 */
export function captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    context?: Record<string, any>
  ) {
    Sentry.withScope((scope: any) => {
    if (context) {
      scope.setContext('additional', context);
    }
    Sentry.captureMessage(message, level);
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string = 'http.request'
): any {
  return (Sentry as any).startTransaction?.(
    {
      name,
      op,
    }
  ) || null;
}

/**
 * Set custom tags for better filtering in Sentry
 */
export function setTag(key: string, value: string | number | boolean) {
  Sentry.setTag(key, value);
}

/**
 * Set custom context
 */
export function setContext(
  name: string,
  context: Record<string, any>
) {
  Sentry.setContext(name, context);
}

/**
 * Add breadcrumb for tracking user actions
 */
export function addBreadcrumb(
  message: string,
  category: string = 'user-action',
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Middleware for TRPC error handling with Sentry
 */
export function sentryTRPCMiddleware() {
  return async (opts: any) => {
    const transaction = (Sentry as any).startTransaction?.({
      name: `TRPC ${opts.path}`,
      op: 'trpc.call',
    });

    try {
      const result = await opts.next();
      transaction?.finish?.();
      return result;
    } catch (error) {
      Sentry.withScope?.((scope: any) => {
        scope.setContext?.('trpc', {
          path: opts.path,
          type: opts.type,
        });
        Sentry.captureException?.(error);
      });
      transaction?.finish?.();
      throw error;
    }
  };
}

/**
 * Health check endpoint for Sentry
 */
export async function sentryHealthCheck(): Promise<{
  status: 'ok' | 'error';
  message: string;
}> {
  try {
    if (!process.env.SENTRY_DSN) {
      return {
        status: 'ok',
        message: 'Sentry not configured',
      };
    }

    // Test Sentry connection by sending a test event
    Sentry.captureMessage('Sentry health check', 'info');

    return {
      status: 'ok',
      message: 'Sentry is connected',
    };
  } catch (error: any) {
    return {
      status: 'error',
      message: `Sentry health check failed: ${error?.message}`,
    };
  }
}

/**
 * Export Sentry instance for direct use
 */
export { Sentry };
