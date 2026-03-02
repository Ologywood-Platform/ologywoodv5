import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface RiderAnalytics {
  acceptanceStats: {
    total: number;
    acknowledged: number;
    modificationsProposed: number;
    accepted: number;
    rejected: number;
    pending: number;
    acceptanceRate: string | number;
  };
  commonModifications: Array<{
    field: string;
    count: number;
    topReasons: string[];
  }>;
  negotiationMetrics: {
    averageTimeToAcknowledge: number;
    averageTimeToResolve: number;
    averageModificationsPerRider: number;
    totalNegotiations: number;
  };
  timeline: Array<{
    date: string;
    total: number;
    accepted: number;
    rejected: number;
    pending: number;
    acceptanceRate: string | number;
  }>;
  popularity: Array<{
    templateId: number;
    templateName: string;
    bookingsCount: number;
    acknowledgementsCount: number;
    acceptanceRate: string | number;
  }>;
}

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe'];

export function RiderAnalyticsDashboard({ artistId }: { artistId: number }) {
  const [analytics, setAnalytics] = useState<RiderAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // In a real implementation, fetch from TRPC endpoints
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [artistId]);

  if (loading) {
    return <div className="p-6 text-center">Loading analytics...</div>;
  }

  if (!analytics) {
    return <div className="p-6 text-center text-gray-500">No analytics data available</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-2">Total Riders Shared</div>
          <div className="text-3xl font-bold text-purple-600">{analytics.acceptanceStats.total}</div>
          <div className="text-xs text-gray-500 mt-2">Across all bookings</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-2">Acceptance Rate</div>
          <div className="text-3xl font-bold text-green-600">{analytics.acceptanceStats.acceptanceRate}%</div>
          <div className="text-xs text-gray-500 mt-2">Acknowledged or Accepted</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-2">Avg. Time to Acknowledge</div>
          <div className="text-3xl font-bold text-blue-600">{analytics.negotiationMetrics.averageTimeToAcknowledge}h</div>
          <div className="text-xs text-gray-500 mt-2">Hours</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-600 mb-2">Avg. Modifications</div>
          <div className="text-3xl font-bold text-orange-600">{analytics.negotiationMetrics.averageModificationsPerRider}</div>
          <div className="text-xs text-gray-500 mt-2">Per rider</div>
        </div>
      </div>

      {/* Acceptance Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Rider Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Acknowledged', value: analytics.acceptanceStats.acknowledged },
                  { name: 'Accepted', value: analytics.acceptanceStats.accepted },
                  { name: 'Modifications Proposed', value: analytics.acceptanceStats.modificationsProposed },
                  { name: 'Rejected', value: analytics.acceptanceStats.rejected },
                  { name: 'Pending', value: analytics.acceptanceStats.pending },
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {COLORS.map((color, index) => (
                  <Cell key={`cell-${index}`} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Acceptance Trend (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="accepted" stroke="#667eea" />
              <Line type="monotone" dataKey="rejected" stroke="#f093fb" />
              <Line type="monotone" dataKey="pending" stroke="#fbbf24" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Common Modification Requests */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Most Frequently Modified Fields</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.commonModifications}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="field" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#667eea" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {analytics.commonModifications.map((mod, idx) => (
            <div key={idx} className="text-sm">
              <strong>{mod.field}</strong> - {mod.count} modifications
              {mod.topReasons.length > 0 && (
                <div className="text-xs text-gray-600 ml-2">
                  Top reasons: {mod.topReasons.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Rider Template Performance */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Rider Template Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Template Name</th>
                <th className="px-4 py-2 text-center">Bookings</th>
                <th className="px-4 py-2 text-center">Acknowledgments</th>
                <th className="px-4 py-2 text-center">Acceptance Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.popularity.map((template) => (
                <tr key={template.templateId} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{template.templateName}</td>
                  <td className="px-4 py-2 text-center">{template.bookingsCount}</td>
                  <td className="px-4 py-2 text-center">{template.acknowledgementsCount}</td>
                  <td className="px-4 py-2 text-center">
                    <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                      {template.acceptanceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Negotiation Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold mb-4 text-purple-900">Negotiation Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Average Negotiation Timeline</p>
            <p className="text-2xl font-bold text-purple-600">
              {analytics.negotiationMetrics.averageTimeToResolve} hours
            </p>
            <p className="text-xs text-gray-500">From creation to finalization</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">Total Active Negotiations</p>
            <p className="text-2xl font-bold text-purple-600">
              {analytics.negotiationMetrics.totalNegotiations}
            </p>
            <p className="text-xs text-gray-500">Across all rider templates</p>
          </div>
        </div>
      </div>
    </div>
  );
}
