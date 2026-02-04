import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Calendar, DollarSign, Users } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

export const ArtistAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalEarnings: 0,
    averageRating: 0,
    completionRate: 0,
  });

  const [chartData, setChartData] = useState({
    bookingTrends: [],
    earningsByVenueType: [],
    seasonalTrends: [],
    topVenues: [],
  });

  useEffect(() => {
    fetchArtistAnalytics();
  }, [user?.id]);

  const fetchArtistAnalytics = async () => {
    try {
      // Mock data - replace with actual API calls
      setStats({
        totalBookings: 24,
        totalEarnings: 8500,
        averageRating: 4.8,
        completionRate: 95,
      });

      setChartData({
        bookingTrends: [
          { month: 'Jan', bookings: 2, earnings: 800 },
          { month: 'Feb', bookings: 3, earnings: 1200 },
          { month: 'Mar', bookings: 2, earnings: 900 },
          { month: 'Apr', bookings: 4, earnings: 1600 },
          { month: 'May', bookings: 5, earnings: 2100 },
          { month: 'Jun', bookings: 8, earnings: 3200 },
        ],
        earningsByVenueType: [
          { name: 'Club', value: 3200, fill: '#3b82f6' },
          { name: 'Theater', value: 2800, fill: '#8b5cf6' },
          { name: 'Lounge', value: 1500, fill: '#ec4899' },
          { name: 'Outdoor', value: 1000, fill: '#f59e0b' },
        ],
        seasonalTrends: [
          { season: 'Winter', bookings: 5, earnings: 2000 },
          { season: 'Spring', bookings: 6, earnings: 2400 },
          { season: 'Summer', bookings: 8, earnings: 3200 },
          { season: 'Fall', bookings: 5, earnings: 900 },
        ],
        topVenues: [
          { name: 'The Blue Room', bookings: 5, earnings: 2000, rating: 5 },
          { name: 'Jazz Club Downtown', bookings: 4, earnings: 1600, rating: 4.9 },
          { name: 'Grand Theater', bookings: 3, earnings: 1200, rating: 4.8 },
          { name: 'Rooftop Lounge', bookings: 3, earnings: 1200, rating: 4.7 },
          { name: 'Concert Hall', bookings: 2, earnings: 800, rating: 4.6 },
        ],
      });
    } catch (error) {
      console.error('Error fetching artist analytics:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Analytics</h1>
          <p className="text-gray-600 mt-2">Track your bookings, earnings, and performance metrics</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Earnings</p>
                <p className="text-3xl font-bold text-gray-900">${stats.totalEarnings}</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">{stats.averageRating}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.completionRate}%</p>
              </div>
              <Users className="w-12 h-12 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Booking Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Booking Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.bookingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="bookings" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Earnings by Venue Type */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Earnings by Venue Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={chartData.earningsByVenueType} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: $${value}`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {chartData.earningsByVenueType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Seasonal Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.seasonalTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="season" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bookings" fill="#3b82f6" />
                <Bar dataKey="earnings" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Venues */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Venues</h2>
            <div className="space-y-4">
              {chartData.topVenues.map((venue, index) => (
                <div key={index} className="flex items-center justify-between pb-4 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{venue.name}</p>
                    <p className="text-sm text-gray-600">{venue.bookings} bookings • Rating: {venue.rating}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">${venue.earnings}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Peak Season</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">Summer</p>
              <p className="text-xs text-gray-600 mt-2">Highest bookings and earnings</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Best Performing Venue Type</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">Club</p>
              <p className="text-xs text-gray-600 mt-2">$3,200 in earnings</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Recommendation</p>
              <p className="text-lg font-semibold text-gray-900 mt-1">Focus on Summer</p>
              <p className="text-xs text-gray-600 mt-2">Book more events during peak season</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistAnalyticsDashboard;
