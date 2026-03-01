import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Clock, CheckCircle, Music, Calendar, TrendingUp } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/utils';

export default function ArtistEarningsDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'releases'>('overview');

  // Fetch release sales stats
  const { data: salesStats, isLoading: salesLoading } = trpc.release.getSalesStats.useQuery(
    undefined,
    { enabled: user?.role === 'artist' }
  );

  // Mock booking earnings data (earnings router disabled)
  const bookingEarnings = {
    totalEarnings: 12500,
    pendingEarnings: 3200,
    paidOutEarnings: 9300,
    thisMonth: 2100,
  };
  const recentTransactions = [
    { id: 1, amount: 500, date: new Date(), status: 'completed' },
    { id: 2, amount: 1200, date: new Date(), status: 'pending' },
  ];
  const earningsLoading = false;

  // Calculate combined totals
  const releaseEarnings = salesStats?.totalRevenueCents || 0;
  const releasePlatformFees = salesStats ? Math.round(releaseEarnings * 0.01 / 0.99) : 0;
  const releaseNetEarnings = releaseEarnings - releasePlatformFees;
  const combinedTotal = (bookingEarnings.totalEarnings || 0) + Math.round(releaseNetEarnings / 100);

  // Verify user is an artist
  if (user?.role !== 'artist') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is only for artists.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
            <p className="text-sm text-slate-600">Bookings & release sales</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b pb-2">
            <Button
              variant={activeTab === 'overview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('overview')}
              className="gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Overview
            </Button>
            <Button
              variant={activeTab === 'bookings' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('bookings')}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Bookings
            </Button>
            <Button
              variant={activeTab === 'releases' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab('releases')}
              className="gap-2"
            >
              <Music className="h-4 w-4" />
              Releases
            </Button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <>
              {/* Combined Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Combined Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {formatCurrency(combinedTotal)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Bookings + release sales</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      Booking Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {earningsLoading ? '...' : formatCurrency(bookingEarnings.totalEarnings || 0)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">From performances</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Music className="h-4 w-4 text-purple-500" />
                      Release Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {salesLoading ? '...' : formatCurrency(Math.round(releaseNetEarnings / 100))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {salesStats?.totalSales || 0} sales · After 1% fee
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">
                      {earningsLoading ? '...' : formatCurrency(bookingEarnings.pendingEarnings || 0)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Awaiting completion</p>
                  </CardContent>
                </Card>
              </div>

              {/* Release Stats Summary */}
              {salesStats && (salesStats.totalSales > 0 || salesStats.publishedReleases > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Music className="h-5 w-5 text-purple-500" />
                      White Label Release Summary
                    </CardTitle>
                    <CardDescription>Your music sales performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-700">{salesStats.publishedReleases}</p>
                        <p className="text-xs text-purple-600">Published</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{salesStats.totalSales}</p>
                        <p className="text-xs text-green-600">Total Sales</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(Math.round(salesStats.totalRevenueCents / 100))}
                        </p>
                        <p className="text-xs text-blue-600">Gross Revenue</p>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <p className="text-2xl font-bold text-amber-700">
                          {salesStats.totalSales > 0
                            ? formatCurrency(Math.round(salesStats.totalRevenueCents / salesStats.totalSales / 100))
                            : '$0'}
                        </p>
                        <p className="text-xs text-amber-600">Avg. Sale</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Total Booking Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {earningsLoading ? '...' : formatCurrency(bookingEarnings.totalEarnings || 0)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">After 1% platform fee</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-amber-600">
                      {earningsLoading ? '...' : formatCurrency(bookingEarnings.pendingEarnings || 0)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Awaiting completion</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Paid Out
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {earningsLoading ? '...' : formatCurrency(bookingEarnings.paidOutEarnings || 0)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Transferred to account</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Bookings</CardTitle>
                  <CardDescription>Your latest booking earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentTransactions && recentTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {recentTransactions.map((tx: any) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-sm">{tx.eventDetails || 'Booking'}</p>
                            <p className="text-xs text-slate-600">
                              {new Date(tx.date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-sm">{formatCurrency(tx.amount)}</p>
                            <p className="text-xs text-slate-500 capitalize">{tx.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600 text-center py-6">
                      No bookings yet. Complete your first booking to see earnings.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* Releases Tab */}
          {activeTab === 'releases' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      Gross Revenue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {salesLoading ? '...' : formatCurrency(Math.round((salesStats?.totalRevenueCents || 0) / 100))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Before platform fee</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" />
                      Net Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {salesLoading ? '...' : formatCurrency(Math.round(releaseNetEarnings / 100))}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">After 1% platform fee</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Music className="h-4 w-4 text-purple-500" />
                      Total Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {salesLoading ? '...' : (salesStats?.totalSales || 0)}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {salesStats?.publishedReleases || 0} published releases
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Manage Releases</CardTitle>
                  <CardDescription>View and manage your White Label Releases</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => navigate('/releases')}
                    className="gap-2"
                  >
                    <Music className="h-4 w-4" />
                    Go to Release Manager
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
