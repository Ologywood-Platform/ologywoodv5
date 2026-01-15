import React, { useMemo } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Clock, CheckCircle, AlertCircle, Users } from "lucide-react";

interface TicketMetrics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  satisfactionScore: number;
}

// Mock data for demonstration
const mockTicketData = [
  { date: "Mon", tickets: 12, resolved: 8 },
  { date: "Tue", tickets: 19, resolved: 15 },
  { date: "Wed", tickets: 15, resolved: 12 },
  { date: "Thu", tickets: 22, resolved: 18 },
  { date: "Fri", tickets: 25, resolved: 20 },
  { date: "Sat", tickets: 18, resolved: 16 },
  { date: "Sun", tickets: 14, resolved: 12 },
];

const mockCategoryData = [
  { name: "Booking Issues", value: 35, color: "#8b5cf6" },
  { name: "Payments", value: 25, color: "#3b82f6" },
  { name: "Technical", value: 20, color: "#10b981" },
  { name: "Riders", value: 15, color: "#f59e0b" },
  { name: "Other", value: 5, color: "#6b7280" },
];

const mockResolutionTimeData = [
  { priority: "Low", avgTime: 48 },
  { priority: "Medium", avgTime: 24 },
  { priority: "High", avgTime: 8 },
  { priority: "Urgent", avgTime: 2 },
];

const mockTeamPerformance = [
  { name: "Sarah", tickets: 45, resolved: 42, satisfaction: 4.8 },
  { name: "Mike", tickets: 38, resolved: 35, satisfaction: 4.6 },
  { name: "Emma", tickets: 52, resolved: 50, satisfaction: 4.9 },
  { name: "John", tickets: 35, resolved: 33, satisfaction: 4.5 },
];

export default function SupportMetricsDashboard() {
  const metrics: TicketMetrics = useMemo(() => ({
    totalTickets: 145,
    openTickets: 12,
    resolvedTickets: 128,
    avgResolutionTime: 18.5,
    satisfactionScore: 4.7,
  }), []);

  const resolutionRate = ((metrics.resolvedTickets / metrics.totalTickets) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Support Metrics Dashboard</h1>
          <p className="text-gray-600">Real-time support team performance and ticket analytics</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Tickets */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Tickets</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalTickets}</p>
              </div>
              <AlertCircle className="w-12 h-12 text-purple-200" />
            </div>
          </div>

          {/* Open Tickets */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Open Tickets</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.openTickets}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-200" />
            </div>
          </div>

          {/* Resolution Rate */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Resolution Rate</p>
                <p className="text-3xl font-bold text-gray-900">{resolutionRate}%</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </div>

          {/* Avg Resolution Time */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Avg Resolution</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.avgResolutionTime}h</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          {/* Satisfaction Score */}
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Satisfaction</p>
                <p className="text-3xl font-bold text-gray-900">{metrics.satisfactionScore}/5</p>
              </div>
              <Users className="w-12 h-12 text-yellow-200" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Tickets Over Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Tickets This Week</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockTicketData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tickets" stroke="#8b5cf6" name="Created" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Issues by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Issues by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={mockCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {mockCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Resolution Time by Priority */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Avg Resolution Time by Priority</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockResolutionTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="priority" />
                <YAxis label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Bar dataKey="avgTime" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Team Performance */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Team Performance</h2>
            <div className="space-y-4">
              {mockTeamPerformance.map((member) => (
                <div key={member.name} className="border-b pb-4 last:border-b-0">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">{member.name}</span>
                    <span className="text-sm text-gray-600">⭐ {member.satisfaction}/5</span>
                  </div>
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>Tickets: {member.tickets}</span>
                    <span>Resolved: {member.resolved}</span>
                    <span>Rate: {((member.resolved / member.tickets) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SLA Compliance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">SLA Compliance by Tier</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Free Users</h3>
              <p className="text-sm text-gray-600 mb-2">Target: 72 hours</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "75%" }}></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">75% compliance</p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Basic Subscribers</h3>
              <p className="text-sm text-gray-600 mb-2">Target: 24 hours</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: "92%" }}></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">92% compliance</p>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Premium Subscribers</h3>
              <p className="text-sm text-gray-600 mb-2">Target: 4 hours</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "88%" }}></div>
              </div>
              <p className="text-sm text-gray-600 mt-2">88% compliance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
