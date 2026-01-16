import { router, publicProcedure } from './trpc';
import {
  performHealthCheck,
  livenessCheck,
  readinessCheck,
} from './health';

export const healthRouter = router({
  /**
   * Comprehensive health check endpoint
   * Returns detailed status of all system components
   */
  check: publicProcedure.query(async () => {
    const result = await performHealthCheck();
    return result;
  }),

  /**
   * Liveness probe for Kubernetes/container orchestration
   * Returns true if the application is running
   */
  liveness: publicProcedure.query(async () => {
    const isAlive = await livenessCheck();
    return {
      alive: isAlive,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Readiness probe for Kubernetes/container orchestration
   * Returns true if the application is ready to handle requests
   */
  readiness: publicProcedure.query(async () => {
    const isReady = await readinessCheck();
    return {
      ready: isReady,
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Get system metrics
   */
  metrics: publicProcedure.query(() => {
    const uptime = process.uptime();
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      uptime,
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024),
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Get version information
   */
  version: publicProcedure.query(() => {
    return {
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };
  }),
});
