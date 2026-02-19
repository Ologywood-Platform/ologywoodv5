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

  // Fetch earnings data from payout router
  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ['payout.getEarnings'],
    queryFn: async () => {
      return await (trpc.payout.getEarnings as any)();
    },
  });

  // Fetch payout history from payout router
  const { data: payoutHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['payout.getPayoutHistory'],
    queryFn: async () => {
      return await (trpc.payout.getPayoutHistory as any)();
    },
  });

  // Request payout mutation using payout router
  const requestPayoutMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(payoutAmount);
      if (!amount || amount <= 0) {
        throw new Error('Please enter a valid amount');
      }
      if (amount > (earningsData?.completedEarnings || 0)) {
        throw new Error('Insufficient balance for this payout amount');
      }

      const result = await (trpc.payout.requestPayout as any)({
        amount,
        payoutMethod,
        bankAccountId: undefined,
      });
      return result;
    },
    onSuccess: () => {
      toast.success('Payout requested successfully');
      setPayoutAmount('');
      setShowPayoutForm(false);
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

  if (earningsLoading || historyLoading) {
    return <div className="text-center py-12">Loading earnings data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Earnings & Payouts</h1>
        <p className="text-gray-600 mt-2">Track your earnings and manage payout requests</p>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium text-gray-600">Completed Earnings</CardTitle>
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
            <CardTitle className="text-sm font-medium text-gray-600">Pending Earnings</CardTitle>
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

      {/* Request Payout Section */}
      <Card>
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
          <CardDescription>Request a payout of your completed earnings</CardDescription>
        </CardHeader>
        <CardContent>
          {!showPayoutForm ? (
            <Button onClick={() => setShowPayoutForm(true)}>Request Payout</Button>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  max={earningsData?.completedEarnings || 0}
                />
              </div>

              <div>
                <Label htmlFor="method">Payout Method</Label>
                <Select value={payoutMethod} onValueChange={(value: any) => setPayoutMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="stripe_connect">Stripe Connect</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => requestPayoutMutation.mutate()}
                  disabled={requestPayoutMutation.isPending || !payoutAmount}
                >
                  {requestPayoutMutation.isPending ? 'Processing...' : 'Submit Request'}
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
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>View your past payout requests and status</CardDescription>
        </CardHeader>
        <CardContent>
          {payoutHistory && payoutHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date Requested</TableHead>
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
    </div>
  );
}
