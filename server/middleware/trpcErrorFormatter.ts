import { TRPCError } from '@trpc/server';
import { convertTechnicalError, getUserFriendlyError } from '../errorMessages';

/**
 * TRPC error formatter that converts technical errors to user-friendly messages
 */
export function formatTRPCError(error: any): TRPCError {
  // If it's already a TRPC error with a user-friendly message, return it
  if (error instanceof TRPCError && error.message && !error.message.includes('Unknown')) {
    return error;
  }

  // Convert technical error to user-friendly error
  const userError = convertTechnicalError(error);

  // Determine appropriate HTTP status code
  let code: any = 'INTERNAL_SERVER_ERROR';

  if (error.code === 'ER_DUP_ENTRY') {
    code = 'BAD_REQUEST';
  } else if (error.code === 'ER_NO_REFERENCED_ROW') {
    code = 'NOT_FOUND';
  } else if (error.message?.includes('not found')) {
    code = 'NOT_FOUND';
  } else if (error.message?.includes('unauthorized')) {
    code = 'UNAUTHORIZED';
  } else if (error.message?.includes('invalid')) {
    code = 'BAD_REQUEST';
  }

  // Create TRPC error with user-friendly message
  return new TRPCError({
    code,
    message: userError.message,
    cause: error,
  });
}

/**
 * TRPC middleware for error handling
 */
export const errorHandlingMiddleware = async (opts: any) => {
  try {
    return await opts.next();
  } catch (error: any) {
    // Log the original error for debugging
    console.error('[TRPC Error]', {
      path: opts.path,
      type: opts.type,
      error: error.message,
      code: error.code,
      stack: error.stack,
    });

    // Format and throw user-friendly error
    throw formatTRPCError(error);
  }
};

/**
 * Validation error formatter for Zod validation errors
 */
export function formatValidationError(error: any): TRPCError {
  const issues = error.issues || [];
  const messages: string[] = [];

  for (const issue of issues) {
    const path = issue.path.join('.');
    const message = issue.message;
    messages.push(`${path}: ${message}`);
  }

  return new TRPCError({
    code: 'BAD_REQUEST',
    message: 'Validation error: ' + messages.join('; '),
  });
}

/**
 * Database error formatter
 */
export function formatDatabaseError(error: any): TRPCError {
  const code = error.code || 'UNKNOWN';

  // Map MySQL error codes to user-friendly messages
  const errorMap: Record<string, { code: any; message: string }> = {
    ER_DUP_ENTRY: {
      code: 'BAD_REQUEST',
      message: 'This item already exists. Please use a different value.',
    },
    ER_NO_REFERENCED_ROW: {
      code: 'NOT_FOUND',
      message: 'The referenced item does not exist.',
    },
    ER_BAD_FIELD_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while processing your request.',
    },
    ER_PARSE_ERROR: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An error occurred while processing your request.',
    },
    ECONNREFUSED: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database connection failed. Please try again later.',
    },
  };

  const mapping = errorMap[code];

  if (mapping) {
    return new TRPCError({
      code: mapping.code,
      message: mapping.message,
      cause: error,
    });
  }

  // Default database error
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An error occurred while processing your request. Please try again later.',
    cause: error,
  });
}

/**
 * Wrap a TRPC procedure with error handling
 */
export function withErrorHandling<T>(
  fn: (...args: any[]) => Promise<T>
): (...args: any[]) => Promise<T> {
  return async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error: any) {
      // Log error for debugging
      console.error('[Procedure Error]', error);

      // Format and throw user-friendly error
      if (error instanceof TRPCError) {
        throw error;
      }

      throw formatTRPCError(error);
    }
  };
}
