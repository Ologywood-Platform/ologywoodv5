import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Users, Calendar, Star, TrendingDown } from 'lucide-react';

const EventAnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30');
  const [analyticsData, setAnalyticsData] = useState({
    totalBookings: 24,
    totalEarnings: 8500,
    averageRating: 4.8,
    conversionRate: 0.35,
    bookingTrends: [
      { month: 'Jan', bookings: 4, revenue: 1200 },
      { month: 'Feb', bookings: 6, revenue: 1800 },
      { month: 'Mar', bookings: 8, revenue: 2400 },
      { month: 'Apr', bookings: 6, revenue: 1800 },
    ],
    venueBreakdown: [
      { name: 'Clubs', value: 12, revenue: 3600 },
      { name: 'Theaters', value: 6, revenue: 2400 },
      { name: 'Lounges', value: 4, revenue: 1600 },
      { name: 'Outdoor', value: 2, revenue: 900 },
    ],
    peakBookingTimes: [
      { day: 'Mon', bookings: 2 },
      { day: 'Tue', bookings: 1 },
      { day: 'Wed', bookings: 3 },
      { day: 'Thu', bookings: 4 },
      { day: 'Fri', bookings: 6 },
      { day: 'Sat', bookings: 5 },
      { day: 'Sun', bookings: 3 },
    ],
    recentBookings: [
      { id: 1, venue: 'The Blue Room', date: '2024-02-10', amount: 500, rating: 5 },
      { id: 2, venue: 'Jazz Lounge', date: '2024-02-08', amount: 400, rating: 4.5 },
      { id: 3, venue: 'Downtown Theater', date: '2024-02-05', amount: 750, rating: 5 },
      { id: 4, venue: 'Sunset Club', date: '2024-02-01', amount: 350, rating: 4 },
    ],
  });

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

  const StatCard = ({ icon: Icon, label, value, change, positive }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          <p className={`text-sm mt-2 flex items-center ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {change}% from last period
          </p>
        </div>
        <div className="bg-blue-100 rounded-full p-3">
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Event Analytics</h1>
          <p className="text-gray-600 mt-2">Track your booking performance and earnings</p>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 flex gap-4">
          {['7', '30', '90', '365'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
            >
              {range === '7' ? '7 Days' : range === '30' ? '30 Days' : range === '90' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={Calendar}
            label="Total Bookings"
            value={analyticsData.totalBookings}
            change={12}
            positive={true}
          />
          <StatCard
            icon={DollarSign}
            label="Total Earnings"
            value={`$${analyticsData.totalEarnings.toLocaleString()}`}
            change={18}
            positive={true}
          />
          <StatCard
            icon={Star}
            label="Average Rating"
            value={analyticsData.averageRating}
            change={5}
            positive={true}
          />
          <StatCard
            icon={Users}
            label="Conversion Rate"
            value={`${(analyticsData.conversionRate * 100).toFixed(1)}%`}
            change={8}
            positive={true}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Booking Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Booking Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="bookings" stroke="#3b82f6" name="Bookings" />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Venue Type Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue by Venue Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.venueBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {analyticsData.venueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Peak Booking Times */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Peak Booking Days</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.peakBookingTimes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#3b82f6" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Bookings</h2>
            <div className="space-y-4">
              {analyticsData.recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{booking.venue}</p>
                    <p className="text-sm text-gray-600">{booking.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">${booking.amount}</p>
                    <p className="text-sm text-yellow-600">★ {booking.rating}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Key Insights</h2>
          <ul className="space-y-2 text-gray-700">
            <li>• Friday and Saturday are your peak booking days - consider offering special rates for weekday bookings</li>
            <li>• Clubs generate 50% of your revenue - focus marketing efforts on venues in this category</li>
            <li>• Your average rating is 4.8/5 - maintain this quality to attract more bookings</li>
            <li>• Conversion rate of 35% is above industry average - continue your current marketing strategy</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EventAnalyticsDashboard;
