/**
 * Centralized Logging & Monitoring
 * Implements comprehensive logging for security events and application monitoring
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Log event types
 */
export enum LogEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_INVALID = 'TOKEN_INVALID',
  
  // Authorization events
  AUTHORIZATION_SUCCESS = 'AUTHORIZATION_SUCCESS',
  AUTHORIZATION_FAILURE = 'AUTHORIZATION_FAILURE',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // Data access events
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  DATA_DELETION = 'DATA_DELETION',
  
  // Security events
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  MALWARE_DETECTED = 'MALWARE_DETECTED',
  INJECTION_ATTEMPT = 'INJECTION_ATTEMPT',
  XSS_ATTEMPT = 'XSS_ATTEMPT',
  CSRF_ATTEMPT = 'CSRF_ATTEMPT',
  
  // File operations
  FILE_UPLOAD = 'FILE_UPLOAD',
  FILE_DOWNLOAD = 'FILE_DOWNLOAD',
  FILE_DELETION = 'FILE_DELETION',
  
  // Payment events
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILURE = 'PAYMENT_FAILURE',
  REFUND = 'REFUND',
  
  // System events
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
  SERVER_STARTUP = 'SERVER_STARTUP',
  SERVER_SHUTDOWN = 'SERVER_SHUTDOWN',
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  eventType: LogEventType;
  userId?: number | string;
  userRole?: string;
  ipAddress?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  message: string;
  details?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * In-memory log storage (in production, use external service like ELK, Splunk, etc.)
 */
const logStore: LogEntry[] = [];
const MAX_LOGS = 10000;

/**
 * Log a security or application event
 */
export function logEvent(entry: Omit<LogEntry, 'timestamp'>): void {
  const logEntry: LogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Store log entry
  logStore.push(logEntry);

  // Maintain max log size
  if (logStore.length > MAX_LOGS) {
    logStore.shift();
  }

  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[${logEntry.level}] ${logEntry.eventType}: ${logEntry.message}`);
  }

  // Alert on critical events
  if (logEntry.level === LogLevel.CRITICAL) {
    alertSecurityTeam(logEntry);
  }
}

/**
 * Request logging middleware
 */
export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override send to capture response
  res.send = function (data: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Log successful requests
    if (statusCode < 400) {
      logEvent({
        level: LogLevel.INFO,
        eventType: LogEventType.INFO,
        userId: (req as any).user?.id,
        userRole: (req as any).user?.role,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
        method: req.method,
        statusCode: statusCode,
        message: `${req.method} ${req.path}`,
        details: {
          duration: `${duration}ms`,
          responseSize: Buffer.byteLength(JSON.stringify(data)),
        },
      });
    }

    // Log errors and warnings
    if (statusCode >= 400) {
      logEvent({
        level: statusCode >= 500 ? LogLevel.ERROR : LogLevel.WARN,
        eventType: statusCode >= 500 ? LogEventType.ERROR : LogEventType.WARNING,
        userId: (req as any).user?.id,
        userRole: (req as any).user?.role,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        endpoint: req.path,
        method: req.method,
        statusCode: statusCode,
        message: `${req.method} ${req.path} returned ${statusCode}`,
        details: {
          duration: `${duration}ms`,
          error: data,
        },
      });
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Log authentication event
 */
export function logAuthEvent(
  eventType: LogEventType,
  userId: number | string,
  ipAddress: string,
  userAgent?: string,
  details?: Record<string, any>
): void {
  logEvent({
    level: eventType.includes('FAILURE') ? LogLevel.WARN : LogLevel.INFO,
    eventType,
    userId,
    ipAddress,
    userAgent,
    message: `Authentication event: ${eventType}`,
    details,
  });
}

/**
 * Log authorization event
 */
export function logAuthorizationEvent(
  eventType: LogEventType,
  userId: number | string,
  userRole: string,
  resource: string,
  ipAddress: string,
  details?: Record<string, any>
): void {
  logEvent({
    level: eventType.includes('FAILURE') ? LogLevel.WARN : LogLevel.INFO,
    eventType,
    userId,
    userRole,
    ipAddress,
    message: `Authorization event: ${eventType} for resource ${resource}`,
    details,
  });
}

/**
 * Log security event
 */
export function logSecurityEvent(
  eventType: LogEventType,
  message: string,
  ipAddress?: string,
  userId?: number | string,
  details?: Record<string, any>
): void {
  logEvent({
    level: LogLevel.CRITICAL,
    eventType,
    userId,
    ipAddress,
    message,
    details,
  });
}

/**
 * Log data access event
 */
export function logDataAccessEvent(
  userId: number | string,
  userRole: string,
  resource: string,
  action: 'READ' | 'WRITE' | 'DELETE',
  ipAddress: string,
  details?: Record<string, any>
): void {
  const eventTypeMap = {
    READ: LogEventType.DATA_ACCESS,
    WRITE: LogEventType.DATA_MODIFICATION,
    DELETE: LogEventType.DATA_DELETION,
  };

  logEvent({
    level: LogLevel.INFO,
    eventType: eventTypeMap[action],
    userId,
    userRole,
    ipAddress,
    message: `Data ${action.toLowerCase()}: ${resource}`,
    details,
  });
}

/**
 * Log payment event
 */
export function logPaymentEvent(
  eventType: LogEventType,
  userId: number | string,
  amount: number,
  currency: string,
  status: string,
  ipAddress: string,
  details?: Record<string, any>
): void {
  logEvent({
    level: eventType.includes('FAILURE') ? LogLevel.ERROR : LogLevel.INFO,
    eventType,
    userId,
    ipAddress,
    message: `Payment event: ${eventType} for ${amount} ${currency}`,
    details: {
      amount,
      currency,
      status,
      ...details,
    },
  });
}

/**
 * Get logs with filtering
 */
export function getLogs(filters?: {
  level?: LogLevel;
  eventType?: LogEventType;
  userId?: number | string;
  ipAddress?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
}): LogEntry[] {
  let filtered = [...logStore];

  if (filters?.level) {
    filtered = filtered.filter(log => log.level === filters.level);
  }

  if (filters?.eventType) {
    filtered = filtered.filter(log => log.eventType === filters.eventType);
  }

  if (filters?.userId) {
    filtered = filtered.filter(log => log.userId === filters.userId);
  }

  if (filters?.ipAddress) {
    filtered = filtered.filter(log => log.ipAddress === filters.ipAddress);
  }

  if (filters?.startTime) {
    filtered = filtered.filter(log => new Date(log.timestamp) >= filters.startTime!);
  }

  if (filters?.endTime) {
    filtered = filtered.filter(log => new Date(log.timestamp) <= filters.endTime!);
  }

  const limit = filters?.limit || 100;
  return filtered.slice(-limit);
}

/**
 * Alert security team on critical events
 */
function alertSecurityTeam(logEntry: LogEntry): void {
  // In production, integrate with alerting service (PagerDuty, Slack, etc.)
  console.error('[SECURITY ALERT]', logEntry);
  
  // Example: Send to Slack
  // sendSlackAlert(logEntry);
  
  // Example: Create incident in PagerDuty
  // createPagerDutyIncident(logEntry);
}

/**
 * Get security audit trail for a user
 */
export function getUserAuditTrail(userId: number | string, limit: number = 100): LogEntry[] {
  return getLogs({
    userId,
    limit,
  });
}

/**
 * Get security events
 */
export function getSecurityEvents(limit: number = 100): LogEntry[] {
  const securityEventTypes = [
    LogEventType.RATE_LIMIT_EXCEEDED,
    LogEventType.SUSPICIOUS_ACTIVITY,
    LogEventType.MALWARE_DETECTED,
    LogEventType.INJECTION_ATTEMPT,
    LogEventType.XSS_ATTEMPT,
    LogEventType.CSRF_ATTEMPT,
    LogEventType.AUTHORIZATION_FAILURE,
    LogEventType.LOGIN_FAILURE,
  ];

  return logStore
    .filter(log => securityEventTypes.includes(log.eventType))
    .slice(-limit);
}

/**
 * Export logs for analysis
 */
export function exportLogs(format: 'json' | 'csv' = 'json'): string {
  if (format === 'json') {
    return JSON.stringify(logStore, null, 2);
  }

  // CSV format
  const headers = ['timestamp', 'level', 'eventType', 'userId', 'ipAddress', 'message'];
  const rows = logStore.map(log =>
    headers.map(header => {
      const value = log[header as keyof LogEntry];
      return typeof value === 'string' ? `"${value}"` : value;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Clear logs (for testing)
 */
export function clearLogs(): void {
  logStore.length = 0;
}

/**
 * Get log statistics
 */
export function getLogStatistics(): {
  totalLogs: number;
  byLevel: Record<LogLevel, number>;
  byEventType: Record<LogEventType, number>;
  criticalEvents: number;
  last24Hours: number;
} {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;

  const byLevel: Record<LogLevel, number> = {
    [LogLevel.DEBUG]: 0,
    [LogLevel.INFO]: 0,
    [LogLevel.WARN]: 0,
    [LogLevel.ERROR]: 0,
    [LogLevel.CRITICAL]: 0,
  };

  const byEventType: Record<LogEventType, number> = {} as any;

  let criticalEvents = 0;
  let last24Hours = 0;

  logStore.forEach(log => {
    byLevel[log.level]++;
    byEventType[log.eventType] = (byEventType[log.eventType] || 0) + 1;

    if (log.level === LogLevel.CRITICAL) {
      criticalEvents++;
    }

    if (new Date(log.timestamp).getTime() >= oneDayAgo) {
      last24Hours++;
    }
  });

  return {
    totalLogs: logStore.length,
    byLevel,
    byEventType,
    criticalEvents,
    last24Hours,
  };
}
