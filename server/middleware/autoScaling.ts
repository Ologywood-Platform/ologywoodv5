/**
 * Invisible Auto-Scaling System
 * Automatically scales resources based on demand
 * Users never see this - it just works
 */

export interface ScalingMetrics {
  cpuUsage: number;
  memoryUsage: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  queueLength: number;
}

export interface ScalingPolicy {
  scaleUpThreshold: number;
  scaleDownThreshold: number;
  minInstances: number;
  maxInstances: number;
  cooldownPeriod: number;
}

const DEFAULT_POLICY: ScalingPolicy = {
  scaleUpThreshold: 70, // Scale up at 70% utilization
  scaleDownThreshold: 30, // Scale down at 30% utilization
  minInstances: 1,
  maxInstances: 10,
  cooldownPeriod: 60000, // 1 minute cooldown between scaling actions
};

export class AutoScaler {
  private policy: ScalingPolicy;
  private currentInstances: number;
  private lastScalingAction: number = 0;
  private metricsHistory: ScalingMetrics[] = [];

  constructor(policy: Partial<ScalingPolicy> = {}) {
    this.policy = { ...DEFAULT_POLICY, ...policy };
    this.currentInstances = this.policy.minInstances;
  }

  /**
   * Evaluate metrics and determine if scaling is needed
   * Returns number of instances to scale to
   */
  evaluateMetrics(metrics: ScalingMetrics): number {
    this.metricsHistory.push(metrics);

    // Keep only last 10 metrics
    if (this.metricsHistory.length > 10) {
      this.metricsHistory.shift();
    }

    // Check if in cooldown period
    if (Date.now() - this.lastScalingAction < this.policy.cooldownPeriod) {
      return this.currentInstances;
    }

    // Calculate average utilization
    const avgUtilization =
      (metrics.cpuUsage + metrics.memoryUsage) / 2 + metrics.queueLength * 5;

    // Determine if we should scale
    if (avgUtilization > this.policy.scaleUpThreshold) {
      return this.scaleUp();
    } else if (avgUtilization < this.policy.scaleDownThreshold) {
      return this.scaleDown();
    }

    return this.currentInstances;
  }

  /**
   * Scale up (add instances)
   */
  private scaleUp(): number {
    const newInstances = Math.min(
      this.currentInstances + 1,
      this.policy.maxInstances
    );

    if (newInstances > this.currentInstances) {
      console.log(
        `[AutoScaler] Scaling up: ${this.currentInstances} → ${newInstances} instances`
      );
      this.currentInstances = newInstances;
      this.lastScalingAction = Date.now();
    }

    return this.currentInstances;
  }

  /**
   * Scale down (remove instances)
   */
  private scaleDown(): number {
    const newInstances = Math.max(
      this.currentInstances - 1,
      this.policy.minInstances
    );

    if (newInstances < this.currentInstances) {
      console.log(
        `[AutoScaler] Scaling down: ${this.currentInstances} → ${newInstances} instances`
      );
      this.currentInstances = newInstances;
      this.lastScalingAction = Date.now();
    }

    return this.currentInstances;
  }

  /**
   * Get current instance count
   */
  getInstanceCount(): number {
    return this.currentInstances;
  }

  /**
   * Get scaling recommendations (for monitoring)
   */
  getRecommendations(metrics: ScalingMetrics): {
    action: 'scale-up' | 'scale-down' | 'none';
    reason: string;
  } {
    const avgUtilization =
      (metrics.cpuUsage + metrics.memoryUsage) / 2 + metrics.queueLength * 5;

    if (avgUtilization > this.policy.scaleUpThreshold) {
      return {
        action: 'scale-up',
        reason: `High utilization: ${avgUtilization.toFixed(1)}%`,
      };
    } else if (avgUtilization < this.policy.scaleDownThreshold) {
      return {
        action: 'scale-down',
        reason: `Low utilization: ${avgUtilization.toFixed(1)}%`,
      };
    }

    return {
      action: 'none',
      reason: 'Utilization within normal range',
    };
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(): ScalingMetrics[] {
    return this.metricsHistory;
  }
}

/**
 * Global auto-scaler instance
 */
let globalScaler: AutoScaler | null = null;

/**
 * Initialize global auto-scaler
 */
export function initializeAutoScaler(
  policy?: Partial<ScalingPolicy>
): AutoScaler {
  if (!globalScaler) {
    globalScaler = new AutoScaler(policy);
  }
  return globalScaler;
}

/**
 * Get global auto-scaler
 */
export function getAutoScaler(): AutoScaler {
  if (!globalScaler) {
    globalScaler = new AutoScaler();
  }
  return globalScaler;
}

/**
 * Collect system metrics
 */
export async function collectMetrics(): Promise<ScalingMetrics> {
  const usage = process.memoryUsage();

  return {
    cpuUsage: process.cpuUsage().user / 1000000, // Convert to percentage
    memoryUsage: (usage.heapUsed / usage.heapTotal) * 100,
    requestsPerSecond: 0, // Would be populated from request counter
    averageResponseTime: 0, // Would be populated from timing data
    errorRate: 0, // Would be populated from error tracking
    queueLength: 0, // Would be populated from request queue
  };
}

/**
 * Request prioritization based on user tier
 * Higher tier users get priority in queue
 */
export function getPriorityScore(
  userTier: string,
  requestType: string
): number {
  const tierScores: Record<string, number> = {
    enterprise: 100,
    professional: 50,
    free: 10,
  };

  const requestScores: Record<string, number> = {
    'read-heavy': 5,
    'write-heavy': 20,
    'real-time': 30,
  };

  return (tierScores[userTier] || 0) + (requestScores[requestType] || 0);
}

/**
 * Estimate response time based on current load
 * Used internally for queue management
 */
export function estimateResponseTime(
  metrics: ScalingMetrics,
  baseTime: number = 50
): number {
  const queuePenalty = metrics.queueLength * 10;
  const utilizationPenalty = (metrics.cpuUsage / 100) * 100;

  return baseTime + queuePenalty + utilizationPenalty;
}

/**
 * Health check for auto-scaling
 */
export async function performHealthCheck(): Promise<{
  healthy: boolean;
  metrics: ScalingMetrics;
  recommendations: {
    action: 'scale-up' | 'scale-down' | 'none';
    reason: string;
  };
}> {
  const scaler = getAutoScaler();
  const metrics = await collectMetrics();
  const recommendations = scaler.getRecommendations(metrics);

  return {
    healthy: metrics.errorRate < 5, // Less than 5% error rate
    metrics,
    recommendations,
  };
}
