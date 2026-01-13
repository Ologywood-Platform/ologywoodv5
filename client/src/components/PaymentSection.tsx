import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, CreditCard, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSectionProps {
  bookingId: number;
  totalFee?: number;
  depositAmount?: number;
  paymentStatus?: string;
  isVenue: boolean;
}

export default function PaymentSection({
  bookingId,
  totalFee,
  depositAmount,
  paymentStatus,
  isVenue,
}: PaymentSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { data: paymentHistory } = trpc.payment.getHistory.useQuery({ bookingId });
  const createDepositCheckout = trpc.payment.createDepositCheckout.useMutation();
  const createFullPaymentCheckout = trpc.payment.createFullPaymentCheckout.useMutation();
  const requestRefund = trpc.payment.requestRefund.useMutation();
  
  const handleDepositPayment = async () => {
    setIsProcessing(true);
    try {
      const result = await createDepositCheckout.mutateAsync({ bookingId });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error('Failed to create payment session');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleFullPayment = async () => {
    setIsProcessing(true);
    try {
      const result = await createFullPaymentCheckout.mutateAsync({ bookingId });
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      toast.error('Failed to create payment session');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleRefund = async () => {
    if (!window.confirm('Are you sure you want to request a refund?')) return;
    
    try {
      await requestRefund.mutateAsync({ bookingId });
      toast.success('Refund requested successfully');
    } catch (error) {
      toast.error('Failed to request refund');
    }
  };
  
  const getPaymentStatusBadge = () => {
    switch (paymentStatus) {
      case 'unpaid':
        return <Badge variant="outline" className="bg-gray-100"><Clock className="h-3 w-3 mr-1" /> Unpaid</Badge>;
      case 'deposit_paid':
        return <Badge variant="outline" className="bg-blue-100"><CheckCircle2 className="h-3 w-3 mr-1" /> Deposit Paid</Badge>;
      case 'full_paid':
        return <Badge className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-orange-100"><RefreshCw className="h-3 w-3 mr-1" /> Refunded</Badge>;
      default:
        return null;
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
            <CardDescription>Manage booking payments and refunds</CardDescription>
          </div>
          {getPaymentStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="grid grid-cols-2 gap-4">
          {depositAmount && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Deposit Amount</div>
              <div className="text-lg font-semibold">${depositAmount.toFixed(2)}</div>
            </div>
          )}
          {totalFee && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Fee</div>
              <div className="text-lg font-semibold">${totalFee.toFixed(2)}</div>
            </div>
          )}
        </div>
        
        {/* Payment History */}
        {paymentHistory && (
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Payment History</h4>
            <div className="space-y-2 text-sm">
              {paymentHistory.depositPaidAt && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span>Deposit Paid</span>
                  <span className="text-green-700 font-medium">
                    {new Date(paymentHistory.depositPaidAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {paymentHistory.fullPaymentPaidAt && (
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span>Full Payment Paid</span>
                  <span className="text-green-700 font-medium">
                    {new Date(paymentHistory.fullPaymentPaidAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Payment Actions */}
        {isVenue && (
          <div className="space-y-3">
            {paymentStatus === 'unpaid' && depositAmount && (
              <Button
                onClick={handleDepositPayment}
                disabled={isProcessing || createDepositCheckout.isPending}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : `Pay Deposit - $${depositAmount.toFixed(2)}`}
              </Button>
            )}
            
            {paymentStatus === 'deposit_paid' && totalFee && (
              <Button
                onClick={handleFullPayment}
                disabled={isProcessing || createFullPaymentCheckout.isPending}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : `Pay Remaining - $${(totalFee - (depositAmount || 0)).toFixed(2)}`}
              </Button>
            )}
            
            {(paymentStatus === 'deposit_paid' || paymentStatus === 'full_paid') && (
              <Button
                onClick={handleRefund}
                variant="outline"
                disabled={requestRefund.isPending}
                className="w-full"
              >
                {requestRefund.isPending ? 'Processing...' : 'Request Refund'}
              </Button>
            )}
          </div>
        )}
        
        {/* Info Message */}
        <div className="flex gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>Payments are processed securely through Stripe. A receipt will be emailed after successful payment.</p>
        </div>
      </CardContent>
    </Card>
  );
}
