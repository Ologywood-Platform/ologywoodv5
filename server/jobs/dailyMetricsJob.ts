/**
 * Daily Metrics Calculation Job
 * Runs daily to calculate and store metrics for analytics dashboard
 * Schedule: 00:00 UTC daily (configurable)
 */

import { analyticsMetricsService } from '../analyticsMetricsService';

/**
 * Execute daily metrics calculation
 * This function should be called by a cron job scheduler
 */
export async function executeDailyMetricsJob() {
  try {
    console.log('[Daily Metrics Job] Starting daily metrics calculation');
    const startTime = Date.now();

    // Calculate metrics for today
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    const dailyMetrics = await analyticsMetricsService.calculateDailyMetrics(date);

    // Store metrics in database
    const stored = await analyticsMetricsService.storeDailyMetrics(dailyMetrics);

    if (stored) {
      const duration = Date.now() - startTime;
      console.log(`[Daily Metrics Job] Completed successfully in ${duration}ms`);
      return {
        success: true,
        date: date.toISOString().split('T')[0],
        duration,
        metrics: dailyMetrics,
      };
    } else {
      console.error('[Daily Metrics Job] Failed to store metrics');
      return {
        success: false,
        error: 'Failed to store metrics in database',
      };
    }
  } catch (error) {
    console.error('[Daily Metrics Job] Error executing daily metrics calculation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Setup cron job for daily metrics calculation
 * Add this to your server initialization
 */
export function setupDailyMetricsJob() {
  try {
    console.log('[Daily Metrics Job] Setting up daily metrics calculation job');

    // Using node-cron for scheduling
    // Install: npm install node-cron
    // Then uncomment below:

    /*
    import cron from 'node-cron';

    // Run daily at 00:00 UTC
    cron.schedule('0 0 * * *', async () => {
      console.log('[Daily Metrics Job] Executing scheduled daily metrics calculation');
      await executeDailyMetricsJob();
    });

    console.log('[Daily Metrics Job] Daily metrics calculation job scheduled (00:00 UTC)');
    */

    // Alternative: Using node-schedule
    // Install: npm install node-schedule
    // Then uncomment below:

    /*
    import schedule from 'node-schedule';

    const job = schedule.scheduleJob('0 0 * * *', async () => {
      console.log('[Daily Metrics Job] Executing scheduled daily metrics calculation');
      await executeDailyMetricsJob();
    });

    console.log('[Daily Metrics Job] Daily metrics calculation job scheduled');
    */

    // For development/testing: Run every 5 minutes
    // Uncomment below to test:
    /*
    setInterval(async () => {
      console.log('[Daily Metrics Job] Executing metrics calculation (development mode)');
      await executeDailyMetricsJob();
    }, 5 * 60 * 1000); // 5 minutes
    */

    return true;
  } catch (error) {
    console.error('[Daily Metrics Job] Error setting up daily metrics job:', error);
    return false;
  }
}

/**
 * Manual trigger for metrics calculation (for testing)
 */
export async function triggerMetricsCalculation(date?: Date) {
  const targetDate = date || new Date();
  console.log(`[Daily Metrics Job] Manual trigger for ${targetDate.toISOString().split('T')[0]}`);
  return executeDailyMetricsJob();
}

export default {
  executeDailyMetricsJob,
  setupDailyMetricsJob,
  triggerMetricsCalculation,
};
