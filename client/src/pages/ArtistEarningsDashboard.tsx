import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/utils';

export function ArtistEarningsDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Fetch earnings data
  const { data: earnings, isLoading: earningsLoading } = trpc.earnings.getArtistEarnings.useQuery();
  const { data: recentTransactions } = trpc.earnings.getRecentTransactions.useQuery({ limit: 10 });

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
            <p className="text-sm text-slate-600">Your booking income</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Earnings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {earningsLoading ? '...' : formatCurrency(earnings?.totalEarnings || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">After 1% platform fee</p>
              </CardContent>
            </Card>

            {/* Pending */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {earningsLoading ? '...' : formatCurrency(earnings?.pendingEarnings || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Awaiting completion</p>
              </CardContent>
            </Card>

            {/* Paid Out */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Paid Out
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {earningsLoading ? '...' : formatCurrency(earnings?.paidOutEarnings || 0)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Transferred to account</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Bookings</CardTitle>
              <CardDescription>Your latest earnings</CardDescription>
            </CardHeader>
            <CardContent>
              {recentTransactions && recentTransactions.length > 0 ? (
                <div className="space-y-2">
                  {recentTransactions.map((tx: any) => (
                    <div
                      key={tx.bookingId}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-sm">{tx.eventDetails || 'Booking'}</p>
                        <p className="text-xs text-slate-600">
                          {new Date(tx.eventDate).toLocaleDateString()}
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
        </div>
      </div>
    </div>
  );
}
