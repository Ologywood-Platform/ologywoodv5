/**
 * Sentry APM Monitoring Integration
 * Provides error tracking, performance monitoring, and alerting
 */

export interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  profilesSampleRate: number;
}

let sentryInitialized = false;

/**
 * Initialize Sentry monitoring
 */
export async function initializeSentry(): Promise<boolean> {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    console.log('[Sentry] DSN not configured, monitoring disabled');
    return false;
  }

  try {
    // Dynamic import to avoid hard dependency
    const Sentry = await import('@sentry/node');

    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection(),
      ],
    });

    sentryInitialized = true;
    console.log('[Sentry] Monitoring initialized');
    return true;
  } catch (error) {
    console.warn('[Sentry] Failed to initialize:', error);
    return false;
  }
}

/**
 * Capture exception in Sentry
 */
export async function captureException(error: Error, context?: Record<string, any>): Promise<string> {
  if (!sentryInitialized) {
    console.error('[Sentry] Not initialized, error not captured:', error.message);
    return '';
  }

  try {
    const Sentry = await import('@sentry/node');

    if (context) {
      Sentry.setContext('additional', context);
    }

    const eventId = Sentry.captureException(error);
    console.log('[Sentry] Exception captured:', eventId);
    return eventId;
  } catch (err) {
    console.error('[Sentry] Failed to capture exception:', err);
    return '';
  }
}

/**
 * Capture message in Sentry
 */
export async function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
): Promise<string> {
  if (!sentryInitialized) {
    console.log('[Sentry] Not initialized, message not captured:', message);
    return '';
  }

  try {
    const Sentry = await import('@sentry/node');

    if (context) {
      Sentry.setContext('additional', context);
    }

    const eventId = Sentry.captureMessage(message, level);
    console.log('[Sentry] Message captured:', eventId);
    return eventId;
  } catch (err) {
    console.error('[Sentry] Failed to capture message:', err);
    return '';
  }
}

/**
 * Start transaction for performance monitoring
 */
export async function startTransaction(
  name: string,
  op: string = 'http.request'
): Promise<any> {
  if (!sentryInitialized) {
    return null;
  }

  try {
    const Sentry = await import('@sentry/node');
    return Sentry.startTransaction({ name, op });
  } catch (err) {
    console.error('[Sentry] Failed to start transaction:', err);
    return null;
  }
}

/**
 * Set user context for error tracking
 */
export async function setUserContext(userId: string, email?: string, username?: string): Promise<void> {
  if (!sentryInitialized) {
    return;
  }

  try {
    const Sentry = await import('@sentry/node');
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  } catch (err) {
    console.error('[Sentry] Failed to set user context:', err);
  }
}

/**
 * Clear user context
 */
export async function clearUserContext(): Promise<void> {
  if (!sentryInitialized) {
    return;
  }

  try {
    const Sentry = await import('@sentry/node');
    Sentry.setUser(null);
  } catch (err) {
    console.error('[Sentry] Failed to clear user context:', err);
  }
}

/**
 * Add breadcrumb for debugging
 */
export async function addBreadcrumb(
  message: string,
  category: string = 'user-action',
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  data?: Record<string, any>
): Promise<void> {
  if (!sentryInitialized) {
    return;
  }

  try {
    const Sentry = await import('@sentry/node');
    Sentry.addBreadcrumb({
      message,
      category,
      level,
      data,
      timestamp: Date.now() / 1000,
    });
  } catch (err) {
    console.error('[Sentry] Failed to add breadcrumb:', err);
  }
}

/**
 * Get Sentry status
 */
export function isSentryInitialized(): boolean {
  return sentryInitialized;
}

/**
 * Flush pending events
 */
export async function flushSentry(timeout: number = 2000): Promise<boolean> {
  if (!sentryInitialized) {
    return false;
  }

  try {
    const Sentry = await import('@sentry/node');
    await Sentry.close(timeout);
    console.log('[Sentry] Flushed and closed');
    return true;
  } catch (err) {
    console.error('[Sentry] Failed to flush:', err);
    return false;
  }
}

/**
 * Express middleware for Sentry
 */
export async function getSentryMiddleware(): Promise<any> {
  if (!sentryInitialized) {
    return (req: any, res: any, next: any) => next();
  }

  try {
    const Sentry = await import('@sentry/node');
    return Sentry.Handlers.requestHandler();
  } catch (err) {
    console.error('[Sentry] Failed to get middleware:', err);
    return (req: any, res: any, next: any) => next();
  }
}

/**
 * Express error handler for Sentry
 */
export async function getSentryErrorHandler(): Promise<any> {
  if (!sentryInitialized) {
    return (err: any, req: any, res: any, next: any) => next(err);
  }

  try {
    const Sentry = await import('@sentry/node');
    return Sentry.Handlers.errorHandler();
  } catch (err) {
    console.error('[Sentry] Failed to get error handler:', err);
    return (err: any, req: any, res: any, next: any) => next(err);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('[Sentry] Shutting down...');
  await flushSentry();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Sentry] Shutting down...');
  await flushSentry();
  process.exit(0);
});
