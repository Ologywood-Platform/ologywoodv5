/**
 * External Logging Service Integration
 * Supports ELK Stack, Splunk, Datadog, and other logging services
 */

import { LogEntry, LogLevel, LogEventType } from '../middleware/logging';

/**
 * External logging provider types
 */
export type LoggingProvider = 'elk' | 'splunk' | 'datadog' | 'cloudwatch' | 'stackdriver';

/**
 * External logging configuration
 */
export interface ExternalLoggingConfig {
  provider: LoggingProvider;
  enabled: boolean;
  endpoint: string;
  apiKey?: string;
  index?: string;
  batchSize?: number;
  flushInterval?: number;
}

/**
 * Log batch for efficient sending
 */
interface LogBatch {
  logs: LogEntry[];
  timestamp: Date;
  size: number;
}

/**
 * External Logging Service
 */
export class ExternalLoggingService {
  private config: ExternalLoggingConfig;
  private logBatch: LogBatch;
  private flushTimer?: NodeJS.Timeout;

  constructor(config: ExternalLoggingConfig) {
    this.config = config;
    this.logBatch = {
      logs: [],
      timestamp: new Date(),
      size: 0,
    };

    if (config.enabled) {
      this.startBatchFlushing();
    }
  }

  /**
   * Send log to external service
   */
  async sendLog(log: LogEntry): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    // Add to batch
    this.logBatch.logs.push(log);
    this.logBatch.size += JSON.stringify(log).length;

    // Flush if batch is full
    if (
      this.logBatch.logs.length >= (this.config.batchSize || 100) ||
      this.logBatch.size > 1024 * 1024 // 1MB
    ) {
      await this.flush();
    }
  }

  /**
   * Flush batch to external service
   */
  async flush(): Promise<void> {
    if (this.logBatch.logs.length === 0) {
      return;
    }

    try {
      const logs = this.logBatch.logs;
      this.logBatch = {
        logs: [],
        timestamp: new Date(),
        size: 0,
      };

      switch (this.config.provider) {
        case 'elk':
          await this.sendToElk(logs);
          break;
        case 'splunk':
          await this.sendToSplunk(logs);
          break;
        case 'datadog':
          await this.sendToDatadog(logs);
          break;
        case 'cloudwatch':
          await this.sendToCloudWatch(logs);
          break;
        case 'stackdriver':
          await this.sendToStackdriver(logs);
          break;
      }

      console.log(`[ExternalLogging] Flushed ${logs.length} logs to ${this.config.provider}`);
    } catch (error) {
      console.error('[ExternalLogging] Error flushing logs:', error);
    }
  }

  /**
   * Send logs to ELK Stack
   */
  private async sendToElk(logs: LogEntry[]): Promise<void> {
    const bulkData = logs
      .map(log => {
        const metadata = JSON.stringify({
          index: this.config.index || 'ologywood-logs',
          _id: `${log.timestamp}-${Math.random()}`,
        });
        return `${metadata}\n${JSON.stringify(log)}\n`;
      })
      .join('');

    const response = await fetch(`${this.config.endpoint}/_bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-ndjson',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
      body: bulkData,
    });

    if (!response.ok) {
      throw new Error(`ELK API error: ${response.statusText}`);
    }
  }

  /**
   * Send logs to Splunk
   */
  private async sendToSplunk(logs: LogEntry[]): Promise<void> {
    const response = await fetch(`${this.config.endpoint}/services/collector`, {
      method: 'POST',
      headers: {
        Authorization: `Splunk ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: logs,
        source: 'ologywood',
        sourcetype: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Splunk API error: ${response.statusText}`);
    }
  }

  /**
   * Send logs to Datadog
   */
  private async sendToDatadog(logs: LogEntry[]): Promise<void> {
    const response = await fetch(`${this.config.endpoint}/v1/input/${this.config.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logs),
    });

    if (!response.ok) {
      throw new Error(`Datadog API error: ${response.statusText}`);
    }
  }

  /**
   * Send logs to AWS CloudWatch
   */
  private async sendToCloudWatch(logs: LogEntry[]): Promise<void> {
    // In production, use AWS SDK
    // const cloudwatch = new CloudWatchLogs();
    // await cloudwatch.putLogEvents({
    //   logGroupName: '/ologywood/application',
    //   logStreamName: new Date().toISOString().split('T')[0],
    //   logEvents: logs.map(log => ({
    //     message: JSON.stringify(log),
    //     timestamp: new Date(log.timestamp).getTime(),
    //   })),
    // }).promise();

    console.log('[ExternalLogging] CloudWatch logging would be sent here');
  }

  /**
   * Send logs to Google Cloud Logging (Stackdriver)
   */
  private async sendToStackdriver(logs: LogEntry[]): Promise<void> {
    // In production, use Google Cloud Logging client
    // const logging = new Logging();
    // const log = logging.log('ologywood-logs');
    // await log.write(logs.map(entry => ({
    //   jsonPayload: entry,
    //   severity: entry.level,
    // })));

    console.log('[ExternalLogging] Stackdriver logging would be sent here');
  }

  /**
   * Start automatic batch flushing
   */
  private startBatchFlushing(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(error => {
        console.error('[ExternalLogging] Flush error:', error);
      });
    }, (this.config.flushInterval || 30) * 1000);
  }

  /**
   * Stop the service
   */
  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }

  /**
   * Get batch status
   */
  getStatus(): {
    logsInBatch: number;
    batchSize: number;
    lastFlush: Date;
  } {
    return {
      logsInBatch: this.logBatch.logs.length,
      batchSize: this.logBatch.size,
      lastFlush: this.logBatch.timestamp,
    };
  }
}

/**
 * Create external logging service based on environment
 */
export function createExternalLoggingService(): ExternalLoggingService | null {
  const provider = process.env.LOGGING_PROVIDER as LoggingProvider;
  const enabled = process.env.EXTERNAL_LOGGING_ENABLED === 'true';

  if (!enabled || !provider) {
    return null;
  }

  const config: ExternalLoggingConfig = {
    provider,
    enabled,
    endpoint: process.env.LOGGING_ENDPOINT || '',
    apiKey: process.env.LOGGING_API_KEY,
    index: process.env.LOGGING_INDEX,
    batchSize: parseInt(process.env.LOGGING_BATCH_SIZE || '100'),
    flushInterval: parseInt(process.env.LOGGING_FLUSH_INTERVAL || '30'),
  };

  return new ExternalLoggingService(config);
}

/**
 * Configuration examples for different providers
 */
export const loggingProviderExamples = {
  elk: {
    provider: 'elk' as const,
    enabled: true,
    endpoint: 'http://elasticsearch:9200',
    index: 'ologywood-logs',
    batchSize: 100,
    flushInterval: 30,
  },
  splunk: {
    provider: 'splunk' as const,
    enabled: true,
    endpoint: 'https://your-splunk-instance.splunkcloud.com',
    apiKey: 'your-splunk-hec-token',
    batchSize: 100,
    flushInterval: 30,
  },
  datadog: {
    provider: 'datadog' as const,
    enabled: true,
    endpoint: 'https://http-intake.logs.datadoghq.com',
    apiKey: 'your-datadog-api-key',
    batchSize: 100,
    flushInterval: 30,
  },
  cloudwatch: {
    provider: 'cloudwatch' as const,
    enabled: true,
    endpoint: 'aws-cloudwatch',
    apiKey: 'aws-credentials',
    batchSize: 100,
    flushInterval: 30,
  },
  stackdriver: {
    provider: 'stackdriver' as const,
    enabled: true,
    endpoint: 'google-cloud-logging',
    apiKey: 'google-credentials',
    batchSize: 100,
    flushInterval: 30,
  },
};
