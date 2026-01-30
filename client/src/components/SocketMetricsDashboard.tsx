/**
 * Socket.io Metrics Dashboard
 * Real-time monitoring of Socket.io connections and performance metrics
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, AlertCircle, CheckCircle2, Users, Zap } from 'lucide-react';

export interface SocketMetrics {
  totalConnections: number;
  activeConnections: number;
  disconnectedConnections: number;
  messagesSent: number;
  messagesReceived: number;
  notificationsSent: number;
  averageLatency: number;
  peakConnections: number;
  timestamp: Date;
}

interface MetricsHistory {
  timestamp: string;
  activeConnections: number;
  messagesSent: number;
  notificationsSent: number;
  averageLatency: number;
}

export function SocketMetricsDashboard() {
  const [metrics, setMetrics] = useState<SocketMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<MetricsHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch Socket.io metrics
  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/socket/metrics');

      if (!response.ok) {
        throw new Error('Failed to fetch Socket.io metrics');
      }

      const data = await response.json();
      setMetrics(data.metrics);
      setError(null);

      // Add to history
      setMetricsHistory(prev => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          activeConnections: data.metrics.activeConnections,
          messagesSent: data.metrics.messagesSent,
          notificationsSent: data.metrics.notificationsSent,
          averageLatency: data.metrics.averageLatency,
        },
      ].slice(-20)); // Keep last 20 entries
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('[SocketMetricsDashboard] Error fetching metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh) return;

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading Socket.io metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Error Loading Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error}</p>
          <button
            onClick={fetchMetrics}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Socket.io Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No metrics available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Socket.io Metrics Dashboard</h2>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring of Socket.io connections and performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>
          <button
            onClick={fetchMetrics}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Connections */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Active Connections
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeConnections}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Peak: {metrics.peakConnections}
            </p>
          </CardContent>
        </Card>

        {/* Messages Sent */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-green-500" />
              Messages Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.messagesSent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Received: {metrics.messagesReceived}
            </p>
          </CardContent>
        </Card>

        {/* Notifications Sent */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
              Notifications Sent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.notificationsSent}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total connections: {metrics.totalConnections}
            </p>
          </CardContent>
        </Card>

        {/* Average Latency */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              Avg Latency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageLatency.toFixed(2)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.averageLatency < 50 ? 'Excellent' : metrics.averageLatency < 100 ? 'Good' : 'Fair'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Connections Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Active Connections Over Time</CardTitle>
            <CardDescription>Last 20 measurements</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activeConnections"
                    stroke="#3b82f6"
                    name="Active Connections"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No history data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Messages & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Messages & Notifications</CardTitle>
            <CardDescription>Activity metrics over time</CardDescription>
          </CardHeader>
          <CardContent>
            {metricsHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="messagesSent" fill="#10b981" name="Messages Sent" />
                  <Bar dataKey="notificationsSent" fill="#8b5cf6" name="Notifications Sent" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No history data yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Latency Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Average Latency Over Time</CardTitle>
          <CardDescription>Message latency in milliseconds</CardDescription>
        </CardHeader>
        <CardContent>
          {metricsHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metricsHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(2)}ms`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="averageLatency"
                  stroke="#f97316"
                  name="Average Latency (ms)"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">No history data yet</p>
          )}
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Connections</p>
              <p className="text-2xl font-bold">{metrics.totalConnections}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-2xl font-bold text-green-600">{metrics.activeConnections}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Disconnected</p>
              <p className="text-2xl font-bold text-red-600">{metrics.disconnectedConnections}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Peak Connections</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.peakConnections}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Messages Received</p>
              <p className="text-2xl font-bold">{metrics.messagesReceived}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Updated</p>
              <p className="text-sm font-mono">{new Date(metrics.timestamp).toLocaleTimeString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
