import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, MessageSquare, TrendingUp, Users, DollarSign, BarChart3 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useMemo } from 'react';

interface VenueAnalyticsProps {
  venueId: number;
  bookings: any[];
}

export default function VenueAnalytics({ venueId, bookings }: VenueAnalyticsProps) {
  // Calculate analytics from bookings data
  const analytics = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const allBookings = bookings || [];
    
    // This month's bookings
    const thisMonthBookings = allBookings.filter((b: any) => {
      const created = new Date(b.createdAt);
      return created >= thirtyDaysAgo;
    });

    // This week's bookings
    const thisWeekBookings = allBookings.filter((b: any) => {
      const created = new Date(b.createdAt);
      return created >= sevenDaysAgo;
    });

    // Status breakdown
    const confirmed = allBookings.filter((b: any) => b.status === 'confirmed').length;
    const pending = allBookings.filter((b: any) => b.status === 'pending').length;
    const completed = allBookings.filter((b: any) => b.status === 'completed').length;
    const cancelled = allBookings.filter((b: any) => b.status === 'cancelled').length;

    // Conversion rate (confirmed + completed out of total)
    const totalRequests = allBookings.length;
    const successfulBookings = confirmed + completed;
    const conversionRate = totalRequests > 0 ? Math.round((successfulBookings / totalRequests) * 100) : 0;

    // Revenue estimate from confirmed/completed bookings with amounts
    const totalRevenue = allBookings
      .filter((b: any) => b.status === 'confirmed' || b.status === 'completed')
      .reduce((sum: number, b: any) => {
        const amount = parseFloat(b.amount || b.budget || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);

    // Upcoming shows (confirmed bookings with future dates)
    const upcomingShows = allBookings.filter((b: any) => {
      return b.status === 'confirmed' && new Date(b.eventDate) >= now;
    }).length;

    // Average bookings per week (over last 30 days)
    const avgPerWeek = thisMonthBookings.length > 0 
      ? Math.round((thisMonthBookings.length / 4) * 10) / 10 
      : 0;

    return {
      totalBookings: allBookings.length,
      thisMonthBookings: thisMonthBookings.length,
      thisWeekBookings: thisWeekBookings.length,
      confirmed,
      pending,
      completed,
      cancelled,
      conversionRate,
      totalRevenue,
      upcomingShows,
      avgPerWeek,
    };
  }, [bookings]);

  return (
    <div className="space-y-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.totalBookings}</p>
                <p className="text-xs text-gray-500">Total Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.conversionRate}%</p>
                <p className="text-xs text-gray-500">Booking Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{analytics.upcomingShows}</p>
                <p className="text-xs text-gray-500">Upcoming Shows</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${analytics.totalRevenue > 0 ? analytics.totalRevenue.toLocaleString() : '0'}
                </p>
                <p className="text-xs text-gray-500">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Booking Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="text-sm">Pending</span>
                </div>
                <Badge variant="secondary">{analytics.pending}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Confirmed</span>
                </div>
                <Badge variant="secondary">{analytics.confirmed}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Completed</span>
                </div>
                <Badge variant="secondary">{analytics.completed}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-sm">Cancelled</span>
                </div>
                <Badge variant="secondary">{analytics.cancelled}</Badge>
              </div>
            </div>

            {/* Visual bar */}
            {analytics.totalBookings > 0 && (
              <div className="mt-4 h-4 rounded-full overflow-hidden flex bg-gray-100">
                {analytics.confirmed > 0 && (
                  <div
                    className="bg-green-500 h-full"
                    style={{ width: `${(analytics.confirmed / analytics.totalBookings) * 100}%` }}
                  />
                )}
                {analytics.completed > 0 && (
                  <div
                    className="bg-blue-500 h-full"
                    style={{ width: `${(analytics.completed / analytics.totalBookings) * 100}%` }}
                  />
                )}
                {analytics.pending > 0 && (
                  <div
                    className="bg-yellow-400 h-full"
                    style={{ width: `${(analytics.pending / analytics.totalBookings) * 100}%` }}
                  />
                )}
                {analytics.cancelled > 0 && (
                  <div
                    className="bg-red-400 h-full"
                    style={{ width: `${(analytics.cancelled / analytics.totalBookings) * 100}%` }}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">This Week</p>
                  <p className="text-xs text-gray-500">New booking requests</p>
                </div>
                <span className="text-2xl font-bold text-purple-600">{analytics.thisWeekBookings}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">This Month</p>
                  <p className="text-xs text-gray-500">New booking requests</p>
                </div>
                <span className="text-2xl font-bold text-purple-600">{analytics.thisMonthBookings}</span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Avg. Per Week</p>
                  <p className="text-xs text-gray-500">Based on last 30 days</p>
                </div>
                <span className="text-2xl font-bold text-purple-600">{analytics.avgPerWeek}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips Section */}
      <Card className="border-purple-200 bg-purple-50/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-purple-800 mb-2">Tips to Get More Bookings</h3>
          <ul className="space-y-2 text-sm text-purple-700">
            {!analytics.totalBookings && (
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                Complete your venue profile with photos, capacity info, and amenities to attract more artists.
              </li>
            )}
            {analytics.conversionRate < 50 && analytics.totalBookings > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                Your booking rate is {analytics.conversionRate}%. Respond to requests within 24 hours to improve conversions.
              </li>
            )}
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              Post events for your confirmed shows to increase visibility and attract more artists to your venue.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              Save artists you'd like to rebook — building relationships leads to consistent programming.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
