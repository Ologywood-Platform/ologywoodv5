/**
 * Error analytics tracking system
 * Tracks error frequency, patterns, and user impact
 */

export interface ErrorEvent {
  id: string;
  timestamp: Date;
  errorCode: string;
  errorMessage: string;
  userId?: number;
  endpoint?: string;
  userAgent?: string;
  ipAddress?: string;
  context?: Record<string, any>;
  stackTrace?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface ErrorMetrics {
  totalErrors: number;
  uniqueErrors: number;
  errorsByCode: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  topErrors: Array<{
    code: string;
    count: number;
    lastOccurred: Date;
    affectedUsers: number;
  }>;
  errorTrend: Array<{
    timestamp: Date;
    count: number;
  }>;
}

/**
 * In-memory error analytics store
 * In production, use a database or analytics service
 */
class ErrorAnalytics {
  private errors: ErrorEvent[] = [];
  private maxErrors = 10000; // Keep last 10k errors

  /**
   * Record an error event
   */
  recordError(error: Omit<ErrorEvent, 'id' | 'timestamp'>): void {
    const errorEvent: ErrorEvent = {
      ...error,
      id: `error-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };

    this.errors.push(errorEvent);

    // Keep only recent errors to avoid memory issues
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log error for debugging
    console.error('[Error Analytics]', {
      code: errorEvent.errorCode,
      message: errorEvent.errorMessage,
      severity: errorEvent.severity,
      endpoint: errorEvent.endpoint,
      userId: errorEvent.userId,
    });
  }

  /**
   * Get error metrics for a time period
   */
  getMetrics(hoursBack: number = 24): ErrorMetrics {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const recentErrors = this.errors.filter(
      (e) => e.timestamp >= cutoffTime
    );

    // Count errors by code
    const errorsByCode: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorsByEndpoint: Record<string, number> = {};
    const affectedUsersByCode: Record<string, Set<number>> = {};

    for (const error of recentErrors) {
      // Count by code
      errorsByCode[error.errorCode] =
        (errorsByCode[error.errorCode] || 0) + 1;

      // Count by severity
      errorsBySeverity[error.severity] =
        (errorsBySeverity[error.severity] || 0) + 1;

      // Count by endpoint
      if (error.endpoint) {
        errorsByEndpoint[error.endpoint] =
          (errorsByEndpoint[error.endpoint] || 0) + 1;
      }

      // Track affected users
      if (error.userId) {
        if (!affectedUsersByCode[error.errorCode]) {
          affectedUsersByCode[error.errorCode] = new Set();
        }
        affectedUsersByCode[error.errorCode].add(error.userId);
      }
    }

    // Get top errors
    const topErrors = Object.entries(errorsByCode)
      .map(([code, count]) => {
        const codeErrors = recentErrors.filter((e) => e.errorCode === code);
        return {
          code,
          count,
          lastOccurred: codeErrors[codeErrors.length - 1]?.timestamp || new Date(),
          affectedUsers: affectedUsersByCode[code]?.size || 0,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Calculate error trend (hourly)
    const trendMap: Record<string, number> = {};
    for (const error of recentErrors) {
      const hour = new Date(error.timestamp);
      hour.setMinutes(0, 0, 0);
      const key = hour.toISOString();
      trendMap[key] = (trendMap[key] || 0) + 1;
    }

    const errorTrend = Object.entries(trendMap)
      .map(([timestamp, count]) => ({
        timestamp: new Date(timestamp),
        count,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    return {
      totalErrors: recentErrors.length,
      uniqueErrors: Object.keys(errorsByCode).length,
      errorsByCode,
      errorsBySeverity,
      errorsByEndpoint,
      topErrors,
      errorTrend,
    };
  }

  /**
   * Get errors for a specific user
   */
  getUserErrors(userId: number, limit: number = 50): ErrorEvent[] {
    return this.errors
      .filter((e) => e.userId === userId)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get errors for a specific endpoint
   */
  getEndpointErrors(endpoint: string, limit: number = 50): ErrorEvent[] {
    return this.errors
      .filter((e) => e.endpoint === endpoint)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get errors with specific code
   */
  getErrorsByCode(code: string, limit: number = 50): ErrorEvent[] {
    return this.errors
      .filter((e) => e.errorCode === code)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get critical errors
   */
  getCriticalErrors(limit: number = 50): ErrorEvent[] {
    return this.errors
      .filter((e) => e.severity === 'critical')
      .slice(-limit)
      .reverse();
  }

  /**
   * Clear old errors
   */
  clearOldErrors(hoursBack: number = 72): number {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const initialLength = this.errors.length;
    this.errors = this.errors.filter((e) => e.timestamp >= cutoffTime);
    return initialLength - this.errors.length;
  }

  /**
   * Export errors for analysis
   */
  exportErrors(hoursBack: number = 24): string {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    const recentErrors = this.errors.filter(
      (e) => e.timestamp >= cutoffTime
    );

    return JSON.stringify(recentErrors, null, 2);
  }

  /**
   * Get error summary for dashboard
   */
  getSummary(): {
    totalErrors: number;
    criticalErrors: number;
    errorRate: number;
    topError: string | null;
  } {
    const metrics = this.getMetrics(1); // Last hour

    return {
      totalErrors: metrics.totalErrors,
      criticalErrors: metrics.errorsBySeverity['critical'] || 0,
      errorRate: metrics.totalErrors / 60, // Per minute
      topError: metrics.topErrors[0]?.code || null,
    };
  }
}

// Singleton instance
export const errorAnalytics = new ErrorAnalytics();

/**
 * Helper function to determine error severity
 */
export function getErrorSeverity(
  errorCode: string,
  statusCode?: number
): 'low' | 'medium' | 'high' | 'critical' {
  // Critical errors
  if (
    [
      'DATABASE_ERROR',
      'SERVICE_UNAVAILABLE',
      'INTERNAL_SERVER_ERROR',
    ].includes(errorCode)
  ) {
    return 'critical';
  }

  // High severity
  if (
    [
      'UNAUTHORIZED',
      'PAYMENT_FAILED',
      'AUTHENTICATION_ERROR',
    ].includes(errorCode)
  ) {
    return 'high';
  }

  // Medium severity
  if (
    [
      'VALIDATION_ERROR',
      'RATE_LIMIT_EXCEEDED',
      'NOT_FOUND',
    ].includes(errorCode)
  ) {
    return 'medium';
  }

  // Low severity
  return 'low';
}

/**
 * Start periodic cleanup of old errors
 */
export function startErrorAnalyticsCleanup(intervalMs: number = 3600000) {
  // Run every hour by default
  setInterval(() => {
    const cleaned = errorAnalytics.clearOldErrors(72); // Keep 72 hours
    if (cleaned > 0) {
      console.log(`[Error Analytics] Cleaned up ${cleaned} old error records`);
    }
  }, intervalMs);
}
