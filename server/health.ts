import * as db from './db';
import { logger } from './errorHandler';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: HealthStatus;
    memory: HealthStatus;
    cpu: HealthStatus;
    api: HealthStatus;
  };
  details?: Record<string, any>;
}

export interface HealthStatus {
  status: 'ok' | 'warning' | 'error';
  responseTime: number; // milliseconds
  message?: string;
  details?: Record<string, any>;
}

/**
 * Check database connectivity and performance
 */
async function checkDatabase(): Promise<HealthStatus> {
  const startTime = Date.now();
  try {
    // Execute a simple query to verify connectivity
    const result = await db.getUserById(1);
    const responseTime = Date.now() - startTime;

    if (responseTime > 1000) {
      return {
        status: 'warning',
        responseTime,
        message: 'Database response time is slow',
        details: { threshold: 1000 },
      };
    }

    return {
      status: 'ok',
      responseTime,
      message: 'Database is healthy',
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    logger.error('Database health check failed', error);

    return {
      status: 'error',
      responseTime,
      message: error?.message || 'Database connection failed',
      details: { error: error?.code },
    };
  }
}

/**
 * Check memory usage
 */
function checkMemory(): HealthStatus {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

  if (heapUsedPercent > 90) {
    return {
      status: 'error',
      responseTime: 0,
      message: 'Memory usage is critical',
      details: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsedPercent: Math.round(heapUsedPercent),
      },
    };
  }

  if (heapUsedPercent > 75) {
    return {
      status: 'warning',
      responseTime: 0,
      message: 'Memory usage is high',
      details: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsedPercent: Math.round(heapUsedPercent),
      },
    };
  }

  return {
    status: 'ok',
    responseTime: 0,
    message: 'Memory usage is normal',
    details: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsedPercent: Math.round(heapUsedPercent),
    },
  };
}

/**
 * Check CPU usage (simplified)
 */
function checkCPU(): HealthStatus {
  const cpuUsage = process.cpuUsage();
  const totalCPUTime = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds

  return {
    status: 'ok',
    responseTime: 0,
    message: 'CPU usage is normal',
    details: {
      userTime: cpuUsage.user,
      systemTime: cpuUsage.system,
      totalTime: totalCPUTime,
    },
  };
}

/**
 * Check API responsiveness
 */
function checkAPI(): HealthStatus {
  // This is a simple check - in production, you might want to check
  // if the server is accepting connections
  return {
    status: 'ok',
    responseTime: 0,
    message: 'API is responding',
  };
}

/**
 * Perform comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const [database, memory, cpu, api] = await Promise.all([
      checkDatabase(),
      Promise.resolve(checkMemory()),
      Promise.resolve(checkCPU()),
      Promise.resolve(checkAPI()),
    ]);

    // Determine overall status
    const checks = { database, memory, cpu, api };
    const allStatuses = Object.values(checks).map(c => c.status);
    const hasError = allStatuses.includes('error');
    const hasWarning = allStatuses.includes('warning');

    const status: 'healthy' | 'degraded' | 'unhealthy' = hasError
      ? 'unhealthy'
      : hasWarning
      ? 'degraded'
      : 'healthy';

    const result: HealthCheckResult = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      checks,
    };

    logger.info(`Health check completed: ${status}`, {
      uptime: result.uptime,
      memory: memory.details,
    });

    return result;
  } catch (error: any) {
    logger.error('Health check failed', error);

    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION || '1.0.0',
      checks: {
        database: { status: 'error', responseTime: 0, message: 'Check failed' },
        memory: { status: 'error', responseTime: 0, message: 'Check failed' },
        cpu: { status: 'error', responseTime: 0, message: 'Check failed' },
        api: { status: 'error', responseTime: 0, message: 'Check failed' },
      },
      details: { error: error?.message },
    };
  }
}

/**
 * Simplified liveness check (for Kubernetes)
 */
export async function livenessCheck(): Promise<boolean> {
  try {
    // Simple check to see if the application is running
    return true;
  } catch {
    return false;
  }
}

/**
 * Simplified readiness check (for Kubernetes)
 */
export async function readinessCheck(): Promise<boolean> {
  try {
    // Check if database is accessible
    await db.getUserById(1);
    return true;
  } catch {
    return false;
  }
}
