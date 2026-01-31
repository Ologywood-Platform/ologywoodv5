import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, MessageSquare, Calendar, TrendingUp, Star, Users } from 'lucide-react';

interface AnalyticsData {
  listingViews: number;
  inquiries: number;
  bookings: number;
  averageRating: number;
  reviewCount: number;
  conversionRate: number;
  viewsTrend: Array<{ date: string; views: number }>;
  inquiriesTrend: Array<{ date: string; inquiries: number }>;
  topReferrers: Array<{ source: string; views: number }>;
  recentInquiries: Array<{
    id: number;
    artistName: string;
    type: string;
    date: string;
    status: string;
  }>;
}

export function VenueAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30days');

  // Mock analytics data
  const analytics: AnalyticsData = {
    listingViews: 1247,
    inquiries: 89,
    bookings: 12,
    averageRating: 4.8,
    reviewCount: 24,
    conversionRate: 13.5,
    viewsTrend: [
      { date: 'Jan 1', views: 45 },
      { date: 'Jan 5', views: 62 },
      { date: 'Jan 10', views: 58 },
      { date: 'Jan 15', views: 89 },
      { date: 'Jan 20', views: 112 },
      { date: 'Jan 25', views: 145 },
      { date: 'Jan 31', views: 156 },
    ],
    inquiriesTrend: [
      { date: 'Jan 1', inquiries: 2 },
      { date: 'Jan 5', inquiries: 4 },
      { date: 'Jan 10', inquiries: 5 },
      { date: 'Jan 15', inquiries: 8 },
      { date: 'Jan 20', inquiries: 12 },
      { date: 'Jan 25', inquiries: 16 },
      { date: 'Jan 31', inquiries: 20 },
    ],
    topReferrers: [
      { source: 'Directory Search', views: 456 },
      { source: 'Direct Link', views: 234 },
      { source: 'Artist Profile', views: 189 },
      { source: 'Email Campaign', views: 156 },
      { source: 'Social Media', views: 112 },
    ],
    recentInquiries: [
      {
        id: 1,
        artistName: 'Luna Echo',
        type: 'Booking Request',
        date: '2 hours ago',
        status: 'New',
      },
      {
        id: 2,
        artistName: 'The Velvet Collective',
        type: 'General Inquiry',
        date: '5 hours ago',
        status: 'Responded',
      },
      {
        id: 3,
        artistName: 'DJ Sonic Wave',
        type: 'Booking Request',
        date: '1 day ago',
        status: 'Pending',
      },
      {
        id: 4,
        artistName: 'Jazz Ensemble',
        type: 'General Inquiry',
        date: '2 days ago',
        status: 'Responded',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Venue Analytics</h1>
            <p className="text-gray-600 mt-1">Track your listing performance and booking inquiries</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDateRange('7days')}>
              7 Days
            </Button>
            <Button variant={dateRange === '30days' ? 'default' : 'outline'} onClick={() => setDateRange('30days')}>
              30 Days
            </Button>
            <Button variant="outline" onClick={() => setDateRange('90days')}>
              90 Days
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                Listing Views
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.listingViews}</div>
              <p className="text-xs text-gray-600 mt-1">+12% from last period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-purple-600" />
                Inquiries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.inquiries}</div>
              <p className="text-xs text-gray-600 mt-1">+8% from last period</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4 text-green-600" />
                Bookings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.bookings}</div>
              <p className="text-xs text-gray-600 mt-1">Conversion: {analytics.conversionRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-600" />
                Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averageRating}</div>
              <p className="text-xs text-gray-600 mt-1">({analytics.reviewCount} reviews)</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="referrers">Traffic Sources</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Views Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Listing Views Trend</CardTitle>
                  <CardDescription>Daily views over the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.viewsTrend.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{item.date}</span>
                        <div className="flex items-center gap-2">
                          <div className="bg-blue-200 rounded h-2" style={{ width: `${(item.views / 200) * 100}px` }} />
                          <span className="text-sm font-medium">{item.views}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Inquiries Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inquiries Trend</CardTitle>
                  <CardDescription>Daily inquiries over the selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.inquiriesTrend.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{item.date}</span>
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-200 rounded h-2" style={{ width: `${(item.inquiries / 30) * 100}px` }} />
                          <span className="text-sm font-medium">{item.inquiries}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Inquiries Tab */}
          <TabsContent value="inquiries">
            <Card>
              <CardHeader>
                <CardTitle>Recent Inquiries</CardTitle>
                <CardDescription>Latest booking requests and general inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.recentInquiries.map(inquiry => (
                    <div key={inquiry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <p className="font-medium">{inquiry.artistName}</p>
                        <p className="text-sm text-gray-600">{inquiry.type}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">{inquiry.date}</span>
                        <Badge variant={inquiry.status === 'New' ? 'default' : 'secondary'}>
                          {inquiry.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Review Statistics</CardTitle>
                <CardDescription>How artists rate your venue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">★★★★★</div>
                    <p className="text-sm text-gray-600 mt-2">5 Stars</p>
                    <p className="text-lg font-semibold">18</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">★★★★☆</div>
                    <p className="text-sm text-gray-600 mt-2">4 Stars</p>
                    <p className="text-lg font-semibold">4</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">★★★☆☆</div>
                    <p className="text-sm text-gray-600 mt-2">3 Stars</p>
                    <p className="text-lg font-semibold">2</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">★★☆☆☆</div>
                    <p className="text-sm text-gray-600 mt-2">2 Stars</p>
                    <p className="text-lg font-semibold">0</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">★☆☆☆☆</div>
                    <p className="text-sm text-gray-600 mt-2">1 Star</p>
                    <p className="text-lg font-semibold">0</p>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Category Ratings</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Professionalism', rating: 4.9 },
                      { label: 'Sound Quality', rating: 4.7 },
                      { label: 'Amenities', rating: 4.8 },
                      { label: 'Audience Quality', rating: 4.6 },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-sm">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="bg-gray-200 rounded-full h-2 w-32" />
                          <span className="text-sm font-medium">{item.rating}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Traffic Sources Tab */}
          <TabsContent value="referrers">
            <Card>
              <CardHeader>
                <CardTitle>Top Traffic Sources</CardTitle>
                <CardDescription>Where your listing views are coming from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topReferrers.map((referrer, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{referrer.source}</span>
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 rounded h-2 w-48" style={{ width: `${(referrer.views / 500) * 200}px` }} />
                        <span className="text-sm font-semibold text-right w-12">{referrer.views}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Pro Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Pro Tips to Increase Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>• Add high-quality photos to your venue profile to increase engagement</li>
              <li>• Respond to inquiries within 24 hours to improve conversion rates</li>
              <li>• Encourage artists to leave reviews after their performances</li>
              <li>• Update your amenities and capacity information regularly</li>
              <li>• Consider offering special rates during low-traffic periods</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
