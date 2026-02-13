import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Settings,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/utils';

export function ArtistEarningsDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showPayoutSettings, setShowPayoutSettings] = useState(false);

  // Fetch earnings data
  const { data: earnings, isLoading: earningsLoading } = trpc.earnings.getArtistEarnings.useQuery();
  const { data: recentTransactions } = trpc.earnings.getRecentTransactions.useQuery();
  const { data: connectStatus } = trpc.stripe.getConnectStatus.useQuery();

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
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Earnings</h1>
              <p className="text-sm text-slate-600">Track your income and payouts</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPayoutSettings(!showPayoutSettings)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Payouts</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {showPayoutSettings ? (
          <PayoutSettings
            connectStatus={connectStatus}
            onBack={() => setShowPayoutSettings(false)}
          />
        ) : (
          <div className="space-y-6">
            {/* Earnings Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <p className="text-xs text-slate-500 mt-1">All time</p>
                </CardContent>
              </Card>

              {/* Pending Earnings */}
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

              {/* Ready to Payout */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Ready
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">
                    {earningsLoading ? '...' : formatCurrency(earnings?.completedEarnings || 0)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Ready for payout</p>
                </CardContent>
              </Card>

              {/* Paid Out */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Paid Out
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {earningsLoading ? '...' : formatCurrency(earnings?.paidOutEarnings || 0)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Transferred to account</p>
                </CardContent>
              </Card>
            </div>

            {/* Stripe Connect Status Alert */}
            {!connectStatus?.isConnected && (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <CardTitle className="text-base">Connect Your Payout Account</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-700 mb-4">
                    Connect your bank account to receive payouts. You'll need to complete verification
                    with Stripe.
                  </p>
                  <Button
                    onClick={() => setShowPayoutSettings(true)}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Connect Account
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Recent Transactions */}
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => toggleSection('transactions')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                    <CardDescription>
                      {recentTransactions?.length || 0} transaction(s) this month
                    </CardDescription>
                  </div>
                  {expandedSection === 'transactions' ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>

              {expandedSection === 'transactions' && (
                <CardContent>
                  {recentTransactions && recentTransactions.length > 0 ? (
                    <div className="space-y-3">
                      {recentTransactions.map((tx: any) => (
                        <div
                          key={tx.bookingId}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div>
                            <p className="font-semibold text-sm">{tx.venueName}</p>
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
                      No transactions yet. Complete your first booking to see earnings.
                    </p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Payout Schedule Info */}
            <Card>
              <CardHeader
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => toggleSection('schedule')}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Payout Schedule</CardTitle>
                  {expandedSection === 'schedule' ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </div>
              </CardHeader>

              {expandedSection === 'schedule' && (
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-sm mb-2">How Payouts Work</h4>
                      <ul className="text-sm text-slate-700 space-y-2">
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">1.</span>
                          <span>Booking is completed and marked as paid</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">2.</span>
                          <span>Funds are held for 7 days (fraud protection)</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">3.</span>
                          <span>After 7 days, funds become available for payout</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="font-bold text-primary">4.</span>
                          <span>Payouts are processed every Monday to your bank account</span>
                        </li>
                      </ul>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-sm mb-2 text-blue-900">Platform Fee</h4>
                      <p className="text-sm text-blue-800">
                        We charge a 1% platform fee on each booking. This helps us maintain the platform
                        and provide support.
                      </p>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Payout Settings Component
function PayoutSettings({ connectStatus, onBack }: any) {
  const { data: onboardingLink, isLoading } = trpc.stripe.getOnboardingLink.useQuery();

  const handleConnect = () => {
    if (onboardingLink) {
      window.open(onboardingLink, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 mb-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Earnings
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Payout Account</CardTitle>
          <CardDescription>Manage your bank account and payout settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {connectStatus?.isConnected ? (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Account Connected</h4>
              </div>
              <p className="text-sm text-green-800 mb-4">
                Your payout account is active. Funds will be transferred every Monday.
              </p>
              {connectStatus?.chargesEnabled && (
                <div className="text-xs text-green-700 p-2 bg-green-100 rounded">
                  ✓ Charges enabled • ✓ Payouts enabled
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <h4 className="font-semibold text-amber-900">No Account Connected</h4>
              </div>
              <p className="text-sm text-amber-800 mb-4">
                Connect your bank account to receive payouts from your bookings.
              </p>
              <Button
                onClick={handleConnect}
                disabled={isLoading}
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                {isLoading ? 'Loading...' : 'Connect with Stripe'}
              </Button>
            </div>
          )}

          {/* Account ID Display */}
          {connectStatus?.stripeAccountId && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-xs font-medium text-slate-600 mb-2">Stripe Account ID</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono text-slate-700 flex-1 truncate">
                  {connectStatus.stripeAccountId}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(connectStatus.stripeAccountId);
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
