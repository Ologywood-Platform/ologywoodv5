import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Home, HelpCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function PaymentFailure() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [, navigate] = useLocation();
  const [errorReason, setErrorReason] = useState('payment_declined');
  
  const { data: booking } = trpc.booking.getById.useQuery(
    { id: parseInt(bookingId || '0', 10) },
    { enabled: !!bookingId }
  );

  const retryPaymentMutation = trpc.payment.createDepositCheckout.useMutation({
    onSuccess: (result) => {
      if (result.url) {
        window.location.href = result.url;
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to retry payment');
    },
  });

  const handleRetryPayment = () => {
    retryPaymentMutation.mutate({ bookingId: parseInt(bookingId || '0', 10) });
  };

  const getErrorMessage = () => {
    switch (errorReason) {
      case 'payment_declined':
        return 'Your payment was declined. Please check your card details and try again.';
      case 'insufficient_funds':
        return 'Insufficient funds in your account. Please try another payment method.';
      case 'expired_card':
        return 'Your card has expired. Please use a different card.';
      case 'invalid_cvv':
        return 'The CVV code you entered is invalid. Please try again.';
      case 'network_error':
        return 'A network error occurred. Please check your connection and try again.';
      default:
        return 'Payment processing failed. Please try again or contact support.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-red-600">Payment Failed</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Message */}
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-sm text-red-700">{getErrorMessage()}</p>
          </div>

          {/* Booking Details */}
          {booking && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-semibold">#{booking.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Event Date:</span>
                <span className="font-semibold">
                  {new Date(booking.eventDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold text-amber-600">Payment Pending</span>
              </div>
            </div>
          )}

          {/* Troubleshooting Tips */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Troubleshooting Tips:
            </h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Check that your card details are correct</li>
              <li>• Ensure your card has not expired</li>
              <li>• Verify you have sufficient funds</li>
              <li>• Try a different payment method</li>
              <li>• Contact your bank if issues persist</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRetryPayment}
              disabled={retryPaymentMutation.isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {retryPaymentMutation.isPending ? 'Processing...' : 'Retry Payment'}
            </Button>

            <Button
              onClick={() => navigate(`/booking/${bookingId}`)}
              variant="outline"
              className="w-full"
            >
              View Booking Details
            </Button>

            <Button
              onClick={() => navigate('/dashboard')}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Support Section */}
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">Still having trouble?</p>
            <a
              href="mailto:support@ologywood.com"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact our support team
            </a>
          </div>

          {/* Payment Methods Info */}
          <div className="text-center text-xs text-gray-500">
            <p>We accept Visa, Mastercard, American Express, and Discover</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
