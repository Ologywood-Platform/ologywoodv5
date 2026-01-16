import React, { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, Users, Clock, Filter, X } from 'lucide-react';
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

interface FilterState {
  hoursBack: number;
  severity: string | null;
  endpoint: string | null;
  errorCode: string | null;
  startDate: string | null;
  endDate: string | null;
}

/**
 * Enhanced Error Analytics Dashboard with Filtering
 * Displays error metrics with advanced filtering capabilities
 */
export const ErrorAnalyticsDashboardWithFilters: React.FC = () => {
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    hoursBack: 24,
    severity: null,
    endpoint: null,
    errorCode: null,
    startDate: null,
    endDate: null,
  });

  // Fetch error metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      // This would call an API endpoint to get error metrics
      // For now, we'll show the structure
      // const response = await trpc.analytics.getErrorMetrics.query({ hoursBack: filters.hoursBack });
      // setMetrics(response);
    } catch (error) {
      console.error('Failed to fetch error metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [filters.hoursBack]);

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      hoursBack: 24,
      severity: null,
      endpoint: null,
      errorCode: null,
      startDate: null,
      endDate: null,
    });
  };

  const hasActiveFilters =
    filters.severity ||
    filters.endpoint ||
    filters.errorCode ||
    filters.startDate ||
    filters.endDate;

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
      {/* Header with Filter Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Error Analytics</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <select
                value={filters.hoursBack}
                onChange={(e) =>
                  handleFilterChange('hoursBack', Number(e.target.value))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Last Hour</option>
                <option value={24}>Last 24 Hours</option>
                <option value={72}>Last 3 Days</option>
                <option value={168}>Last Week</option>
              </select>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severity
              </label>
              <select
                value={filters.severity || ''}
                onChange={(e) =>
                  handleFilterChange('severity', e.target.value || null)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Error Code Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Error Code
              </label>
              <input
                type="text"
                value={filters.errorCode || ''}
                onChange={(e) =>
                  handleFilterChange('errorCode', e.target.value || null)
                }
                placeholder="e.g., DATABASE_ERROR"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Endpoint Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endpoint
              </label>
              <input
                type="text"
                value={filters.endpoint || ''}
                onChange={(e) =>
                  handleFilterChange('endpoint', e.target.value || null)
                }
                placeholder="e.g., /api/bookings"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) =>
                  handleFilterChange('startDate', e.target.value || null)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) =>
                  handleFilterChange('endDate', e.target.value || null)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="mt-4 flex justify-end gap-2">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Reset Filters
              </button>
            )}
            <button
              onClick={() => fetchMetrics()}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

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

      {/* Top Errors Table */}
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

      {/* Error Trend Chart */}
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

export default ErrorAnalyticsDashboardWithFilters;
