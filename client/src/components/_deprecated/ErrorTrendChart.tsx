import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface TrendAnalysis {
  groupId: string;
  currentTrend: 'increasing' | 'decreasing' | 'stable';
  trendStrength: number;
  anomalyScore: number;
  isAnomaly: boolean;
  predictedCount: number;
  actualCount: number;
  variance: number;
  confidence: number;
  recommendation: string;
}

interface PredictionAlert {
  groupId: string;
  severity: 'warning' | 'critical';
  message: string;
  predictedSpike: number;
  currentRate: number;
  confidence: number;
  timestamp: Date;
  actionRequired: boolean;
}

interface ErrorTrendChartProps {
  trends?: TrendAnalysis[];
  alerts?: PredictionAlert[];
  loading?: boolean;
}

/**
 * Error Trend Chart Component
 * Displays error trends, predictions, and anomalies
 */
export const ErrorTrendChart: React.FC<ErrorTrendChartProps> = ({
  trends = [],
  alerts = [],
  loading = false,
}) => {
  const [selectedTrend, setSelectedTrend] = useState<TrendAnalysis | null>(
    null
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      case 'decreasing':
        return <TrendingUp className="w-4 h-4 text-green-600 transform rotate-180" />;
      default:
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600';
      case 'decreasing':
        return 'text-green-600';
      default:
        return 'text-blue-600';
    }
  };

  const getAnomalyBadge = (isAnomaly: boolean, anomalyScore: number) => {
    if (!isAnomaly) return null;

    if (anomalyScore > 0.8) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          <AlertTriangle className="w-3 h-3" />
          Critical
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
        <AlertCircle className="w-3 h-3" />
        Anomaly
      </span>
    );
  };

  const criticalAlerts = alerts.filter((a) => a.severity === 'critical');
  const warningAlerts = alerts.filter((a) => a.severity === 'warning');

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
          <p className="text-sm text-gray-500">Critical Alerts</p>
          <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
          <p className="text-xs text-gray-600 mt-1">Requires immediate action</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-500">
          <p className="text-sm text-gray-500">Warning Alerts</p>
          <p className="text-2xl font-bold text-yellow-600">{warningAlerts.length}</p>
          <p className="text-xs text-gray-600 mt-1">Monitor closely</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">Monitored Trends</p>
          <p className="text-2xl font-bold text-blue-600">{trends.length}</p>
          <p className="text-xs text-gray-600 mt-1">Error groups analyzed</p>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-semibold text-red-900 mb-3">Critical Alerts</h3>
          <div className="space-y-2">
            {criticalAlerts.map((alert, idx) => (
              <div
                key={idx}
                className="bg-white rounded p-3 border border-red-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{alert.message}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Current rate: {alert.currentRate} errors/min → Predicted:{' '}
                      {alert.predictedSpike} errors/min
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Confidence: {(alert.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trend Analysis */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Error Trends</h3>
        {trends.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-4" />
            <p className="text-gray-600">No trends detected</p>
          </div>
        ) : (
          trends.map((trend) => (
            <div
              key={trend.groupId}
              onClick={() => setSelectedTrend(trend)}
              className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getTrendIcon(trend.currentTrend)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">
                        {trend.groupId}
                      </h4>
                      {getAnomalyBadge(trend.isAnomaly, trend.anomalyScore)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {trend.recommendation}
                    </p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="text-right ml-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Current</p>
                      <p className="text-lg font-bold text-gray-900">
                        {trend.actualCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Predicted</p>
                      <p className={`text-lg font-bold ${getTrendColor(trend.currentTrend)}`}>
                        {trend.predictedCount}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Confidence</p>
                      <p className="text-lg font-bold text-gray-900">
                        {(trend.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trend Strength Bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600">Trend Strength</span>
                  <span className="text-xs font-medium text-gray-900">
                    {(trend.trendStrength * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      trend.currentTrend === 'increasing'
                        ? 'bg-red-500'
                        : trend.currentTrend === 'decreasing'
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${trend.trendStrength * 100}%` }}
                  />
                </div>
              </div>

              {/* Anomaly Score Bar */}
              {trend.isAnomaly && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Anomaly Score</span>
                    <span className="text-xs font-medium text-red-600">
                      {(trend.anomalyScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-red-500 transition-all"
                      style={{ width: `${trend.anomalyScore * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Selected Trend Details */}
      {selectedTrend && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">Trend Details</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-blue-600">Trend Direction</p>
              <p className="font-semibold text-gray-900 capitalize">
                {selectedTrend.currentTrend}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Variance</p>
              <p className="font-semibold text-gray-900">
                {selectedTrend.variance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Confidence</p>
              <p className="font-semibold text-gray-900">
                {(selectedTrend.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Anomaly Score</p>
              <p className="font-semibold text-gray-900">
                {(selectedTrend.anomalyScore * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-700 mt-3">
            {selectedTrend.recommendation}
          </p>
        </div>
      )}
    </div>
  );
};

export default ErrorTrendChart;
