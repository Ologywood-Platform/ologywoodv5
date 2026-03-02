import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, ArrowUp, ArrowDown } from 'lucide-react';

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  churnRate: number;
  bookingTrend: Array<{ date: string; bookings: number; revenue: number }>;
  userGrowth: Array<{ month: string; artists: number; venues: number }>;
  revenueByTier: Array<{ name: string; value: number }>;
  topArtists: Array<{ name: string; bookings: number; revenue: number }>;
}

const mockData: AnalyticsData = {
  totalBookings: 523,
  totalRevenue: 18750,
  activeUsers: 1247,
  churnRate: 3.2,
  bookingTrend: [
    { date: 'Jan 1', bookings: 12, revenue: 450 },
    { date: 'Jan 8', bookings: 18, revenue: 680 },
    { date: 'Jan 15', bookings: 24, revenue: 920 },
    { date: 'Jan 22', bookings: 31, revenue: 1200 },
    { date: 'Jan 29', bookings: 38, revenue: 1450 },
  ],
  userGrowth: [
    { month: 'Nov', artists: 120, venues: 80 },
    { month: 'Dec', artists: 180, venues: 140 },
    { month: 'Jan', artists: 280, venues: 220 },
    { month: 'Feb', artists: 420, venues: 340 },
  ],
  revenueByTier: [
    { name: 'Free', value: 0 },
    { name: 'Basic', value: 12500 },
    { name: 'Premium', value: 6250 },
  ],
  topArtists: [
    { name: 'DJ Alex', bookings: 18, revenue: 2700 },
    { name: 'The Jazz Trio', bookings: 14, revenue: 2100 },
    { name: 'Sarah\'s Band', bookings: 12, revenue: 1800 },
    { name: 'Electronic Vibes', bookings: 10, revenue: 1500 },
  ],
};

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981'];

export function AdminAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  const metrics = [
    {
      label: 'Total Bookings',
      value: mockData.totalBookings,
      change: 12,
      icon: Calendar,
      color: 'purple',
    },
    {
      label: 'Total Revenue',
      value: `$${mockData.totalRevenue.toLocaleString()}`,
      change: 18,
      icon: DollarSign,
      color: 'green',
    },
    {
      label: 'Active Users',
      value: mockData.activeUsers,
      change: 8,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Churn Rate',
      value: `${mockData.churnRate}%`,
      change: -2,
      icon: TrendingUp,
      color: 'red',
    },
  ];

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600 mt-1">Real-time metrics and insights</p>
        </div>

        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeRange === range
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          const isPositive = metric.change > 0;

          return (
            <div key={idx} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <Icon className={`h-8 w-8 text-${metric.color}-600`} />
                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {isPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {Math.abs(metric.change)}%
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-2">{metric.label}</p>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Booking Trend */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockData.bookingTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="bookings" stroke="#8B5CF6" name="Bookings" />
              <Line type="monotone" dataKey="revenue" stroke="#3B82F6" name="Revenue ($)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Tier */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Subscription Tier</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mockData.revenueByTier}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {mockData.revenueByTier.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* User Growth */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="artists" fill="#8B5CF6" name="Artists" />
              <Bar dataKey="venues" fill="#3B82F6" name="Venues" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Artists */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Artists</h3>
          <div className="space-y-4">
            {mockData.topArtists.map((artist, idx) => (
              <div key={idx} className="flex items-center justify-between pb-4 border-b border-gray-200 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{artist.name}</p>
                  <p className="text-sm text-gray-600">{artist.bookings} bookings</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">${artist.revenue.toLocaleString()}</p>
                  <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                    <div
                      className="h-2 bg-purple-600 rounded-full"
                      style={{ width: `${(artist.bookings / 20) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>

        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <p className="text-gray-600 text-sm mb-2">Average Booking Value</p>
            <p className="text-3xl font-bold text-gray-900">$35.85</p>
            <p className="text-xs text-green-600 mt-1">↑ 5% from last month</p>
          </div>

          <div>
            <p className="text-gray-600 text-sm mb-2">Conversion Rate (Free → Paid)</p>
            <p className="text-3xl font-bold text-gray-900">12.4%</p>
            <p className="text-xs text-green-600 mt-1">↑ 2.1% from last month</p>
          </div>

          <div>
            <p className="text-gray-600 text-sm mb-2">Customer Lifetime Value</p>
            <p className="text-3xl font-bold text-gray-900">$428</p>
            <p className="text-xs text-green-600 mt-1">↑ 8.3% from last month</p>
          </div>
        </div>
      </div>

      {/* Health Status */}
      <div className="bg-green-50 rounded-lg border border-green-200 p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-3">System Health</h3>
        <div className="grid md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-green-700">API Uptime</p>
            <p className="text-2xl font-bold text-green-900">99.9%</p>
          </div>
          <div>
            <p className="text-green-700">Avg Response Time</p>
            <p className="text-2xl font-bold text-green-900">145ms</p>
          </div>
          <div>
            <p className="text-green-700">Payment Success Rate</p>
            <p className="text-2xl font-bold text-green-900">99.7%</p>
          </div>
          <div>
            <p className="text-green-700">Support Tickets</p>
            <p className="text-2xl font-bold text-green-900">12</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAnalyticsDashboard;
