import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, DollarSign, Clock, CheckCircle, TrendingUp } from 'lucide-react';

export default function ArtistEarnings() {
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState<'bank_transfer' | 'stripe_connect' | 'manual'>('bank_transfer');
  const [showPayoutForm, setShowPayoutForm] = useState(false);

  // Fetch earnings data
  const { data: earningsData, isLoading: earningsLoading, refetch: refetchEarnings } = useQuery({
    queryKey: ['payout.getEarnings'],
    queryFn: async () => {
      // NOTE: payout router was removed during cleanup
      const result = { success: false, error: 'Payout router disabled', data: { completedEarnings: 0, recentEarnings: [], pendingEarnings: 0, paidOutEarnings: 0, totalEarnings: 0 } };
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  // Fetch payout history
  const { data: payoutHistory, isLoading: historyLoading, refetch: refetchHistory } = useQuery({
    queryKey: ['payout.getPayoutHistory'],
    queryFn: async () => {
      // NOTE: payout router was removed during cleanup
      const result = { success: false, error: 'Payout router disabled', data: [] };
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  // Request payout mutation
  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(payoutAmount);
      if (!amount || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      if (amount > (earningsData?.completedEarnings || 0)) {
        throw new Error('Insufficient balance for this payout amount');
      }

      // NOTE: payout router was removed during cleanup
      const result = { success: false, error: 'Payout router disabled', data: null };
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    onSuccess: () => {
      toast.success('Payout requested successfully');
      setPayoutAmount('');
      setShowPayoutForm(false);
      refetchEarnings();
      refetchHistory();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request payout');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPayoutStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" />, label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', icon: <TrendingUp className="w-4 h-4" />, label: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" />, label: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', icon: <AlertCircle className="w-4 h-4" />, label: 'Failed' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.icon}
        {config.label}
      </div>
    );
  };

  if (earningsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading earnings data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Earnings & Payouts</h1>
          <p className="text-gray-600">Manage your earnings and request payouts</p>
        </div>

        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Earnings */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Total Earnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(earningsData?.totalEarnings || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">All time earnings</p>
            </CardContent>
          </Card>

          {/* Pending Earnings */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(earningsData?.pendingEarnings || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">From upcoming events</p>
            </CardContent>
          </Card>

          {/* Completed Earnings */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(earningsData?.completedEarnings || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Ready to withdraw</p>
            </CardContent>
          </Card>

          {/* Paid Out */}
          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                Paid Out
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(earningsData?.paidOutEarnings || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Withdrawn to account</p>
            </CardContent>
          </Card>
        </div>

        {/* Request Payout Section */}
        <Card className="bg-white border-0 shadow-sm mb-8">
          <CardHeader>
            <CardTitle>Request Payout</CardTitle>
            <CardDescription>Withdraw your available earnings</CardDescription>
          </CardHeader>
          <CardContent>
            {!showPayoutForm ? (
              <Button
                onClick={() => setShowPayoutForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Request Payout
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Payout Amount</Label>
                  <div className="flex gap-2 mt-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-3 text-gray-500">$</span>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        className="pl-7"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setPayoutAmount(String(earningsData?.completedEarnings || 0))}
                    >
                      Max
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {formatCurrency(earningsData?.completedEarnings || 0)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="method">Payout Method</Label>
                  <Select value={payoutMethod} onValueChange={(value: any) => setPayoutMethod(value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="stripe_connect">Stripe Connect</SelectItem>
                      <SelectItem value="manual">Manual Review</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => requestPayoutMutation.mutate()}
                    disabled={requestPayoutMutation.isPending || !payoutAmount}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {requestPayoutMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowPayoutForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Your recent payout requests and transfers</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p className="text-gray-500">Loading payout history...</p>
            ) : payoutHistory && payoutHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payoutHistory.map((payout: any) => (
                    <TableRow key={payout.id} className="border-gray-200">
                      <TableCell className="text-sm">
                        {new Date(payout.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(payout.amount)}</TableCell>
                      <TableCell className="text-sm capitalize">{payout.payoutMethod.replace('_', ' ')}</TableCell>
                      <TableCell>{getPayoutStatusBadge(payout.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {payout.completedAt && `Completed ${new Date(payout.completedAt).toLocaleDateString()}`}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-8">No payout history yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Earnings from Bookings */}
        {earningsData?.recentEarnings && earningsData.recentEarnings.length > 0 && (
          <Card className="bg-white border-0 shadow-sm mt-8">
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
              <CardDescription>Your latest booking earnings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead>Event Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earningsData.recentEarnings.map((earning: any) => (
                    <TableRow key={earning.bookingId} className="border-gray-200">
                      <TableCell className="text-sm">
                        {new Date(earning.eventDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-semibold">{formatCurrency(earning.amount)}</TableCell>
                      <TableCell>
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                          {earning.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
