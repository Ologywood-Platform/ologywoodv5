/**
 * Structured logging utility for TRPC endpoints and database operations
 * Provides consistent logging format for debugging and monitoring
 */

interface LogContext {
  endpoint?: string;
  userId?: number;
  method?: string;
  duration?: number;
  error?: Error | string;
  statusCode?: number;
  [key: string]: any;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * Format log message with timestamp and context
   */
  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext) {
    console.log(this.formatMessage('info', message, context));
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext) {
    console.warn(this.formatMessage('warn', message, context));
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | string, context?: LogContext) {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(
      this.formatMessage('error', message, {
        ...context,
        error: errorMessage,
        stack: errorStack,
      })
    );
  }

  /**
   * Log TRPC endpoint call with timing
   */
  trpcCall(endpoint: string, userId?: number, duration?: number) {
    this.info(`TRPC Call: ${endpoint}`, {
      endpoint,
      userId,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  /**
   * Log TRPC endpoint error
   */
  trpcError(endpoint: string, error: Error, userId?: number, context?: LogContext) {
    this.error(`TRPC Error: ${endpoint}`, error, {
      endpoint,
      userId,
      ...context,
    });
  }

  /**
   * Log database query
   */
  dbQuery(query: string, duration?: number, context?: LogContext) {
    this.debug(`DB Query: ${query}`, {
      duration: duration ? `${duration}ms` : undefined,
      ...context,
    });
  }

  /**
   * Log database error
   */
  dbError(query: string, error: Error, context?: LogContext) {
    this.error(`DB Error: ${query}`, error, context);
  }

  /**
   * Log API response
   */
  apiResponse(endpoint: string, statusCode: number, duration?: number, userId?: number) {
    this.info(`API Response: ${endpoint}`, {
      endpoint,
      statusCode,
      duration: duration ? `${duration}ms` : undefined,
      userId,
    });
  }
}

export const logger = new Logger();

/**
 * TRPC middleware for logging endpoint calls
 */
export function createLoggingMiddleware() {
  return async (opts: any) => {
    const start = Date.now();
    const result = await opts.next();
    const duration = Date.now() - start;

    const endpoint = opts.path;
    const userId = opts.ctx?.user?.id;

    if (result.ok) {
      logger.trpcCall(endpoint, userId, duration);
    } else {
      logger.trpcError(
        endpoint,
        result.error instanceof Error ? result.error : new Error(String(result.error)),
        userId,
        { statusCode: result.error?.code }
      );
    }

    return result;
  };
}
