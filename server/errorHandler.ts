import { TRPCError } from "@trpc/server";

export interface ErrorContext {
  userId?: number;
  operation?: string;
  resource?: string;
  details?: Record<string, any>;
}

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 500,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Centralized error handler for all application errors
 */
export const errorHandler = {
  /**
   * Log error with context
   */
  log(error: any, context?: ErrorContext) {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      name: error?.name || 'Unknown',
      message: error?.message || 'Unknown error',
      code: error?.code || 'UNKNOWN',
      context,
      stack: error?.stack,
    };

    console.error('[ERROR]', JSON.stringify(errorInfo, null, 2));
  },

  /**
   * Handle database errors
   */
  handleDatabaseError(error: any, context?: ErrorContext): TRPCError {
    this.log(error, context);

    if (error?.code === 'ER_DUP_ENTRY') {
      return new TRPCError({
        code: 'CONFLICT',
        message: 'This record already exists',
      });
    }

    if (error?.code === 'ER_NO_REFERENCED_ROW') {
      return new TRPCError({
        code: 'NOT_FOUND',
        message: 'Referenced record not found',
      });
    }

    if (error?.code === 'ER_BAD_FIELD_ERROR') {
      return new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Database schema error. Please contact support.',
      });
    }

    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database operation failed. Please try again later.',
    });
  },

  /**
   * Handle authentication errors
   */
  handleAuthError(message: string = 'Authentication failed'): TRPCError {
    return new TRPCError({
      code: 'UNAUTHORIZED',
      message,
    });
  },

  /**
   * Handle authorization errors
   */
  handleAuthorizationError(
    message: string = 'You do not have permission to perform this action'
  ): TRPCError {
    return new TRPCError({
      code: 'FORBIDDEN',
      message,
    });
  },

  /**
   * Handle validation errors
   */
  handleValidationError(message: string): TRPCError {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message,
    });
  },

  /**
   * Handle not found errors
   */
  handleNotFoundError(resource: string): TRPCError {
    return new TRPCError({
      code: 'NOT_FOUND',
      message: `${resource} not found`,
    });
  },

  /**
   * Handle generic errors
   */
  handleError(error: any, context?: ErrorContext): TRPCError {
    this.log(error, context);

    if (error instanceof TRPCError) {
      return error;
    }

    if (error instanceof AppError) {
      return new TRPCError({
        code: error.code as any,
        message: error.message,
      });
    }

    return new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    });
  },
};

/**
 * Logger utility for structured logging
 */
export const logger = {
  info(message: string, data?: Record<string, any>) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data || '');
  },

  warn(message: string, data?: Record<string, any>) {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data || '');
  },

  error(message: string, error?: any, data?: Record<string, any>) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, {
      error: error?.message || error,
      ...data,
    });
  },

  debug(message: string, data?: Record<string, any>) {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, data || '');
    }
  },
};
