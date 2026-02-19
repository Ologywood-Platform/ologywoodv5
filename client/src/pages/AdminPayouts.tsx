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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle, Clock, DollarSign, Eye } from 'lucide-react';


export default function AdminPayouts() {
  const [selectedPayout, setSelectedPayout] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Fetch pending payouts
  const { data: payouts, isLoading, refetch } = useQuery({
    queryKey: ['admin.getPayouts'],
    queryFn: async () => {
      const result = await (trpc.admin.getPayouts as any)({
        status: 'pending',
        limit: 100,
        offset: 0,
      });
      return result.payouts || [];
    },
  });

  // Process payout mutation
  const processPayoutMutation = useMutation({
    mutationFn: async (payoutId: number) => {
      const result = await (trpc.admin.processPayout as any)({
        payoutId,
        action: 'approve',
        notes: 'Approved by admin',
      });
      return result;
    },
    onSuccess: () => {
      toast.success('Payout marked as processing');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to process payout');
    },
  });

  // Complete payout mutation
  const completePayoutMutation = useMutation({
    mutationFn: async (payoutId: number) => {
      const result = await (trpc.admin.processPayout as any)({
        payoutId,
        action: 'approve',
        notes: 'Completed by admin',
      });
      return result;
    },
    onSuccess: () => {
      toast.success('Payout marked as completed');
      setShowDetails(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to complete payout');
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; label: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      processing: { color: 'bg-blue-100 text-blue-800', label: 'Processing' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading payouts...</p>
      </div>
    );
  }

  const pendingCount = payouts?.filter((p: any) => p.status === 'pending').length || 0;
  const processingCount = payouts?.filter((p: any) => p.status === 'processing').length || 0;
  const totalAmount = payouts?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payout Management</h1>
          <p className="text-gray-600">Process and manage artist payouts</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Payouts */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Total Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">{payouts?.length || 0} payouts</p>
            </CardContent>
          </Card>

          {/* Pending Count */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                Pending Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{pendingCount}</p>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          {/* Processing Count */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">{processingCount}</p>
              <p className="text-xs text-gray-500 mt-1">In transfer</p>
            </CardContent>
          </Card>

          {/* Average Payout */}
          <Card className="bg-white border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Average Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency((payouts?.length || 0) > 0 ? totalAmount / (payouts?.length || 1) : 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per request</p>
            </CardContent>
          </Card>
        </div>

        {/* Payouts Table */}
        <Card className="bg-white border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Payout Requests</CardTitle>
            <CardDescription>Review and process artist payout requests</CardDescription>
          </CardHeader>
          <CardContent>
            {payouts && payouts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead>Artist</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout: any) => (
                    <TableRow key={payout.id} className="border-gray-200">
                      <TableCell className="font-medium">{payout.artistName || `Artist #${payout.artistId}`}</TableCell>
                      <TableCell className="font-semibold text-lg">{formatCurrency(payout.amount)}</TableCell>
                      <TableCell className="text-sm capitalize">{payout.payoutMethod.replace('_', ' ')}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(payout.requestedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog open={showDetails && selectedPayout?.id === payout.id} onOpenChange={setShowDetails}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedPayout(payout)}
                                className="gap-1"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                              <DialogHeader>
                                <DialogTitle>Payout Details</DialogTitle>
                                <DialogDescription>Review and process this payout request</DialogDescription>
                              </DialogHeader>
                              {selectedPayout && (
                                <div className="space-y-4">
                                  <div>
                                    <Label className="text-xs text-gray-500">Artist</Label>
                                    <p className="font-medium">{selectedPayout.artistName || `Artist #${selectedPayout.artistId}`}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-500">Amount</Label>
                                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(selectedPayout.amount)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-500">Payout Method</Label>
                                    <p className="font-medium capitalize">{selectedPayout.payoutMethod.replace('_', ' ')}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-500">Requested Date</Label>
                                    <p className="font-medium">{new Date(selectedPayout.requestedAt).toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-gray-500">Current Status</Label>
                                    <p className="font-medium">{getStatusBadge(selectedPayout.status)}</p>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex gap-2 pt-4 border-t">
                                    {selectedPayout.status === 'pending' && (
                                      <Button
                                        onClick={() => processPayoutMutation.mutate(selectedPayout.id)}
                                        disabled={processPayoutMutation.isPending}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                                      >
                                        {processPayoutMutation.isPending ? 'Processing...' : 'Process Payout'}
                                      </Button>
                                    )}
                                    {selectedPayout.status === 'processing' && (
                                      <Button
                                        onClick={() => completePayoutMutation.mutate(selectedPayout.id)}
                                        disabled={completePayoutMutation.isPending}
                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                      >
                                        {completePayoutMutation.isPending ? 'Completing...' : 'Mark Completed'}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>

                          {payout.status === 'pending' && (
                            <Button
                              onClick={() => processPayoutMutation.mutate(payout.id)}
                              disabled={processPayoutMutation.isPending}
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              Process
                            </Button>
                          )}
                          {payout.status === 'processing' && (
                            <Button
                              onClick={() => completePayoutMutation.mutate(payout.id)}
                              disabled={completePayoutMutation.isPending}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Complete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-8">No payouts to process</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
