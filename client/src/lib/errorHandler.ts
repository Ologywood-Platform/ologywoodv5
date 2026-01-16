/**
 * Client-side error handling and display utilities
 */

export interface ErrorDisplay {
  title: string;
  message: string;
  action?: string;
  type: 'error' | 'warning' | 'info';
  duration?: number; // Duration in ms, 0 = persistent
}

/**
 * User-friendly error messages for common scenarios
 */
export const CLIENT_ERROR_MESSAGES: Record<string, ErrorDisplay> = {
  // Network errors
  NETWORK_ERROR: {
    title: 'Connection Error',
    message: 'Unable to connect to the server. Please check your internet connection.',
    type: 'error',
    action: 'Retry',
  },
  REQUEST_TIMEOUT: {
    title: 'Request Timeout',
    message: 'The request took too long. Please try again.',
    type: 'error',
    action: 'Retry',
  },

  // Authentication errors
  UNAUTHORIZED: {
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
    type: 'error',
  },
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again.',
    type: 'warning',
    action: 'Sign In',
  },

  // Booking errors
  BOOKING_NOT_FOUND: {
    title: 'Booking Not Found',
    message: 'The booking you are looking for could not be found.',
    type: 'error',
  },
  DOUBLE_BOOKING: {
    title: 'Date Already Booked',
    message: 'You already have a booking for this date. Please choose a different date.',
    type: 'warning',
  },

  // Payment errors
  PAYMENT_FAILED: {
    title: 'Payment Failed',
    message: 'Your payment could not be processed. Please try again or use a different payment method.',
    type: 'error',
    action: 'Retry Payment',
  },
  PAYMENT_DECLINED: {
    title: 'Payment Declined',
    message: 'Your payment was declined. Please contact your bank or try a different card.',
    type: 'error',
  },

  // Validation errors
  VALIDATION_ERROR: {
    title: 'Invalid Input',
    message: 'Please check the highlighted fields and try again.',
    type: 'warning',
  },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    title: 'Too Many Requests',
    message: 'You are making requests too quickly. Please slow down and try again.',
    type: 'warning',
    duration: 5000,
  },

  // Server errors
  INTERNAL_SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.',
    type: 'error',
  },
  SERVICE_UNAVAILABLE: {
    title: 'Service Unavailable',
    message: 'The service is temporarily unavailable. Please try again in a few moments.',
    type: 'warning',
  },

  // Generic error
  UNKNOWN_ERROR: {
    title: 'Error',
    message: 'An unexpected error occurred. Please try again.',
    type: 'error',
  },
};

/**
 * Get error display information
 */
export function getErrorDisplay(errorCode: string): ErrorDisplay {
  return (
    CLIENT_ERROR_MESSAGES[errorCode] ||
    CLIENT_ERROR_MESSAGES.UNKNOWN_ERROR
  );
}

/**
 * Parse TRPC error and extract user-friendly message
 */
export function parseTRPCError(error: any): ErrorDisplay {
  // Handle TRPC errors
  if (error?.data?.code) {
    const errorDisplay = getErrorDisplay(error.data.code);
    if (error.message) {
      errorDisplay.message = error.message;
    }
    return errorDisplay;
  }

  // Handle API errors
  if (error?.error) {
    const errorDisplay = getErrorDisplay(error.error);
    if (error.message) {
      errorDisplay.message = error.message;
    }
    return errorDisplay;
  }

  // Handle network errors
  if (error?.message?.includes('fetch')) {
    return getErrorDisplay('NETWORK_ERROR');
  }

  // Handle timeout errors
  if (error?.message?.includes('timeout')) {
    return getErrorDisplay('REQUEST_TIMEOUT');
  }

  // Default error
  return getErrorDisplay('UNKNOWN_ERROR');
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: any): string {
  const errorDisplay = parseTRPCError(error);
  return `${errorDisplay.title}: ${errorDisplay.message}`;
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: any): boolean {
  const code = error?.data?.code || error?.error;

  const recoverableErrors = [
    'NETWORK_ERROR',
    'REQUEST_TIMEOUT',
    'RATE_LIMIT_EXCEEDED',
    'SERVICE_UNAVAILABLE',
    'VALIDATION_ERROR',
    'PAYMENT_FAILED',
  ];

  return recoverableErrors.includes(code);
}

/**
 * Get retry suggestion for error
 */
export function getRetrySuggestion(error: any): string | null {
  const code = error?.data?.code || error?.error;

  const retrySuggestions: Record<string, string> = {
    NETWORK_ERROR: 'Check your internet connection and try again.',
    REQUEST_TIMEOUT: 'Wait a moment and try again.',
    RATE_LIMIT_EXCEEDED: 'Wait a few seconds before trying again.',
    SERVICE_UNAVAILABLE: 'Try again in a few moments.',
    PAYMENT_FAILED: 'Check your payment details and try again.',
  };

  return retrySuggestions[code] || null;
}

/**
 * Log error for debugging
 */
export function logError(error: any, context?: string): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: error?.message,
    code: error?.data?.code || error?.error,
    stack: error?.stack,
  };

  console.error('[Client Error]', errorInfo);

  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Send to Sentry or similar service
    // Sentry.captureException(error, { extra: errorInfo });
  }
}

/**
 * Create error notification object
 */
export function createErrorNotification(error: any, context?: string) {
  logError(error, context);
  const errorDisplay = parseTRPCError(error);

  return {
    id: `error-${Date.now()}`,
    type: errorDisplay.type,
    title: errorDisplay.title,
    message: errorDisplay.message,
    action: errorDisplay.action,
    duration: errorDisplay.duration || 5000,
    dismissible: true,
  };
}
