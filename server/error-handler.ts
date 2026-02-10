import { Request, Response, NextFunction } from 'express';

/**
 * Global Error Handler Middleware
 * Catches all errors and returns proper JSON responses instead of HTML error pages
 * Prevents "Unexpected token '<', "<!doctype"..." errors on the frontend
 */

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    statusCode: number;
    timestamp: string;
    path?: string;
    method?: string;
  };
}

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Async wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware
 * Must be registered AFTER all other middleware and routes
 */
export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Default error response
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';

  // Handle known error types
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = err.message || 'Validation failed';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Unauthorized access';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    code = 'NOT_FOUND';
    message = 'Resource not found';
  } else if ((err as any).code === 'ER_BAD_FIELD_ERROR') {
    // Database schema mismatch error
    statusCode = 500;
    code = 'DATABASE_SCHEMA_ERROR';
    message = 'Database schema error - please contact support';
    console.error('[Database Schema Error]', err.message);
  } else if ((err as any).code === 'ECONNREFUSED') {
    // Database connection error
    statusCode = 503;
    code = 'DATABASE_CONNECTION_ERROR';
    message = 'Database connection failed - please try again later';
    console.error('[Database Connection Error]', err.message);
  } else if ((err as any).code === 'ECONNRESET') {
    // Database connection reset
    statusCode = 503;
    code = 'DATABASE_CONNECTION_RESET';
    message = 'Database connection was reset - please try again';
    console.error('[Database Connection Reset]', err.message);
  } else if (err instanceof SyntaxError && 'body' in err) {
    // JSON parsing error
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Invalid JSON in request body';
  }

  // Log error for debugging
  console.error(`[${code}] ${message}`, {
    statusCode,
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  };

  // Send JSON response (never HTML)
  res.status(statusCode).json(errorResponse);
};

/**
 * 404 handler for unmatched routes
 * Must be registered AFTER all other routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: `Route not found: ${req.method} ${req.path}`,
      code: 'ROUTE_NOT_FOUND',
      statusCode: 404,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
    },
  };

  res.status(404).json(errorResponse);
};
