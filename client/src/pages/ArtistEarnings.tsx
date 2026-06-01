import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/components/ErrorToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowLeft,
  ExternalLink,
  LinkIcon,
  AlertTriangle,
  Loader2,
  CreditCard,
  Music,
  BarChart3,
  ShoppingCart,
} from 'lucide-react';

function ReleaseSalesAnalytics() {
  const { data: analytics, isLoading } = trpc.release.salesAnalytics.useQuery();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Release Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-gray-500">Loading analytics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics || analytics.summary.releaseCount === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Release Sales
          </CardTitle>
          <CardDescription>Track sales and revenue for your releases</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No releases yet. Publish a release to start tracking sales.</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, releases } = analytics;
  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
    <>
      {/* Release Sales Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Release Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{summary.totalSales}</div>
              <ShoppingCart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCents(summary.totalGrossRevenueCents)}</div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Your Net Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCents(summary.totalNetRevenueCents)}</div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/50 dark:bg-gray-950/20 dark:border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Platform Fee (1%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCents(summary.totalPlatformFeeCents)}</div>
              <BarChart3 className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Release Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Release Breakdown
          </CardTitle>
          <CardDescription>
            Sales and revenue per release ({summary.releaseCount} release{summary.releaseCount !== 1 ? 's' : ''})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Release</TableHead>
                <TableHead className="text-center">Price</TableHead>
                <TableHead className="text-center">Sales</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Gross</TableHead>
                <TableHead className="text-center">Net</TableHead>
                <TableHead className="text-center hidden sm:table-cell">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {releases.map((release: any) => (
                <TableRow key={release.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {release.coverArtUrl ? (
                        <img
                          src={release.coverArtUrl}
                          alt={release.title}
                          className="w-10 h-10 rounded object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Music className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{release.title}</div>
                        {release.genre && (
                          <div className="text-xs text-gray-500">{release.genre}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{formatCents(release.priceInCents)}</TableCell>
                  <TableCell className="text-center font-semibold">{release.totalSales}</TableCell>
                  <TableCell className="text-center hidden sm:table-cell">{formatCents(release.totalRevenueCents)}</TableCell>
                  <TableCell className="text-center font-semibold text-green-600">
                    {formatCents(release.totalRevenueCents - (release.totalRevenueCents * 0.01))}
                  </TableCell>
                  <TableCell className="text-center hidden sm:table-cell">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      release.status === 'published'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : release.status === 'draft'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {release.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

export default function ArtistEarnings() {
  const [, navigate] = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);

  const toast = useToast();

  // Fetch Stripe Connect account status
  const { data: connectStatus, isLoading: connectLoading, refetch: refetchConnect } =
    trpc.stripeConnect.getAccountStatus.useQuery();

  // Fetch earnings data (still from payout router for now)
  const { data: earningsData, isLoading: earningsLoading } = trpc.payout.getEarnings.useQuery();

  // Fetch payout history
  const { data: payoutHistory, isLoading: historyLoading } = trpc.payout.getPayoutHistory.useQuery();

  // Stripe Connect mutations
  const createAccountMutation = trpc.stripeConnect.createAccount.useMutation({
    onSuccess: (data) => {
      // Open Stripe onboarding in new tab
      window.open(data.url, '_blank');
      toast.addSuccess(
        'Stripe Connect',
        data.isExisting
          ? 'Complete your Stripe setup in the new tab.'
          : 'Your Stripe account has been created. Complete setup in the new tab.'
      );
      setIsConnecting(false);
      // Refetch status after a delay to catch updates
      setTimeout(() => refetchConnect(), 5000);
    },
    onError: (error: any) => {
      toast.addError('Connection failed', error.message || 'Failed to create Stripe account');
      setIsConnecting(false);
    },
  });

  const getDashboardMutation = trpc.stripeConnect.getDashboardLink.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: (error: any) => {
      toast.addError('Error', error.message || 'Failed to open Stripe dashboard');
    },
  });

  const getOnboardingMutation = trpc.stripeConnect.getOnboardingLink.useMutation({
    onSuccess: (data) => {
      window.open(data.url, '_blank');
      toast.addSuccess('Stripe Connect', 'Complete your setup in the new tab.');
      setTimeout(() => refetchConnect(), 5000);
    },
    onError: (error: any) => {
      toast.addError('Error', error.message || 'Failed to get onboarding link');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPayoutStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleConnectStripe = () => {
    setIsConnecting(true);
    createAccountMutation.mutate();
  };

  if (connectLoading || earningsLoading || historyLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading earnings data...</span>
      </div>
    );
  }

  const isConnected = connectStatus?.connected && connectStatus?.status === 'active';
  const isPending = connectStatus?.connected && connectStatus?.status === 'pending';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Earnings & Payouts</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Track your earnings and manage your Stripe account</p>
      </div>

      {/* Stripe Connect Status Card */}
      <Card className={isConnected ? 'border-green-200 bg-green-50/50' : isPending ? 'border-yellow-200 bg-yellow-50/50' : 'border-blue-200 bg-blue-50/50'}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Account
          </CardTitle>
          <CardDescription>
            {isConnected
              ? 'Your Stripe account is connected. You receive payments directly from release sales and bookings.'
              : isPending
              ? 'Your Stripe account setup is incomplete. Complete it to start receiving payments.'
              : 'Connect your Stripe account to receive payments directly from fans and venues.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Connected & Active</span>
                </div>
                <span className="text-sm text-gray-500">
                  Charges: {connectStatus.chargesEnabled ? '✓' : '✗'} | 
                  Payouts: {connectStatus.payoutsEnabled ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getDashboardMutation.mutate()}
                  disabled={getDashboardMutation.isPending}
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  {getDashboardMutation.isPending ? 'Opening...' : 'Stripe Dashboard'}
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Payments from release sales and bookings are deposited directly to your Stripe account. 
                The platform takes a 1% service fee on each transaction. View your full balance and 
                payout schedule in your Stripe Dashboard.
              </p>
            </div>
          ) : isPending ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Setup Incomplete</span>
              </div>
              {connectStatus?.requiresAction && connectStatus?.currentlyDue?.length > 0 && (
                <p className="text-sm text-yellow-800">
                  Stripe needs more information to activate your account. Click below to complete setup.
                </p>
              )}
              <Button
                onClick={() => getOnboardingMutation.mutate()}
                disabled={getOnboardingMutation.isPending}
                className="gap-2"
              >
                <LinkIcon className="h-4 w-4" />
                {getOnboardingMutation.isPending ? 'Loading...' : 'Complete Stripe Setup'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium mb-2">How it works</h4>
                <ul className="text-sm text-gray-600 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">1.</span>
                    Connect your Stripe account (takes about 2 minutes)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">2.</span>
                    When fans buy your releases or venues pay booking deposits, the money goes directly to your Stripe
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">3.</span>
                    Ologywood takes a 1% service fee — you keep 99%
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold mt-0.5">4.</span>
                    Stripe handles payouts to your bank on your schedule
                  </li>
                </ul>
              </div>
              <Button
                onClick={handleConnectStripe}
                disabled={isConnecting || createAccountMutation.isPending}
                size="lg"
                className="gap-2"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4" />
                    Connect Stripe Account
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Earnings Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(earningsData?.totalEarnings || 0)}</div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(earningsData?.completedEarnings || 0)}</div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(earningsData?.pendingEarnings || 0)}</div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(earningsData?.paidOutEarnings || 0)}</div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown Link */}
      <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm sm:text-base">Detailed Earnings Breakdown</h3>
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 mt-1">View per-booking revenue, door split calculations, and monthly/quarterly summaries with CSV export.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/earnings/breakdown')} className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-100 shrink-0 self-start sm:self-center">
              <BarChart3 className="h-4 w-4" />
              View Breakdown
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Release Sales Analytics */}
      <ReleaseSalesAnalytics />

      {/* Info about earnings source */}
      {!isConnected && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 text-sm sm:text-base">Connect Stripe to receive payments</p>
                <p className="text-xs sm:text-sm text-amber-700 mt-1">
                  Until you connect your Stripe account, payments from release sales and bookings will be held by the platform. 
                  Connect your account above to start receiving payments directly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                {isConnected
                  ? 'View detailed transaction history in your Stripe Dashboard'
                  : 'Your transaction history will appear here once you connect Stripe'}
              </CardDescription>
            </div>
            {isConnected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => getDashboardMutation.mutate()}
                disabled={getDashboardMutation.isPending}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View in Stripe
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {payoutHistory && payoutHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutHistory.map((payout: any) => (
                  <TableRow key={payout.id} className="border-gray-200">
                    <TableCell className="text-sm">
                      {new Date(payout.requestedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(payout.amount)}</TableCell>
                    <TableCell className="text-sm capitalize">{payout.payoutMethod?.replace('_', ' ')}</TableCell>
                    <TableCell>{getPayoutStatusBadge(payout.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {payout.completedAt && `${new Date(payout.completedAt).toLocaleDateString()}`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-500 text-center py-8">No transactions yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
