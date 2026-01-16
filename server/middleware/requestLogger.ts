import { Request, Response, NextFunction } from 'express';
import { logger } from '../errorHandler';

export interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  duration: number; // milliseconds
  userId?: number;
  userRole?: string;
  timestamp: string;
  queryParams?: Record<string, any>;
  errorMessage?: string;
}

class RequestLogger {
  private metrics: RequestMetrics[] = [];
  private maxMetrics = 10000; // Keep last 10k requests in memory

  /**
   * Express middleware for logging requests
   */
  middleware() {
    const self = this;
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const originalSend = res.send;

      // Capture response
      res.send = function (data: any) {
        const duration = Date.now() - startTime;
        const metrics: RequestMetrics = {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          timestamp: new Date().toISOString(),
          queryParams: req.query,
        };

        // Add user info if available
        if ((req as any).user) {
          metrics.userId = (req as any).user.id;
          metrics.userRole = (req as any).user.role;
        }

        // Log slow requests (> 1 second)
        if (duration > 1000) {
          logger.warn(`Slow request: ${req.method} ${req.path}`, {
            duration,
            statusCode: res.statusCode,
          });
        }

        // Log errors
        if (res.statusCode >= 400) {
          logger.error(`Request failed: ${req.method} ${req.path}`, null, {
            statusCode: res.statusCode,
            duration,
          });
        }

        self.recordMetric(metrics);
        logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);

        return originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Record a request metric
   */
  private recordMetric(metric: RequestMetrics): void {
    this.metrics.push(metric);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get metrics for a specific time period
   */
  getMetrics(options?: {
    startTime?: Date;
    endTime?: Date;
    method?: string;
    path?: string;
    statusCode?: number;
  }): RequestMetrics[] {
    let filtered = [...this.metrics];

    if (options?.startTime) {
      const startTime = options.startTime.getTime();
      filtered = filtered.filter(m => new Date(m.timestamp).getTime() >= startTime);
    }

    if (options?.endTime) {
      const endTime = options.endTime.getTime();
      filtered = filtered.filter(m => new Date(m.timestamp).getTime() <= endTime);
    }

    if (options?.method) {
      filtered = filtered.filter(m => m.method === options.method);
    }

    if (options?.path) {
      filtered = filtered.filter(m => m.path === options.path);
    }

    if (options?.statusCode) {
      filtered = filtered.filter(m => m.statusCode === options.statusCode);
    }

    return filtered;
  }

  /**
   * Get performance statistics
   */
  getStats(metrics: RequestMetrics[] = this.metrics) {
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        errorRate: 0,
        requestsPerSecond: 0,
      };
    }

    const durations = metrics.map(m => m.duration);
    const errors = metrics.filter(m => m.statusCode >= 400).length;

    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const timeSpan = metrics.length > 0
      ? (new Date(metrics[metrics.length - 1].timestamp).getTime() -
         new Date(metrics[0].timestamp).getTime()) / 1000
      : 1;

    return {
      totalRequests: metrics.length,
      averageDuration: Math.round(totalDuration / metrics.length),
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      errorRate: (errors / metrics.length) * 100,
      requestsPerSecond: timeSpan > 0 ? metrics.length / timeSpan : 0,
    };
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints(limit: number = 10): Array<{
    path: string;
    method: string;
    averageDuration: number;
    count: number;
  }> {
    const grouped = new Map<string, RequestMetrics[]>();

    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.path}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    return Array.from(grouped.entries())
      .map(([key, metrics]) => {
        const [method, path] = key.split(' ');
        const avgDuration = metrics.reduce((a, b) => a + b.duration, 0) / metrics.length;
        return { path, method, averageDuration: Math.round(avgDuration), count: metrics.length };
      })
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, limit);
  }

  /**
   * Get most frequently accessed endpoints
   */
  getMostAccessedEndpoints(limit: number = 10): Array<{
    path: string;
    method: string;
    count: number;
    errorCount: number;
  }> {
    const grouped = new Map<string, RequestMetrics[]>();

    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.path}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    return Array.from(grouped.entries())
      .map(([key, metrics]) => {
        const [method, path] = key.split(' ');
        const errorCount = metrics.filter(m => m.statusCode >= 400).length;
        return { path, method, count: metrics.length, errorCount };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Get error summary
   */
  getErrorSummary() {
    const errors = this.metrics.filter(m => m.statusCode >= 400);
    const grouped = new Map<number, number>();

    for (const error of errors) {
      const count = grouped.get(error.statusCode) || 0;
      grouped.set(error.statusCode, count + 1);
    }

    return {
      totalErrors: errors.length,
      errorsByStatus: Object.fromEntries(grouped),
      errorRate: (errors.length / this.metrics.length) * 100,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Export metrics to JSON
   */
  export(): string {
    return JSON.stringify({
      metrics: this.metrics,
      stats: this.getStats(),
      slowestEndpoints: this.getSlowestEndpoints(),
      mostAccessed: this.getMostAccessedEndpoints(),
      errors: this.getErrorSummary(),
    }, null, 2);
  }
}

// Export singleton instance
export const requestLogger = new RequestLogger();
