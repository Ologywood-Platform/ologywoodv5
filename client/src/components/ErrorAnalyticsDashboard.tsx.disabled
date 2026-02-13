import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Users, Clock } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface ErrorMetrics {
  totalErrors: number;
  uniqueErrors: number;
  errorsByCode: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  topErrors: Array<{
    code: string;
    count: number;
    lastOccurred: Date;
    affectedUsers: number;
  }>;
  errorTrend: Array<{
    timestamp: Date;
    count: number;
  }>;
}

/**
 * Error Analytics Dashboard Component
 * Displays error metrics and trends for monitoring
 */
export const ErrorAnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoursBack, setHoursBack] = useState(24);

  // Fetch error metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // This would call an API endpoint to get error metrics
      // For now, we'll show the structure
      // const response = await trpc.analytics.getErrorMetrics.query({ hoursBack });
      // setMetrics(response);
    } catch (error) {
      console.error('Failed to fetch error metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [hoursBack]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <AlertTriangle className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No error data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Error Analytics</h2>
        <select
          value={hoursBack}
          onChange={(e) => setHoursBack(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
        >
          <option value={1}>Last Hour</option>
          <option value={24}>Last 24 Hours</option>
          <option value={72}>Last 3 Days</option>
          <option value={168}>Last Week</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Errors */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.totalErrors}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Unique Errors */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Unique Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.uniqueErrors}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        {/* Critical Errors */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Critical Errors</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.errorsBySeverity['critical'] || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>

        {/* Affected Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Affected Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.topErrors.reduce((sum, e) => sum + e.affectedUsers, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Top Errors */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Top Errors</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Error Code
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Affected Users
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Last Occurred
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.topErrors.map((error) => (
                <tr key={error.code} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-mono text-gray-900">
                    {error.code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {error.count}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {error.affectedUsers}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(error.lastOccurred).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Errors by Severity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Severity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Errors by Severity
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.errorsBySeverity).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{severity}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        severity === 'critical'
                          ? 'bg-red-500'
                          : severity === 'high'
                          ? 'bg-orange-500'
                          : severity === 'medium'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{
                        width: `${
                          (count / metrics.totalErrors) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Endpoint */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Errors by Endpoint
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.errorsByEndpoint)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([endpoint, count]) => (
                <div key={endpoint} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate">
                    {endpoint}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {count}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Error Trend */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Error Trend
        </h3>
        <div className="h-64 flex items-end gap-1">
          {metrics.errorTrend.map((point, index) => {
            const maxCount = Math.max(
              ...metrics.errorTrend.map((p) => p.count)
            );
            const height = (point.count / maxCount) * 100;

            return (
              <div
                key={index}
                className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer group relative"
                style={{ height: `${height}%`, minHeight: '4px' }}
                title={`${point.count} errors at ${new Date(
                  point.timestamp
                ).toLocaleString()}`}
              >
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {point.count}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ErrorAnalyticsDashboard;
