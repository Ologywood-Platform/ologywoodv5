import * as email from '../email';
import { errorAnalytics } from '../analytics/errorAnalytics';

/**
 * Email alert configuration
 */
export interface AlertConfig {
  enabled: boolean;
  errorRateThreshold: number; // errors per minute
  criticalErrorThreshold: number; // number of critical errors
  checkInterval: number; // milliseconds
  adminEmails: string[];
}

/**
 * Alert state
 */
interface AlertState {
  lastAlertTime: number;
  alertCooldown: number; // milliseconds between alerts
  hasAlerted: boolean;
}

/**
 * Email Alert System
 * Sends alerts when error thresholds are exceeded
 */
class EmailAlertSystem {
  private config: AlertConfig;
  private alertState: AlertState;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<AlertConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      errorRateThreshold: config.errorRateThreshold ?? 10, // 10 errors per minute
      criticalErrorThreshold: config.criticalErrorThreshold ?? 5,
      checkInterval: config.checkInterval ?? 60000, // 1 minute
      adminEmails: config.adminEmails ?? [],
    };

    this.alertState = {
      lastAlertTime: 0,
      alertCooldown: 300000, // 5 minutes between alerts
      hasAlerted: false,
    };
  }

  /**
   * Start monitoring for alerts
   */
  start(): void {
    if (!this.config.enabled) {
      console.log('[Email Alert System] Disabled');
      return;
    }

    if (this.checkInterval) {
      console.log('[Email Alert System] Already running');
      return;
    }

    console.log('[Email Alert System] Started monitoring');

    this.checkInterval = setInterval(() => {
      this.checkErrorThresholds();
    }, this.config.checkInterval);
  }

  /**
   * Stop monitoring for alerts
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('[Email Alert System] Stopped');
    }
  }

  /**
   * Check if error thresholds are exceeded
   */
  private checkErrorThresholds(): void {
    const metrics = errorAnalytics.getMetrics(1); // Last hour
    const errorRate = metrics.totalErrors / 60; // Per minute
    const criticalErrors = metrics.errorsBySeverity['critical'] || 0;

    // Check if thresholds are exceeded
    const errorRateExceeded = errorRate > this.config.errorRateThreshold;
    const criticalErrorsExceeded =
      criticalErrors > this.config.criticalErrorThreshold;

    if (errorRateExceeded || criticalErrorsExceeded) {
      this.sendAlert(
        errorRate,
        criticalErrors,
        metrics.topErrors.slice(0, 5)
      );
    } else {
      // Reset alert state if thresholds are back to normal
      this.alertState.hasAlerted = false;
    }
  }

  /**
   * Send alert email to admins
   */
  private sendAlert(
    errorRate: number,
    criticalErrors: number,
    topErrors: any[]
  ): void {
    // Check cooldown period
    const now = Date.now();
    if (
      this.alertState.hasAlerted &&
      now - this.alertState.lastAlertTime < this.alertState.alertCooldown
    ) {
      return;
    }

    this.alertState.hasAlerted = true;
    this.alertState.lastAlertTime = now;

    // Build email content
    const subject = `🚨 Ologywood Error Alert - High Error Rate Detected`;
    const topErrorsList = topErrors
      .map((e) => `• ${e.code}: ${e.count} occurrences (${e.affectedUsers} users)`)
      .join('\n');

    const htmlContent = `
      <h2>Error Alert Summary</h2>
      <p>Ologywood has detected elevated error rates. Please review the details below:</p>
      
      <h3>Metrics</h3>
      <ul>
        <li><strong>Error Rate:</strong> ${errorRate.toFixed(2)} errors/minute</li>
        <li><strong>Critical Errors:</strong> ${criticalErrors}</li>
        <li><strong>Threshold (Error Rate):</strong> ${this.config.errorRateThreshold} errors/minute</li>
        <li><strong>Threshold (Critical):</strong> ${this.config.criticalErrorThreshold}</li>
      </ul>
      
      <h3>Top Errors</h3>
      <pre>${topErrorsList}</pre>
      
      <h3>Action Required</h3>
      <p>Please log in to the admin dashboard to investigate:</p>
      <a href="${process.env.VITE_APP_URL || 'https://ologywood.com'}/admin/analytics">
        View Analytics Dashboard
      </a>
      
      <p>
        <small>This is an automated alert. If you believe this is a false positive, 
        you can adjust alert thresholds in the admin settings.</small>
      </p>
    `;

    const textContent = `
Error Alert Summary

Ologywood has detected elevated error rates. Please review the details below:

Metrics:
- Error Rate: ${errorRate.toFixed(2)} errors/minute
- Critical Errors: ${criticalErrors}
- Threshold (Error Rate): ${this.config.errorRateThreshold} errors/minute
- Threshold (Critical): ${this.config.criticalErrorThreshold}

Top Errors:
${topErrorsList}

Action Required:
Please log in to the admin dashboard to investigate:
${process.env.VITE_APP_URL || 'https://ologywood.com'}/admin/analytics

This is an automated alert. If you believe this is a false positive, 
you can adjust alert thresholds in the admin settings.
    `;

    // Send emails to all admins
    this.config.adminEmails.forEach((adminEmail) => {
      email
        .sendEmail({
          to: adminEmail,
          subject,
          html: htmlContent,
        })
        .catch((error) => {
          console.error(`[Email Alert] Failed to send alert to ${adminEmail}:`, error);
        });
    });

    console.log(
      `[Email Alert] Alert sent to ${this.config.adminEmails.length} admins`
    );
  }

  /**
   * Update alert configuration
   */
  updateConfig(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[Email Alert System] Configuration updated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): AlertConfig {
    return { ...this.config };
  }

  /**
   * Add admin email
   */
  addAdminEmail(email: string): void {
    if (!this.config.adminEmails.includes(email)) {
      this.config.adminEmails.push(email);
      console.log(`[Email Alert] Added admin email: ${email}`);
    }
  }

  /**
   * Remove admin email
   */
  removeAdminEmail(email: string): void {
    this.config.adminEmails = this.config.adminEmails.filter((e) => e !== email);
    console.log(`[Email Alert] Removed admin email: ${email}`);
  }

  /**
   * Get alert status
   */
  getStatus(): {
    enabled: boolean;
    running: boolean;
    hasAlerted: boolean;
    lastAlertTime: Date | null;
    adminEmails: string[];
  } {
    return {
      enabled: this.config.enabled,
      running: this.checkInterval !== null,
      hasAlerted: this.alertState.hasAlerted,
      lastAlertTime: this.alertState.lastAlertTime
        ? new Date(this.alertState.lastAlertTime)
        : null,
      adminEmails: this.config.adminEmails,
    };
  }
}

// Singleton instance
export const emailAlertSystem = new EmailAlertSystem({
  enabled: process.env.EMAIL_ALERTS_ENABLED !== 'false',
  errorRateThreshold: parseInt(process.env.ERROR_RATE_THRESHOLD || '10'),
  criticalErrorThreshold: parseInt(process.env.CRITICAL_ERROR_THRESHOLD || '5'),
  adminEmails: (process.env.ADMIN_EMAILS || '').split(',').filter(Boolean),
});

/**
 * Initialize email alert system
 */
export function initializeEmailAlerts(): void {
  emailAlertSystem.start();
}

/**
 * Shutdown email alert system
 */
export function shutdownEmailAlerts(): void {
  emailAlertSystem.stop();
}
