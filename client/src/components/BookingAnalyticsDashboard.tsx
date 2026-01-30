import { BarChart3, TrendingUp, Users, DollarSign, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface BookingAnalytics {
  totalBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  upcomingBookings: number;
  completedBookings: number;
  cancellationRate: number;
  averageRating: number;
  topGenres: { genre: string; count: number }[];
  bookingTrend: { month: string; count: number }[];
  venueDistribution: { venueName: string; bookings: number }[];
}

interface BookingAnalyticsDashboardProps {
  analytics: BookingAnalytics;
  userType: 'artist' | 'venue';
  isLoading?: boolean;
}

export function BookingAnalyticsDashboard({
  analytics,
  userType,
  isLoading = false,
}: BookingAnalyticsDashboardProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12 text-muted-foreground">
          Loading analytics...
        </div>
      </div>
    );
  }

  const title = userType === 'artist' ? 'Booking Performance' : 'Venue Analytics';
  const subtitle = userType === 'artist' 
    ? 'Track your bookings, revenue, and performance metrics'
    : 'Monitor your booking activity and artist performance';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="text-muted-foreground mt-1">{subtitle}</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total Bookings</span>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.completedBookings} completed
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Total Revenue</span>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: ${analytics.averageBookingValue.toLocaleString()} per booking
            </p>
          </CardContent>
        </Card>

        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Upcoming</span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.cancellationRate}% cancellation rate
            </p>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>Rating</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageRating.toFixed(1)}/5.0</div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on {analytics.completedBookings} reviews
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Genres / Artists */}
        <Card>
          <CardHeader>
            <CardTitle>
              {userType === 'artist' ? 'Most Booked Venues' : 'Top Genres'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(userType === 'artist' ? analytics.venueDistribution : analytics.topGenres).map(
                (item: any, idx: number) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {item.venueName || item.genre}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {item.bookings || item.count}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${
                            ((item.bookings || item.count) /
                              Math.max(
                                ...analytics.venueDistribution.map((v: any) => v.bookings || 0),
                                ...analytics.topGenres.map((g: any) => g.count || 0)
                              )) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Booking Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.bookingTrend.map((trend: any, idx: number) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{trend.month}</span>
                    <span className="text-sm text-muted-foreground">{trend.count}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${
                          (trend.count /
                            Math.max(
                              ...analytics.bookingTrend.map((t: any) => t.count || 0)
                            )) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {userType === 'artist' ? (
              <>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm">
                    You have <strong>{analytics.upcomingBookings}</strong> upcoming bookings
                    scheduled
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm">
                    Your average rating of <strong>{analytics.averageRating.toFixed(1)}/5.0</strong> is
                    excellent
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm">
                    You've earned <strong>${analytics.totalRevenue.toLocaleString()}</strong> from{' '}
                    <strong>{analytics.completedBookings}</strong> completed bookings
                  </span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm">
                    You have <strong>{analytics.upcomingBookings}</strong> upcoming events
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm">
                    Your booking cancellation rate is{' '}
                    <strong>{analytics.cancellationRate}%</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm">
                    You've booked <strong>{analytics.totalBookings}</strong> artists across{' '}
                    <strong>{analytics.topGenres.length}</strong> different genres
                  </span>
                </li>
              </>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
