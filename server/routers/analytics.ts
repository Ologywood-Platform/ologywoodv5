import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { errorAnalytics, getErrorSeverity } from '../analytics/errorAnalytics';
import { errorGroupingService } from '../analytics/errorGrouping';
import { errorTrendPredictionService } from '../analytics/errorTrendPrediction';

/**
 * Analytics TRPC Router
 * Provides endpoints for accessing error metrics and analytics data
 */
export const analyticsRouter = router({
  /**
   * Get error metrics for a specified time period
   */
  getErrorMetrics: publicProcedure
    .input(
      z.object({
        hoursBack: z.number().min(1).max(720).default(24),
      })
    )
    .query(({ input }: any) => {
      return errorAnalytics.getMetrics(input.hoursBack);
    }),

  /**
   * Get error summary for dashboard
   */
  getErrorSummary: publicProcedure.query(() => {
    return errorAnalytics.getSummary();
  }),

  /**
   * Get errors for a specific user
   */
  getUserErrors: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(({ input }: any) => {
      return errorAnalytics.getUserErrors(input.userId, input.limit);
    }),

  /**
   * Get errors for a specific endpoint
   */
  getEndpointErrors: publicProcedure
    .input(
      z.object({
        endpoint: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(({ input }: any) => {
      return errorAnalytics.getEndpointErrors(input.endpoint, input.limit);
    }),

  /**
   * Get errors with specific code
   */
  getErrorsByCode: publicProcedure
    .input(
      z.object({
        code: z.string(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(({ input }: any) => {
      return errorAnalytics.getErrorsByCode(input.code, input.limit);
    }),

  /**
   * Get critical errors
   */
  getCriticalErrors: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(({ input }: any) => {
      return errorAnalytics.getCriticalErrors(input.limit);
    }),

  /**
   * Record an error event (called from client or server)
   */
  recordError: publicProcedure
    .input(
      z.object({
        errorCode: z.string(),
        errorMessage: z.string(),
        endpoint: z.string().optional(),
        context: z.record(z.string(), z.any()).optional(),
        severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      })
    )
    .mutation(({ input, ctx }: any) => {
      const severity =
        input.severity || getErrorSeverity(input.errorCode);

      errorAnalytics.recordError({
        errorCode: input.errorCode,
        errorMessage: input.errorMessage,
        userId: ctx.user?.id as number | undefined,
        endpoint: input.endpoint,
        userAgent: (ctx.req?.headers['user-agent'] || '') as string,
        ipAddress: (ctx.req?.socket.remoteAddress || '') as string,
        context: input.context,
        severity,
      });

      return { recorded: true };
    }),

  /**
   * Get grouped errors
   */
  getGroupedErrors: publicProcedure
    .input(
      z.object({
        severity: z.string().optional(),
        endpoint: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(({ input }: any) => {
      let groups = errorGroupingService.getGroups();
      if (input.severity) {
        groups = groups.filter((g) => g.severity === input.severity);
      }
      if (input.endpoint) {
        groups = groups.filter((g) => g.endpoints.includes(input.endpoint));
      }
      return groups.slice(0, input.limit);
    }),

  /**
   * Get error group statistics
   */
  getGroupStatistics: publicProcedure.query(() => {
    return errorGroupingService.getStatistics();
  }),

  /**
   * Get related errors for an error code
   */
  getRelatedErrors: publicProcedure
    .input(z.object({ errorCode: z.string() }))
    .query(({ input }: any) => {
      return errorGroupingService.findRelatedErrors(input.errorCode);
    }),

  /**
   * Get error trend analysis
   */
  getTrendAnalysis: publicProcedure
    .input(z.object({ groupId: z.string() }))
    .query(({ input }: any) => {
      return errorTrendPredictionService.getTrendAnalysis(input.groupId);
    }),

  /**
   * Get all trend analyses
   */
  getAllTrends: publicProcedure.query(() => {
    return errorTrendPredictionService.getAllTrendAnalyses();
  }),

  /**
   * Get anomalies
   */
  getAnomalies: publicProcedure.query(() => {
    return errorTrendPredictionService.getAnomalies();
  }),

  /**
   * Get increasing trends
   */
  getIncreasingTrends: publicProcedure.query(() => {
    return errorTrendPredictionService.getIncreasingTrends();
  }),

  /**
   * Get prediction alerts
   */
  getPredictionAlerts: publicProcedure
    .input(
      z.object({
        hoursBack: z.number().min(1).max(720).default(24),
      })
    )
    .query(({ input }: any) => {
      return errorTrendPredictionService.getRecentAlerts(input.hoursBack);
    }),

  /**
   * Get critical alerts
   */
  getCriticalAlerts: publicProcedure.query(() => {
    return errorTrendPredictionService.getCriticalAlerts();
  }),

  /**
   * Get prediction statistics
   */
  getPredictionStats: publicProcedure.query(() => {
    return errorTrendPredictionService.getPredictionStatistics();
  }),

  /**
   * Export errors for analysis (admin only)
   */
  exportErrors: protectedProcedure
    .input(
      z.object({
        hoursBack: z.number().min(1).max(720).default(24),
      })
    )
    .query(({ input, ctx }: any) => {
      // Check if user is admin
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      return errorAnalytics.exportErrors(input.hoursBack);
    }),

  /**
   * Get health check status
   */
  getHealthStatus: publicProcedure.query(async () => {
    const metrics = errorAnalytics.getMetrics(1); // Last hour

    return {
      status: 'healthy',
      timestamp: new Date(),
      errorRate: metrics.totalErrors / 60, // Per minute
      criticalErrors: metrics.errorsBySeverity['critical'] || 0,
      uptime: process.uptime(),
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
      },
    };
  }),

  /**
   * Get error trends over time
   */
  getErrorTrends: publicProcedure
    .input(
      z.object({
        hoursBack: z.number().min(1).max(720).default(24),
      })
    )
    .query(({ input }: any) => {
      const metrics = errorAnalytics.getMetrics(input.hoursBack);
      return metrics.errorTrend;
    }),

  /**
   * Get top errors by frequency
   */
  getTopErrors: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(10),
        hoursBack: z.number().min(1).max(720).default(24),
      })
    )
    .query(({ input }: any) => {
      const metrics = errorAnalytics.getMetrics(input.hoursBack);
      return metrics.topErrors.slice(0, input.limit);
    }),

  /**
   * Get error distribution by severity
   */
  getErrorBySeverity: publicProcedure
    .input(
      z.object({
        hoursBack: z.number().min(1).max(720).default(24),
      })
    )
    .query(({ input }: any) => {
      const metrics = errorAnalytics.getMetrics(input.hoursBack);
      return metrics.errorsBySeverity;
    }),

  /**
   * Get error distribution by endpoint
   */
  getErrorByEndpoint: publicProcedure
    .input(
      z.object({
        hoursBack: z.number().min(1).max(720).default(24),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(({ input }: any) => {
      const metrics = errorAnalytics.getMetrics(input.hoursBack);
      return Object.entries(metrics.errorsByEndpoint)
        .sort(([, a], [, b]) => b - a)
        .slice(0, input.limit)
        .map(([endpoint, count]) => ({ endpoint, count }));
    }),
});
