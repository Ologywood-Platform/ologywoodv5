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
import { SiteHeader } from "@/components/SiteHeader";
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
  Ticket,
  Calendar,
  Unlink,
  RefreshCw,
  Download,
} from 'lucide-react';

// Simple donut chart component using SVG
function IncomeBreakdownChart({ summary }: { summary: { bookings: number; releases: number; tickets: number } }) {
  const total = summary.bookings + summary.releases + summary.tickets;
  
  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Income Breakdown
          </CardTitle>
          <CardDescription>Revenue by source type</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No income data yet. Earnings will appear here once you receive payments.</p>
        </CardContent>
      </Card>
    );
  }

  const segments = [
    { label: 'Bookings', value: summary.bookings, color: '#7c3aed', icon: Calendar },
    { label: 'Releases', value: summary.releases, color: '#10b981', icon: Music },
    { label: 'Tickets', value: summary.tickets, color: '#f59e0b', icon: Ticket },
  ].filter(s => s.value > 0);

  // Calculate donut segments
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let cumulativePercent = 0;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Income Breakdown
        </CardTitle>
        <CardDescription>Revenue by source type — Total: {formatCurrency(total)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="relative w-48 h-48 shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
              {segments.map((segment, i) => {
                const percent = segment.value / total;
                const dashLength = percent * circumference;
                const dashOffset = cumulativePercent * circumference;
                cumulativePercent += percent;
                return (
                  <circle
                    key={i}
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="24"
                    strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                    strokeDashoffset={-dashOffset}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{formatCurrency(total)}</span>
              <span className="text-xs text-gray-500">Total Net</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-3 w-full">
            {segments.map((segment, i) => {
              const Icon = segment.icon;
              const percent = ((segment.value / total) * 100).toFixed(1);
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
      <SiteHeader />
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-sm">{segment.label}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{formatCurrency(segment.value)}</div>
                    <div className="text-xs text-gray-500">{percent}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Transaction History Table Component
function TransactionHistoryTable() {
  const { data, isLoading } = trpc.payout.getTransactionHistory.useQuery();
  const [filter, setFilter] = useState<'all' | 'booking' | 'release' | 'ticket'>('all');

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-gray-500">Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const transactions = data?.transactions || [];
  const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);

  const exportToCsv = (rows: typeof transactions) => {
    const headers = ['Date', 'Type', 'Source', 'Gross Amount', 'Platform Fee', 'Net Amount', 'Status'];
    const csvRows = [
      headers.join(','),
      ...rows.map(tx => [
        new Date(tx.date).toLocaleDateString('en-US'),
        tx.type,
        `"${tx.source.replace(/"/g, '""')}"`,
        tx.grossAmount.toFixed(2),
        tx.platformFee.toFixed(2),
        tx.netAmount.toFixed(2),
        tx.status,
      ].join(','))
    ];
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ologywood-earnings-${filter}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking': return <Calendar className="h-4 w-4 text-purple-600" />;
      case 'release': return <Music className="h-4 w-4 text-green-600" />;
      case 'ticket': return <Ticket className="h-4 w-4 text-amber-600" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      booking: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      release: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      ticket: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[type] || 'bg-gray-100 text-gray-800'}`}>
        {getTypeIcon(type)}
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paid_out: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {filtered.length} transaction{filtered.length !== 1 ? 's' : ''} — showing where your money came from
            </CardDescription>
          </div>
          {/* Filter and Export buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'booking', 'release', 'ticket'] as const).map(f => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="text-xs h-7 px-2.5"
                >
                  {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) + 's'}
                </Button>
              ))}
            </div>
            {filtered.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCsv(filtered)}
                className="text-xs h-7 px-2.5 gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">Fee (1%)</TableHead>
                  <TableHead className="text-right">Net</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </TableCell>
                    <TableCell>{getTypeBadge(tx.type)}</TableCell>
                    <TableCell className="font-medium text-sm max-w-[200px] truncate">{tx.source}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(tx.grossAmount)}</TableCell>
                    <TableCell className="text-right text-sm text-gray-500 hidden sm:table-cell">-{formatCurrency(tx.platformFee)}</TableCell>
                    <TableCell className="text-right font-semibold text-sm text-green-600">{formatCurrency(tx.netAmount)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(tx.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            {filter === 'all'
              ? 'No transactions yet. Earnings will appear here once you receive payments from bookings, release sales, or ticket sales.'
              : `No ${filter} transactions found.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Release Sales Analytics (existing component)
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
    return null; // Don't show if no releases
  }

  const { summary, releases } = analytics;
  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  return (
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-center">
            <div className="text-lg font-bold">{summary.totalSales}</div>
            <div className="text-xs text-gray-500">Total Sales</div>
          </div>
          <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-center">
            <div className="text-lg font-bold">{formatCents(summary.totalGrossRevenueCents)}</div>
            <div className="text-xs text-gray-500">Gross Revenue</div>
          </div>
          <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 text-center">
            <div className="text-lg font-bold">{formatCents(summary.totalNetRevenueCents)}</div>
            <div className="text-xs text-gray-500">Net Revenue</div>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-950/20 text-center">
            <div className="text-lg font-bold">{formatCents(summary.totalPlatformFeeCents)}</div>
            <div className="text-xs text-gray-500">Platform Fee</div>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Release</TableHead>
              <TableHead className="text-center">Price</TableHead>
              <TableHead className="text-center">Sales</TableHead>
              <TableHead className="text-center hidden sm:table-cell">Gross</TableHead>
              <TableHead className="text-center">Net</TableHead>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function ArtistEarnings() {
  const [, navigate] = useLocation();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  const toast = useToast();

  // Fetch Stripe Connect account status
  const { data: connectStatus, isLoading: connectLoading, refetch: refetchConnect } =
    trpc.stripeConnect.getAccountStatus.useQuery();

  // Fetch earnings data
  const { data: earningsData, isLoading: earningsLoading } = trpc.payout.getEarnings.useQuery();

  // Fetch transaction history (for chart summary)
  const { data: transactionData, isLoading: transactionLoading } = trpc.payout.getTransactionHistory.useQuery();

  // Stripe Connect mutations
  const createAccountMutation = trpc.stripeConnect.createAccount.useMutation({
    onSuccess: (data) => {
      // Use location.href to avoid popup blockers (window.open after async is blocked)
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast.addError('Connection failed', error.message || 'Failed to create Stripe account');
      setIsConnecting(false);
    },
  });

  const getDashboardMutation = trpc.stripeConnect.getDashboardLink.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast.addError('Error', error.message || 'Failed to open Stripe dashboard');
    },
  });

  const getOnboardingMutation = trpc.stripeConnect.getOnboardingLink.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: any) => {
      toast.addError('Error', error.message || 'Failed to get onboarding link');
    },
  });

  const disconnectMutation = trpc.stripeConnect.disconnectAccount.useMutation({
    onSuccess: () => {
      toast.addSuccess('Disconnected', 'Your Stripe account has been disconnected.');
      setShowDisconnectConfirm(false);
      refetchConnect();
    },
    onError: (error: any) => {
      toast.addError('Error', error.message || 'Failed to disconnect account');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleConnectStripe = () => {
    setIsConnecting(true);
    createAccountMutation.mutate();
  };

  if (connectLoading || earningsLoading || transactionLoading) {
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
      <Card className={isConnected ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800' : isPending ? 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20 dark:border-yellow-800' : 'border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800'}>
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
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Connected & Active</span>
                </div>
                <span className="text-sm text-gray-500">
                  Charges: {connectStatus.chargesEnabled ? '✓' : '✗'} | 
                  Payouts: {connectStatus.payoutsEnabled ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getOnboardingMutation.mutate()}
                  disabled={getOnboardingMutation.isPending}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {getOnboardingMutation.isPending ? 'Loading...' : 'Update Account'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="gap-2 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
                >
                  <Unlink className="h-4 w-4" />
                  Disconnect
                </Button>
              </div>

              {/* Disconnect confirmation */}
              {showDisconnectConfirm && (
                <div className="p-4 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800">
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">Are you sure you want to disconnect your Stripe account?</p>
                  <p className="text-xs text-red-600 dark:text-red-400 mb-3">Payments will go to the platform until you reconnect. Any pending payouts will still be processed.</p>
                  <div className="flex gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => disconnectMutation.mutate()}
                      disabled={disconnectMutation.isPending}
                    >
                      {disconnectMutation.isPending ? 'Disconnecting...' : 'Yes, Disconnect'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDisconnectConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Payments from release sales and bookings are deposited directly to your Stripe account. 
                The platform takes a 1% service fee on each transaction. View your full balance and 
                payout schedule in your Stripe Dashboard.
              </p>
            </div>
          ) : isPending ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Setup Incomplete</span>
              </div>
              {connectStatus?.requiresAction && connectStatus?.currentlyDue?.length > 0 && (
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
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
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700">
                <h4 className="font-medium mb-2">How it works</h4>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
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

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Earnings</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{formatCurrency(earningsData?.paidOutEarnings || 0)}</div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Income Breakdown Chart */}
      {transactionData?.summary && (
        <IncomeBreakdownChart summary={transactionData.summary} />
      )}

      {/* Transaction History Table */}
      <TransactionHistoryTable />

      {/* Release Sales Analytics */}
      <ReleaseSalesAnalytics />

      {/* Info about earnings source */}
      {!isConnected && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-300 text-sm sm:text-base">Connect Stripe to receive payments</p>
                <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Until you connect your Stripe account, payments from release sales and bookings will be held by the platform. 
                  Connect your account above to start receiving payments directly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
