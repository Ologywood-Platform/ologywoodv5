import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, Calendar, DollarSign, TrendingUp, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { data: viewsTotal } = trpc.analytics.getProfileViews.useQuery({});
  const { data: views30Days } = trpc.analytics.getProfileViews.useQuery({ days: 30 });
  const { data: views7Days } = trpc.analytics.getProfileViews.useQuery({ days: 7 });
  const { data: bookingStats } = trpc.analytics.getBookingStats.useQuery();
  const { data: revenueData } = trpc.analytics.getRevenueByMonth.useQuery({ months: 6 });
  
  const conversionRate = bookingStats && bookingStats.total > 0
    ? ((bookingStats.confirmed + bookingStats.completed) / bookingStats.total * 100).toFixed(1)
    : '0.0';
  
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{viewsTotal || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {views7Days || 0} in last 7 days
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookingStats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {bookingStats?.pending || 0} pending requests
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requests to confirmed bookings
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${bookingStats?.totalRevenue?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              From completed bookings
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Booking Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Booking Status Breakdown</CardTitle>
          <CardDescription>Current status of all your booking requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">{bookingStats?.pending || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confirmed</p>
                <p className="text-2xl font-bold">{bookingStats?.confirmed || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{bookingStats?.completed || 0}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold">{bookingStats?.cancelled || 0}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Revenue Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trends</CardTitle>
          <CardDescription>Monthly revenue from completed bookings (last 6 months)</CardDescription>
        </CardHeader>
        <CardContent>
          {!revenueData || revenueData.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No revenue data available yet. Complete some bookings to see trends!
            </div>
          ) : (
            <div className="space-y-4">
              {revenueData.map((item) => {
                const date = new Date(item.month + '-01');
                const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
                const barWidth = (item.revenue / maxRevenue) * 100;
                
                return (
                  <div key={item.month} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{monthName}</span>
                      <span className="text-muted-foreground">${item.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Profile Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Performance</CardTitle>
          <CardDescription>How your profile is performing over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Last 30 Days</p>
                <p className="text-sm text-muted-foreground">Profile views</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{views30Days || 0}</p>
                <p className="text-sm text-muted-foreground">
                  {views7Days && views30Days && views30Days > 0
                    ? `${((views7Days / views30Days) * 100).toFixed(0)}% from last week`
                    : 'No data'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-4 border-t">
              <div>
                <p className="font-medium">Booking Request Rate</p>
                <p className="text-sm text-muted-foreground">Requests per 100 views</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  {viewsTotal && bookingStats && viewsTotal > 0
                    ? ((bookingStats.total / viewsTotal) * 100).toFixed(1)
                    : '0.0'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {bookingStats?.total || 0} total requests
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
