/**
 * Error Trend Prediction & Anomaly Detection Service
 * Uses statistical analysis to predict error spikes and detect anomalies
 */

export interface ErrorTrendData {
  timestamp: Date;
  errorCount: number;
  groupId: string;
  severity: string;
}

export interface TrendAnalysis {
  groupId: string;
  currentTrend: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number; // 0-1
  anomalyScore: number; // 0-1
  isAnomaly: boolean;
  predictedCount: number;
  actualCount: number;
  variance: number;
  confidence: number; // 0-1
  recommendation: string;
}

export interface PredictionAlert {
  groupId: string;
  severity: 'warning' | 'critical';
  message: string;
  predictedSpike: number;
  currentRate: number;
  confidence: number;
  timestamp: Date;
  actionRequired: boolean;
}

/**
 * Error Trend Prediction Service
 */
class ErrorTrendPredictionService {
  private trendData: Map<string, ErrorTrendData[]> = new Map();
  private predictions: Map<string, TrendAnalysis> = new Map();
  private alerts: PredictionAlert[] = [];
  private readonly HISTORY_WINDOW = 24 * 60; // 24 hours in minutes
  private readonly MIN_DATA_POINTS = 10;
  private readonly ANOMALY_THRESHOLD = 2.5; // Standard deviations

  /**
   * Record error occurrence
   */
  recordError(
    groupId: string,
    severity: string,
    timestamp: Date = new Date()
  ): void {
    if (!this.trendData.has(groupId)) {
      this.trendData.set(groupId, []);
    }

    const data = this.trendData.get(groupId)!;
    data.push({
      timestamp,
      errorCount: 1,
      groupId,
      severity,
    });

    // Keep only recent data
    const cutoffTime = new Date(Date.now() - this.HISTORY_WINDOW * 60 * 1000);
    const filteredData = data.filter((d) => d.timestamp > cutoffTime);
    this.trendData.set(groupId, filteredData);

    // Analyze trends
    this.analyzeTrend(groupId);
  }

  /**
   * Calculate mean of array
   */
  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.mean(values);
    const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  /**
   * Calculate linear regression
   */
  private linearRegression(
    values: number[]
  ): { slope: number; intercept: number; r2: number } {
    if (values.length < 2) {
      return { slope: 0, intercept: values[0] || 0, r2: 0 };
    }

    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;

    const xMean = this.mean(x);
    const yMean = this.mean(y);

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (x[i] - xMean) * (y[i] - yMean);
      denominator += Math.pow(x[i] - xMean, 2);
    }

    const slope = denominator === 0 ? 0 : numerator / denominator;
    const intercept = yMean - slope * xMean;

    // Calculate R²
    let ssRes = 0;
    let ssTot = 0;

    for (let i = 0; i < n; i++) {
      const predicted = slope * x[i] + intercept;
      ssRes += Math.pow(y[i] - predicted, 2);
      ssTot += Math.pow(y[i] - yMean, 2);
    }

    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return { slope, intercept, r2 };
  }

  /**
   * Detect anomalies using Z-score method
   */
  private detectAnomalies(values: number[]): boolean[] {
    if (values.length < 3) return values.map(() => false);

    const mean = this.mean(values);
    const stdDev = this.standardDeviation(values);

    if (stdDev === 0) return values.map(() => false);

    return values.map((v) => {
      const zScore = Math.abs((v - mean) / stdDev);
      return zScore > this.ANOMALY_THRESHOLD;
    });
  }

  /**
   * Analyze trend for a group
   */
  private analyzeTrend(groupId: string): void {
    const data = this.trendData.get(groupId);
    if (!data || data.length < this.MIN_DATA_POINTS) return;

    // Aggregate errors by time window (5-minute buckets)
    const buckets = this.aggregateByTimeWindow(data, 5);
    const errorCounts = buckets.map((b) => b.count);

    // Calculate trend
    const { slope, intercept, r2 } = this.linearRegression(errorCounts);

    // Detect anomalies
    const anomalies = this.detectAnomalies(errorCounts);
    const isAnomaly = anomalies[anomalies.length - 1] || false;

    // Calculate anomaly score (0-1)
    const mean = this.mean(errorCounts);
    const stdDev = this.standardDeviation(errorCounts);
    const lastValue = errorCounts[errorCounts.length - 1];
    const zScore = stdDev === 0 ? 0 : Math.abs((lastValue - mean) / stdDev);
    const anomalyScore = Math.min(zScore / this.ANOMALY_THRESHOLD, 1);

    // Predict next value
    const nextIndex = errorCounts.length;
    const predictedCount = Math.max(0, slope * nextIndex + intercept);

    // Determine trend direction
    const trendStrength = Math.min(Math.abs(slope) / (mean + 1), 1);
    const currentTrend =
      slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable';

    // Calculate variance
    const variance = this.standardDeviation(errorCounts);

    // Determine confidence
    const confidence = Math.max(0, Math.min(r2, 1));

    // Create analysis
    const analysis: TrendAnalysis = {
      groupId,
      currentTrend,
      trendStrength,
      anomalyScore,
      isAnomaly,
      predictedCount: Math.round(predictedCount),
      actualCount: lastValue,
      variance: Math.round(variance * 100) / 100,
      confidence,
      recommendation: this.generateRecommendation(
        currentTrend,
        anomalyScore,
        trendStrength
      ),
    };

    this.predictions.set(groupId, analysis);

    // Generate alert if needed
    this.generateAlert(analysis);
  }

  /**
   * Aggregate errors by time window
   */
  private aggregateByTimeWindow(
    data: ErrorTrendData[],
    windowMinutes: number
  ): Array<{ timestamp: Date; count: number }> {
    const buckets = new Map<number, number>();

    for (const item of data) {
      const bucketTime = Math.floor(
        item.timestamp.getTime() / (windowMinutes * 60 * 1000)
      );
      buckets.set(bucketTime, (buckets.get(bucketTime) || 0) + 1);
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => a - b)
      .map(([bucketTime, count]) => ({
        timestamp: new Date(bucketTime * windowMinutes * 60 * 1000),
        count,
      }));
  }

  /**
   * Generate recommendation based on analysis
   */
  private generateRecommendation(
    trend: string,
    anomalyScore: number,
    trendStrength: number
  ): string {
    if (anomalyScore > 0.8) {
      return 'CRITICAL: Unusual error spike detected. Investigate immediately.';
    }

    if (trend === 'increasing' && trendStrength > 0.7) {
      return 'WARNING: Error rate is increasing rapidly. Monitor closely.';
    }

    if (trend === 'increasing' && trendStrength > 0.4) {
      return 'INFO: Error rate is gradually increasing. Consider investigating.';
    }

    if (trend === 'decreasing') {
      return 'GOOD: Error rate is decreasing. Continue monitoring.';
    }

    return 'INFO: Error rate is stable. No action required.';
  }

  /**
   * Generate alert if anomaly detected
   */
  private generateAlert(analysis: TrendAnalysis): void {
    const shouldAlert =
      analysis.isAnomaly ||
      (analysis.currentTrend === 'increasing' && analysis.trendStrength > 0.7);

    if (shouldAlert) {
      const severity =
        analysis.anomalyScore > 0.8 ? 'critical' : 'warning';

      const alert: PredictionAlert = {
        groupId: analysis.groupId,
        severity,
        message: analysis.recommendation,
        predictedSpike: analysis.predictedCount,
        currentRate: analysis.actualCount,
        confidence: analysis.confidence,
        timestamp: new Date(),
        actionRequired: analysis.anomalyScore > 0.8,
      };

      this.alerts.push(alert);

      // Keep only recent alerts
      const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.alerts = this.alerts.filter((a) => a.timestamp > cutoffTime);
    }
  }

  /**
   * Get trend analysis for a group
   */
  getTrendAnalysis(groupId: string): TrendAnalysis | undefined {
    return this.predictions.get(groupId);
  }

  /**
   * Get all trend analyses
   */
  getAllTrendAnalyses(): TrendAnalysis[] {
    return Array.from(this.predictions.values());
  }

  /**
   * Get anomalies
   */
  getAnomalies(): TrendAnalysis[] {
    return Array.from(this.predictions.values()).filter((a) => a.isAnomaly);
  }

  /**
   * Get increasing trends
   */
  getIncreasingTrends(): TrendAnalysis[] {
    return Array.from(this.predictions.values()).filter(
      (a) => a.currentTrend === 'increasing' && a.trendStrength > 0.4
    );
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hoursBack: number = 24): PredictionAlert[] {
    const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
    return this.alerts.filter((a) => a.timestamp > cutoffTime);
  }

  /**
   * Get critical alerts
   */
  getCriticalAlerts(): PredictionAlert[] {
    return this.alerts.filter((a) => a.severity === 'critical');
  }

  /**
   * Get alerts requiring action
   */
  getActionRequiredAlerts(): PredictionAlert[] {
    return this.alerts.filter((a) => a.actionRequired);
  }

  /**
   * Get prediction statistics
   */
  getPredictionStatistics(): {
    totalAnalyses: number;
    anomaliesDetected: number;
    increasingTrends: number;
    averageAnomalyScore: number;
    averageConfidence: number;
    criticalAlerts: number;
  } {
    const analyses = this.getAllTrendAnalyses();
    const anomalies = this.getAnomalies();
    const increasing = this.getIncreasingTrends();
    const criticalAlerts = this.getCriticalAlerts();

    const avgAnomalyScore =
      analyses.length > 0
        ? analyses.reduce((sum, a) => sum + a.anomalyScore, 0) /
          analyses.length
        : 0;

    const avgConfidence =
      analyses.length > 0
        ? analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
        : 0;

    return {
      totalAnalyses: analyses.length,
      anomaliesDetected: anomalies.length,
      increasingTrends: increasing.length,
      averageAnomalyScore: Math.round(avgAnomalyScore * 100) / 100,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      criticalAlerts: criticalAlerts.length,
    };
  }

  /**
   * Clear old data
   */
  clearOldData(hoursOld: number = 72): void {
    const cutoffTime = new Date(Date.now() - hoursOld * 60 * 60 * 1000);

    for (const [groupId, data] of this.trendData) {
      const filteredData = data.filter((d) => d.timestamp > cutoffTime);
      if (filteredData.length === 0) {
        this.trendData.delete(groupId);
        this.predictions.delete(groupId);
      } else {
        this.trendData.set(groupId, filteredData);
      }
    }

    this.alerts = this.alerts.filter((a) => a.timestamp > cutoffTime);
  }
}

// Singleton instance
export const errorTrendPredictionService = new ErrorTrendPredictionService();

/**
 * Initialize error trend prediction service
 */
export function initializeErrorTrendPrediction(): void {
  // Clear old data every 6 hours
  setInterval(() => {
    errorTrendPredictionService.clearOldData(72);
  }, 6 * 60 * 60 * 1000);

  console.log('[Error Trend Prediction] Service initialized');
}
