import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Share2, Mail } from 'lucide-react';

interface AnalyticsData {
  totalEvents: number;
  socialClicks: number;
  newsletterSignups: number;
  legalPageVisits: number;
  contactClicks: number;
  socialBreakdown: {
    facebook: number;
    twitter: number;
    instagram: number;
    linkedin: number;
    youtube: number;
  };
}

const FooterAnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch analytics data
    const fetchAnalytics = async () => {
      try {
        // In production, this would call the actual API
        // const response = await fetch(`/api/footer-analytics?days=${timeRange}`);
        // const data = await response.json();
        
        // Mock data for demonstration
        setAnalyticsData({
          totalEvents: 1250,
          socialClicks: 450,
          newsletterSignups: 280,
          legalPageVisits: 320,
          contactClicks: 200,
          socialBreakdown: {
            facebook: 150,
            twitter: 120,
            instagram: 95,
            linkedin: 65,
            youtube: 20,
          },
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  if (loading || !analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const socialData = [
    { name: 'Facebook', value: analyticsData.socialBreakdown.facebook },
    { name: 'Twitter', value: analyticsData.socialBreakdown.twitter },
    { name: 'Instagram', value: analyticsData.socialBreakdown.instagram },
    { name: 'LinkedIn', value: analyticsData.socialBreakdown.linkedin },
    { name: 'YouTube', value: analyticsData.socialBreakdown.youtube },
  ];

  const eventData = [
    { name: 'Social Clicks', value: analyticsData.socialClicks },
    { name: 'Newsletter', value: analyticsData.newsletterSignups },
    { name: 'Legal Pages', value: analyticsData.legalPageVisits },
    { name: 'Contact', value: analyticsData.contactClicks },
  ];

  const COLORS = ['#3B82F6', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Footer Analytics</h1>
          <p className="text-gray-600 mt-2">Track engagement with footer links and features</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Time Range Selector */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('7')}
              className={`px-4 py-2 rounded ${timeRange === '7' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeRange('30')}
              className={`px-4 py-2 rounded ${timeRange === '30' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeRange('90')}
              className={`px-4 py-2 rounded ${timeRange === '90' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            >
              Last 90 Days
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Events</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.totalEvents}</p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Social Clicks</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.socialClicks}</p>
              </div>
              <Share2 className="text-pink-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Newsletter Signups</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.newsletterSignups}</p>
              </div>
              <Mail className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Contact Clicks</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.contactClicks}</p>
              </div>
              <Users className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Social Media Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media Breakdown</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={socialData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {socialData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Event Type Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={eventData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Stats */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detailed Statistics</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold">Metric</th>
                  <th className="text-right py-3 px-4 font-semibold">Count</th>
                  <th className="text-right py-3 px-4 font-semibold">Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">Social Media Clicks</td>
                  <td className="text-right py-3 px-4">{analyticsData.socialClicks}</td>
                  <td className="text-right py-3 px-4">{((analyticsData.socialClicks / analyticsData.totalEvents) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">Newsletter Signups</td>
                  <td className="text-right py-3 px-4">{analyticsData.newsletterSignups}</td>
                  <td className="text-right py-3 px-4">{((analyticsData.newsletterSignups / analyticsData.totalEvents) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">Legal Page Visits</td>
                  <td className="text-right py-3 px-4">{analyticsData.legalPageVisits}</td>
                  <td className="text-right py-3 px-4">{((analyticsData.legalPageVisits / analyticsData.totalEvents) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="py-3 px-4">Contact Clicks</td>
                  <td className="text-right py-3 px-4">{analyticsData.contactClicks}</td>
                  <td className="text-right py-3 px-4">{((analyticsData.contactClicks / analyticsData.totalEvents) * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterAnalyticsDashboard;
