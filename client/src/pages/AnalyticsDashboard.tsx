import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, CheckCircle } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

interface MetricData {
  totalBookings: number;
  totalRevenue: number;
  activeUsers: number;
  completionRate: number;
  monthlyGrowth: number;
  revenueGrowth: number;
}

interface BookingTrend {
  date: string;
  bookings: number;
  revenue: number;
}

export default function AnalyticsDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [trends, setTrends] = useState<BookingTrend[]>([]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  // Simulate analytics data for demo
  useEffect(() => {
    setMetrics({
      totalBookings: 42,
      totalRevenue: 21500,
      activeUsers: 156,
      completionRate: 72,
      monthlyGrowth: 12,
      revenueGrowth: 8,
    });

    // Generate 30-day trend data
    const trendData: BookingTrend[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trendData.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        bookings: Math.floor(Math.random() * 3) + 1,
        revenue: Math.floor(Math.random() * 1500) + 500,
      });
    }
    setTrends(trendData);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <span>📊</span>
            Ologywood Analytics
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
            <Badge variant="secondary">{user.role}</Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor your booking performance and growth metrics</p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Bookings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Total Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics?.totalBookings || 0}</div>
              <p className="text-xs text-green-600 mt-2">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +{metrics?.monthlyGrowth || 0}% from last month
              </p>
            </CardContent>
          </Card>

          {/* Total Revenue */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">${(metrics?.totalRevenue || 0).toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-2">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +{metrics?.revenueGrowth || 0}% from last month
              </p>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics?.activeUsers || 0}</div>
              <p className="text-xs text-muted-foreground mt-2">Booked in last 30 days</p>
            </CardContent>
          </Card>

          {/* Completion Rate */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-orange-600" />
                Completion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics?.completionRate || 0}%</div>
              <p className="text-xs text-muted-foreground mt-2">Target: 75%</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Booking Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Bookings Over Time</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {trends.map((trend, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors"
                    style={{ height: `${(trend.bookings / 5) * 100}%` }}
                    title={`${trend.date}: ${trend.bookings} bookings`}
                  />
                ))}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Average: {(trends.reduce((sum, t) => sum + t.bookings, 0) / trends.length).toFixed(1)} bookings/day
              </div>
            </CardContent>
          </Card>

          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end gap-1">
                {trends.map((trend, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-green-500 rounded-t hover:bg-green-600 transition-colors"
                    style={{ height: `${(trend.revenue / 2000) * 100}%` }}
                    title={`${trend.date}: $${trend.revenue}`}
                  />
                ))}
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                Average: ${(trends.reduce((sum, t) => sum + t.revenue, 0) / trends.length).toFixed(0)}/day
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Key insights and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Average Booking Value</h4>
                <p className="text-2xl font-bold text-blue-600">
                  ${metrics?.totalRevenue && metrics?.totalBookings ? (metrics.totalRevenue / metrics.totalBookings).toFixed(0) : 0}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Monthly Revenue Run Rate</h4>
                <p className="text-2xl font-bold text-green-600">
                  ${metrics?.totalRevenue ? (metrics.totalRevenue * 1.1).toFixed(0) : 0}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-sm mb-2">Estimated MRR</h4>
                <p className="text-2xl font-bold text-purple-600">
                  ${metrics?.totalRevenue ? (metrics.totalRevenue * 0.3).toFixed(0) : 0}
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">💡 Recommendations</h4>
              <ul className="text-sm space-y-2 text-gray-700">
                <li>• Your completion rate (72%) is close to target (75%). Focus on improving artist response time.</li>
                <li>• Revenue growth is strong (+8%). Consider expanding to new markets or artist categories.</li>
                <li>• Active users are growing well. Implement referral program to accelerate growth.</li>
                <li>• Average booking value is healthy. Upsell premium artists to increase revenue per booking.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Button variant="outline">Export Report</Button>
        </div>
      </div>
    </div>
  );
}
