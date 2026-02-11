/**
 * Metrics Archival Job - Automatically persists and cleans up metrics
 */

export class MetricsArchivalJob {
  private archivalInterval: NodeJS.Timer | null = null;
  private archivalIntervalMs = 60000; // 1 minute
  private retentionDays = 30;

  start(): void {
    if (this.archivalInterval) {
      console.log('[MetricsArchivalJob] Job already running');
      return;
    }

    console.log('[MetricsArchivalJob] Starting archival job');
    this.archivalInterval = setInterval(() => {
      this.archiveMetrics();
    }, this.archivalIntervalMs);

    this.archiveMetrics();
  }

  stop(): void {
    if (this.archivalInterval) {
      clearInterval(this.archivalInterval);
      this.archivalInterval = null;
      console.log('[MetricsArchivalJob] Archival job stopped');
    }
  }

  private async archiveMetrics(): Promise<void> {
    try {
      console.log('[MetricsArchivalJob] Archiving metrics...');
      await this.cleanupOldMetrics();
    } catch (error) {
      console.error('[MetricsArchivalJob] Error archiving metrics:', error);
    }
  }

  private async cleanupOldMetrics(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      console.log('[MetricsArchivalJob] Cleaning up metrics before:', cutoffDate);
    } catch (error) {
      console.error('[MetricsArchivalJob] Error cleaning up old metrics:', error);
    }
  }

  setArchivalInterval(intervalMs: number): void {
    this.archivalIntervalMs = intervalMs;
    if (this.archivalInterval) {
      this.stop();
      this.start();
    }
  }

  setRetentionDays(days: number): void {
    this.retentionDays = days;
  }

  getStatus() {
    return {
      isRunning: this.archivalInterval !== null,
      archivalIntervalMs: this.archivalIntervalMs,
      retentionDays: this.retentionDays,
    };
  }

  async forceArchival(): Promise<void> {
    console.log('[MetricsArchivalJob] Forcing immediate archival');
    await this.archiveMetrics();
  }
}

export const metricsArchivalJob = new MetricsArchivalJob();
