import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentDetails {
  bookingId: number;
  artistName: string;
  venueName: string;
  eventDate: string;
  totalAmount: number;
  depositPercentage?: number;
}

interface StripePaymentProcessorProps {
  payment: PaymentDetails;
  onPaymentSuccess?: (paymentId: string) => void;
  onPaymentError?: (error: string) => void;
}

export function StripePaymentProcessor({
  payment,
  onPaymentSuccess,
  onPaymentError,
}: StripePaymentProcessorProps) {
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'error'>('pending');
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const depositPercentage = payment.depositPercentage || 25;
  const depositAmount = (payment.totalAmount * depositPercentage) / 100;
  const remainingAmount = payment.totalAmount - depositAmount;

  const handleProcessPayment = async () => {
    setProcessing(true);
    setPaymentStatus('processing');

    try {
      // In production, this would call your backend to create a Stripe checkout session
      // For now, we'll simulate the payment flow
      
      toast.info('Redirecting to Stripe checkout...');
      
      // Simulate API call to create checkout session
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate successful payment
      const simulatedPaymentId = `pi_${Date.now()}`;
      setPaymentId(simulatedPaymentId);
      setPaymentStatus('success');

      toast.success('Payment processed successfully!');
      
      if (onPaymentSuccess) {
        onPaymentSuccess(simulatedPaymentId);
      }
    } catch (error) {
      setPaymentStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Payment processing failed';
      toast.error(errorMessage);
      
      if (onPaymentError) {
        onPaymentError(errorMessage);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = () => {
    setPaymentStatus('pending');
    setPaymentId(null);
    handleProcessPayment();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Booking Summary */}
        <div className="space-y-2 pb-4 border-b">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Artist:</span>
            <span className="font-semibold">{payment.artistName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Venue:</span>
            <span className="font-semibold">{payment.venueName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Event Date:</span>
            <span className="font-semibold">{new Date(payment.eventDate).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="space-y-3 pb-4 border-b">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Amount:</span>
            <span className="font-semibold">${payment.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-primary">
            <span>Deposit ({depositPercentage}%):</span>
            <span className="font-bold">${depositAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Remaining (Due on Event Day):</span>
            <span>${remainingAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Status */}
        {paymentStatus === 'success' && (
          <div className="p-4 bg-green-50 rounded-lg flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-semibold mb-1">Payment Successful</p>
              <p>Payment ID: {paymentId}</p>
              <p className="mt-1">A receipt has been sent to your email.</p>
            </div>
          </div>
        )}

        {paymentStatus === 'error' && (
          <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900">
              <p className="font-semibold mb-1">Payment Failed</p>
              <p>Please try again or contact support.</p>
            </div>
          </div>
        )}

        {/* Payment Button */}
        <Button
          onClick={paymentStatus === 'error' ? handleRetry : handleProcessPayment}
          disabled={processing || paymentStatus === 'success'}
          className="w-full"
          size="lg"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : paymentStatus === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Payment Complete
            </>
          ) : paymentStatus === 'error' ? (
            'Retry Payment'
          ) : (
            `Pay Deposit: $${depositAmount.toFixed(2)}`
          )}
        </Button>

        {/* Security Notice */}
        <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-900">
            Your payment is processed securely through Stripe. We never store your card information.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
