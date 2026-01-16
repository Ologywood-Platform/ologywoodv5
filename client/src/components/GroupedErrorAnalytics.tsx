import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Users,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ErrorGroup {
  groupId: string;
  name: string;
  errorCodes: string[];
  pattern: string;
  count: number;
  affectedUsers: number;
  severity: string;
  endpoints: string[];
  lastOccurred: Date;
  firstOccurred: Date;
  examples: Array<{
    code: string;
    message: string;
    timestamp: Date;
  }>;
}

interface GroupedErrorAnalyticsProps {
  groups?: ErrorGroup[];
  loading?: boolean;
}

/**
 * Grouped Error Analytics Component
 * Displays deduplicated and grouped errors with pattern analysis
 */
export const GroupedErrorAnalytics: React.FC<GroupedErrorAnalyticsProps> = ({
  groups = [],
  loading = false,
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filterSeverity, setFilterSeverity] = useState<string | null>(null);

  const toggleGroupExpanded = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const filteredGroups = filterSeverity
    ? groups.filter((g) => g.severity === filterSeverity)
    : groups;

  const severityStats = {
    critical: groups.filter((g) => g.severity === 'critical').length,
    high: groups.filter((g) => g.severity === 'high').length,
    medium: groups.filter((g) => g.severity === 'medium').length,
    low: groups.filter((g) => g.severity === 'low').length,
  };

  const totalErrors = groups.reduce((sum, g) => sum + g.count, 0);
  const totalAffectedUsers = groups.reduce((sum, g) => sum + g.affectedUsers, 0);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin">
          <Layers className="w-8 h-8 text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Error Groups</p>
          <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Errors</p>
          <p className="text-2xl font-bold text-gray-900">{totalErrors}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Affected Users</p>
          <p className="text-2xl font-bold text-gray-900">{totalAffectedUsers}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Dedup. Ratio</p>
          <p className="text-2xl font-bold text-gray-900">
            {groups.length > 0 ? ((totalErrors / groups.length) * 100).toFixed(0) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Avg. Group Size</p>
          <p className="text-2xl font-bold text-gray-900">
            {groups.length > 0 ? (totalErrors / groups.length).toFixed(1) : 0}
          </p>
        </div>
      </div>

      {/* Severity Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterSeverity(null)}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterSeverity === null
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All ({groups.length})
        </button>
        <button
          onClick={() => setFilterSeverity('critical')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterSeverity === 'critical'
              ? 'bg-red-600 text-white'
              : 'bg-white border border-red-300 text-red-700 hover:bg-red-50'
          }`}
        >
          Critical ({severityStats.critical})
        </button>
        <button
          onClick={() => setFilterSeverity('high')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterSeverity === 'high'
              ? 'bg-orange-600 text-white'
              : 'bg-white border border-orange-300 text-orange-700 hover:bg-orange-50'
          }`}
        >
          High ({severityStats.high})
        </button>
        <button
          onClick={() => setFilterSeverity('medium')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterSeverity === 'medium'
              ? 'bg-yellow-600 text-white'
              : 'bg-white border border-yellow-300 text-yellow-700 hover:bg-yellow-50'
          }`}
        >
          Medium ({severityStats.medium})
        </button>
        <button
          onClick={() => setFilterSeverity('low')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterSeverity === 'low'
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-blue-300 text-blue-700 hover:bg-blue-50'
          }`}
        >
          Low ({severityStats.low})
        </button>
      </div>

      {/* Error Groups List */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No error groups found</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.groupId}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Group Header */}
              <button
                onClick={() => toggleGroupExpanded(group.groupId)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  {getSeverityIcon(group.severity)}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {group.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {group.errorCodes.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {group.count}
                      </p>
                      <p className="text-xs text-gray-500">occurrences</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {group.affectedUsers}
                      </p>
                      <p className="text-xs text-gray-500">users</p>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium border ${getSeverityColor(
                        group.severity
                      )}`}
                    >
                      {group.severity}
                    </div>
                  </div>
                </div>
                {expandedGroups.has(group.groupId) ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {/* Group Details */}
              {expandedGroups.has(group.groupId) && (
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 space-y-4">
                  {/* Endpoints */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Affected Endpoints
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {group.endpoints.map((endpoint) => (
                        <span
                          key={endpoint}
                          className="px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-700"
                        >
                          {endpoint}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Timeline
                    </h4>
                    <p className="text-sm text-gray-600">
                      First occurred:{' '}
                      {new Date(group.firstOccurred).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Last occurred:{' '}
                      {new Date(group.lastOccurred).toLocaleString()}
                    </p>
                  </div>

                  {/* Examples */}
                  {group.examples.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">
                        Recent Examples
                      </h4>
                      <div className="space-y-2">
                        {group.examples.map((example, idx) => (
                          <div
                            key={idx}
                            className="p-2 bg-white border border-gray-300 rounded text-xs"
                          >
                            <p className="font-mono text-gray-900">
                              {example.code}
                            </p>
                            <p className="text-gray-600 truncate">
                              {example.message}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {new Date(example.timestamp).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pattern */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                      Error Pattern
                    </h4>
                    <code className="block p-2 bg-white border border-gray-300 rounded text-xs text-gray-700 overflow-auto max-h-24">
                      {group.pattern}
                    </code>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupedErrorAnalytics;
