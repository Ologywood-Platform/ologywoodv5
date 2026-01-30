import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Download, Mail, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  const { data: booking } = trpc.booking.getById.useQuery(
    { id: parseInt(bookingId || '0', 10) },
    { enabled: !!bookingId }
  );
  
  const { data: paymentHistory } = trpc.payment.getHistory.useQuery(
    { bookingId: parseInt(bookingId || '0', 10) },
    { enabled: !!bookingId }
  );

  useEffect(() => {
    if (booking && paymentHistory) {
      setIsLoading(false);
    }
  }, [booking, paymentHistory]);

  const handleDownloadReceipt = () => {
    // Implementation would generate and download PDF receipt
    toast.success('Receipt downloaded');
  };

  const handleEmailReceipt = () => {
    // Implementation would send receipt via email
    toast.success('Receipt sent to email');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Booking Details */}
          {booking && (
            <div className="space-y-4">
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
                  <span className="font-semibold text-green-600">Confirmed</span>
                </div>
              </div>

              {/* Payment Summary */}
              {paymentHistory && (
                <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                  <h4 className="font-semibold text-sm">Payment Summary</h4>
                  {paymentHistory.depositPaidAt && (
                    <div className="flex justify-between text-sm">
                      <span>Deposit Paid:</span>
                      <span className="font-medium">
                        {new Date(paymentHistory.depositPaidAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {paymentHistory.fullPaymentPaidAt && (
                    <div className="flex justify-between text-sm">
                      <span>Full Payment Paid:</span>
                      <span className="font-medium">
                        {new Date(paymentHistory.fullPaymentPaidAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Next Steps */}
          <div className="p-4 bg-amber-50 rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Next Steps:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>✓ Your booking has been confirmed</li>
              <li>✓ A confirmation email has been sent</li>
              <li>✓ Check your email for event details</li>
              <li>✓ Review the contract and rider requirements</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleDownloadReceipt}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
            >
              <Download className="h-4 w-4" />
              Download Receipt
            </button>

            <button
              onClick={handleEmailReceipt}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
            >
              <Mail className="h-4 w-4" />
              Email Receipt
            </button>

            <Button
              onClick={() => navigate(`/booking/${bookingId}`)}
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

          {/* Support Message */}
          <div className="text-center text-xs text-gray-500">
            <p>Questions? Contact our support team at support@ologywood.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
