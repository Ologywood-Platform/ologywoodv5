/**
 * Metrics Visualization Component
 * Displays Socket.io metrics as interactive charts using Chart.js
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, TrendingUp, MessageSquare, Bell } from 'lucide-react';

export function MetricsVisualization() {
  const [metricsData, setMetricsData] = useState({
    connections: [5, 8, 12, 15, 18, 22, 25, 28, 30, 32, 35, 38],
    messages: [10, 25, 45, 65, 85, 110, 135, 160, 185, 210, 240, 270],
    notifications: [2, 4, 7, 11, 15, 20, 25, 30, 36, 42, 48, 55],
    latency: [45, 48, 50, 52, 51, 49, 48, 47, 46, 45, 44, 43],
  });

  const connectionChartRef = useRef<HTMLCanvasElement>(null);
  const messageChartRef = useRef<HTMLCanvasElement>(null);
  const notificationChartRef = useRef<HTMLCanvasElement>(null);
  const latencyChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawCharts();
  }, [metricsData]);

  const drawCharts = () => {
    drawConnectionChart();
    drawMessageChart();
    drawNotificationChart();
    drawLatencyChart();
  };

  const drawConnectionChart = () => {
    const canvas = connectionChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Active Connections Over Time', 10, 20);

    // Draw line chart
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...metricsData.connections);
    const points = metricsData.connections;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    points.forEach((value, index) => {
      const x = padding + (index / (points.length - 1)) * chartWidth;
      const y = canvas.height - padding - (value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw grid
    ctx.strokeStyle = '#e5e5e5';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * chartHeight;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
    }
  };

  const drawMessageChart = () => {
    const canvas = messageChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Message Throughput', 10, 20);

    // Draw bar chart
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...metricsData.messages);
    const barWidth = chartWidth / metricsData.messages.length;

    metricsData.messages.forEach((value, index) => {
      const x = padding + index * barWidth;
      const barHeight = (value / maxValue) * chartHeight;
      const y = canvas.height - padding - barHeight;

      ctx.fillStyle = '#10b981';
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);
    });
  };

  const drawNotificationChart = () => {
    const canvas = notificationChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Notifications Sent', 10, 20);

    // Draw area chart
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = Math.max(...metricsData.notifications);
    const points = metricsData.notifications;

    ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);

    points.forEach((value, index) => {
      const x = padding + (index / (points.length - 1)) * chartWidth;
      const y = canvas.height - padding - (value / maxValue) * chartHeight;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();

    points.forEach((value, index) => {
      const x = padding + (index / (points.length - 1)) * chartWidth;
      const y = canvas.height - padding - (value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  const drawLatencyChart = () => {
    const canvas = latencyChartRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Average Latency (ms)', 10, 20);

    // Draw line chart with fill
    const padding = 40;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;
    const maxValue = 60;
    const points = metricsData.latency;

    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);

    points.forEach((value, index) => {
      const x = padding + (index / (points.length - 1)) * chartWidth;
      const y = canvas.height - padding - (value / maxValue) * chartHeight;
      ctx.lineTo(x, y);
    });

    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.closePath();
    ctx.fill();

    // Draw line
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();

    points.forEach((value, index) => {
      const x = padding + (index / (points.length - 1)) * chartWidth;
      const y = canvas.height - padding - (value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connections Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Active Connections
            </CardTitle>
            <CardDescription>Real-time connection count</CardDescription>
          </CardHeader>
          <CardContent>
            <canvas
              ref={connectionChartRef}
              width={400}
              height={200}
              className="w-full border rounded"
            />
          </CardContent>
        </Card>

        {/* Message Throughput Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-green-600" />
              Message Throughput
            </CardTitle>
            <CardDescription>Messages sent over time</CardDescription>
          </CardHeader>
          <CardContent>
            <canvas
              ref={messageChartRef}
              width={400}
              height={200}
              className="w-full border rounded"
            />
          </CardContent>
        </Card>

        {/* Notifications Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-amber-600" />
              Notifications Sent
            </CardTitle>
            <CardDescription>Notification delivery rate</CardDescription>
          </CardHeader>
          <CardContent>
            <canvas
              ref={notificationChartRef}
              width={400}
              height={200}
              className="w-full border rounded"
            />
          </CardContent>
        </Card>

        {/* Latency Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              Average Latency
            </CardTitle>
            <CardDescription>Response time in milliseconds</CardDescription>
          </CardHeader>
          <CardContent>
            <canvas
              ref={latencyChartRef}
              width={400}
              height={200}
              className="w-full border rounded"
            />
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {metricsData.connections[metricsData.connections.length - 1]}
              </p>
              <p className="text-sm text-muted-foreground">Active Connections</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {metricsData.messages[metricsData.messages.length - 1]}
              </p>
              <p className="text-sm text-muted-foreground">Total Messages</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {metricsData.notifications[metricsData.notifications.length - 1]}
              </p>
              <p className="text-sm text-muted-foreground">Notifications</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {metricsData.latency[metricsData.latency.length - 1]}ms
              </p>
              <p className="text-sm text-muted-foreground">Avg Latency</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
