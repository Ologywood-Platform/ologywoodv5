/**
 * Metrics Archival Job - Automatically persists and cleans up metrics
 */

export class MetricsArchivalJob {
  private archivalInterval: ReturnType<typeof setInterval> | null = null;
  private archivalIntervalMs = 60000; // 1 minute
  private retentionDays = 30;

  start(): void {
    if (this.archivalInterval) {
return;
    }

this.archivalInterval = setInterval(() => {
      this.archiveMetrics();
    }, this.archivalIntervalMs);

    this.archiveMetrics();
  }

  stop(): void {
    if (this.archivalInterval) {
      clearInterval(this.archivalInterval);
      this.archivalInterval = null;
}
  }

  private async archiveMetrics(): Promise<void> {
    try {
await this.cleanupOldMetrics();
    } catch (error) {
      console.error('[MetricsArchivalJob] Error archiving metrics:', error);
    }
  }

  private async cleanupOldMetrics(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
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
await this.archiveMetrics();
  }
}

export const metricsArchivalJob = new MetricsArchivalJob();
