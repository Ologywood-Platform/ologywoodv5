/**
 * User-friendly error messages for common scenarios
 * Maps technical errors to helpful, actionable messages
 */

export interface ErrorResponse {
  error: string; // Error code for frontend handling
  message: string; // User-friendly message
  details?: string; // Additional context
  action?: string; // Suggested action for user
}

/**
 * Error message templates for different scenarios
 */
export const ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS: {
    message: 'Invalid email or password. Please try again.',
    action: 'Double-check your email and password, or reset your password.',
  },
  SESSION_EXPIRED: {
    message: 'Your session has expired. Please sign in again.',
    action: 'Click the sign in button to log back in.',
  },
  UNAUTHORIZED: {
    message: 'You do not have permission to access this resource.',
    action: 'Contact support if you believe this is an error.',
  },
  NOT_AUTHENTICATED: {
    message: 'Please sign in to continue.',
    action: 'Click the sign in button to get started.',
  },

  // Booking errors
  BOOKING_NOT_FOUND: {
    message: 'This booking could not be found.',
    action: 'Check that the booking ID is correct, or contact support.',
  },
  BOOKING_ALREADY_CONFIRMED: {
    message: 'This booking has already been confirmed.',
    action: 'View the booking details for more information.',
  },
  BOOKING_ALREADY_DECLINED: {
    message: 'This booking has already been declined.',
    action: 'Contact the venue if you would like to reconsider.',
  },
  DOUBLE_BOOKING_DETECTED: {
    message: 'You already have a confirmed booking for this date.',
    action: 'Choose a different date or contact the venue about rescheduling.',
  },
  INVALID_BOOKING_DATE: {
    message: 'The selected date is not available.',
    action: 'Choose a date when you are available, or contact the venue.',
  },

  // Payment errors
  PAYMENT_FAILED: {
    message: 'Your payment could not be processed.',
    action: 'Check your card details and try again, or contact your bank.',
  },
  PAYMENT_DECLINED: {
    message: 'Your payment was declined by your bank.',
    action: 'Contact your bank or try a different payment method.',
  },
  INSUFFICIENT_FUNDS: {
    message: 'Insufficient funds for this transaction.',
    action: 'Add funds to your account or use a different payment method.',
  },
  PAYMENT_TIMEOUT: {
    message: 'The payment took too long to process.',
    action: 'Please try again, or contact support if the problem persists.',
  },

  // Subscription errors
  SUBSCRIPTION_REQUIRED: {
    message: 'This feature requires an active subscription.',
    action: 'Upgrade your subscription to access this feature.',
  },
  SUBSCRIPTION_ALREADY_ACTIVE: {
    message: 'You already have an active subscription.',
    action: 'Manage your subscription in your account settings.',
  },
  TRIAL_ALREADY_USED: {
    message: 'You have already used your free trial.',
    action: 'Subscribe to continue using premium features.',
  },

  // Profile errors
  PROFILE_INCOMPLETE: {
    message: 'Your profile is incomplete.',
    action: 'Complete your profile to start booking.',
  },
  PROFILE_NOT_FOUND: {
    message: 'This profile could not be found.',
    action: 'Check the profile link or contact support.',
  },
  INVALID_PROFILE_DATA: {
    message: 'Some of your profile information is invalid.',
    action: 'Review and correct the highlighted fields.',
  },

  // Message errors
  MESSAGE_NOT_FOUND: {
    message: 'This message could not be found.',
    action: 'Refresh the page or contact support.',
  },
  INVALID_RECIPIENT: {
    message: 'The recipient could not be found.',
    action: 'Make sure you are messaging the correct person.',
  },
  MESSAGE_TOO_LONG: {
    message: 'Your message is too long.',
    action: 'Shorten your message and try again.',
  },

  // Review errors
  REVIEW_NOT_FOUND: {
    message: 'This review could not be found.',
    action: 'Refresh the page or contact support.',
  },
  REVIEW_ALREADY_SUBMITTED: {
    message: 'You have already submitted a review for this booking.',
    action: 'Edit your existing review or contact support.',
  },
  INVALID_RATING: {
    message: 'Please provide a valid rating between 1 and 5 stars.',
    action: 'Select a rating and try again.',
  },

  // Validation errors
  INVALID_EMAIL: {
    message: 'Please enter a valid email address.',
    action: 'Check your email and try again.',
  },
  INVALID_PHONE: {
    message: 'Please enter a valid phone number.',
    action: 'Check your phone number and try again.',
  },
  REQUIRED_FIELD: {
    message: 'This field is required.',
    action: 'Fill in all required fields and try again.',
  },
  INVALID_DATE: {
    message: 'Please enter a valid date.',
    action: 'Check the date format and try again.',
  },

  // Server errors
  INTERNAL_SERVER_ERROR: {
    message: 'Something went wrong on our end.',
    action: 'Please try again later, or contact support if the problem persists.',
  },
  SERVICE_UNAVAILABLE: {
    message: 'The service is temporarily unavailable.',
    action: 'Please try again in a few moments.',
  },
  DATABASE_ERROR: {
    message: 'We are experiencing database issues.',
    action: 'Please try again later, or contact support.',
  },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    message: 'Too many requests. Please slow down.',
    action: 'Wait a moment before trying again.',
  },
  TOO_MANY_LOGIN_ATTEMPTS: {
    message: 'Too many login attempts. Please try again later.',
    action: 'Wait 15 minutes before trying again, or reset your password.',
  },

  // File upload errors
  FILE_TOO_LARGE: {
    message: 'The file is too large.',
    action: 'Upload a smaller file (max 10MB).',
  },
  INVALID_FILE_TYPE: {
    message: 'This file type is not supported.',
    action: 'Upload a supported file type (JPG, PNG, PDF, etc.).',
  },
  FILE_UPLOAD_FAILED: {
    message: 'The file could not be uploaded.',
    action: 'Try again, or contact support if the problem persists.',
  },

  // Network errors
  NETWORK_ERROR: {
    message: 'Network connection error.',
    action: 'Check your internet connection and try again.',
  },
  REQUEST_TIMEOUT: {
    message: 'The request took too long to complete.',
    action: 'Check your internet connection and try again.',
  },
};

/**
 * Get user-friendly error message
 */
export function getUserFriendlyError(
  errorCode: string,
  defaultMessage: string = 'An error occurred. Please try again.'
): ErrorResponse {
  const template = (ERROR_MESSAGES as any)[errorCode];

  if (template) {
    return {
      error: errorCode,
      message: template.message,
      action: template.action,
    };
  }

  return {
    error: 'UNKNOWN_ERROR',
    message: defaultMessage,
  };
}

/**
 * Convert technical error to user-friendly error
 */
export function convertTechnicalError(error: any): ErrorResponse {
  // Handle specific error types
  if (error.code === 'ER_DUP_ENTRY') {
    return getUserFriendlyError('DUPLICATE_ENTRY', 'This item already exists.');
  }

  if (error.code === 'ER_NO_REFERENCED_ROW') {
    return getUserFriendlyError('INVALID_REFERENCE', 'The referenced item does not exist.');
  }

  if (error.code === 'ECONNREFUSED') {
    return getUserFriendlyError('DATABASE_ERROR');
  }

  if (error.code === 'ENOTFOUND') {
    return getUserFriendlyError('NETWORK_ERROR');
  }

  if (error.code === 'ETIMEDOUT') {
    return getUserFriendlyError('REQUEST_TIMEOUT');
  }

  // Handle error messages
  const message = error.message?.toLowerCase() || '';

  if (message.includes('not found')) {
    return getUserFriendlyError('NOT_FOUND', 'The requested item could not be found.');
  }

  if (message.includes('unauthorized')) {
    return getUserFriendlyError('UNAUTHORIZED');
  }

  if (message.includes('invalid')) {
    return getUserFriendlyError('INVALID_INPUT', 'The provided information is invalid.');
  }

  if (message.includes('duplicate')) {
    return getUserFriendlyError('DUPLICATE_ENTRY');
  }

  // Default error
  return {
    error: 'UNKNOWN_ERROR',
    message: 'An error occurred. Please try again.',
  };
}

/**
 * Format validation errors for user display
 */
export function formatValidationErrors(errors: Record<string, string[]>): string[] {
  const messages: string[] = [];

  for (const [field, fieldErrors] of Object.entries(errors)) {
    for (const error of fieldErrors) {
      messages.push(`${field}: ${error}`);
    }
  }

  return messages;
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  errorCode: string,
  customMessage?: string,
  details?: string
): ErrorResponse {
  const template = getUserFriendlyError(errorCode);

  return {
    error: errorCode,
    message: customMessage || template.message,
    details,
    action: template.action,
  };
}
