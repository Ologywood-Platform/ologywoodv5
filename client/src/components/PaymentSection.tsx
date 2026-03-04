import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Clock, CreditCard, DollarSign, ArrowRight, Shield, Banknote } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentSectionProps {
  bookingId: number;
  totalFee?: number;
  depositAmount?: number;
  paymentStatus?: string;
  isVenue: boolean;
  bookingStatus?: string;
  depositPaidAt?: string | null;
  finalPaidAt?: string | null;
}

export default function PaymentSection({
  bookingId,
  totalFee = 0,
  depositAmount,
  paymentStatus = 'unpaid',
  isVenue,
  bookingStatus = 'pending',
  depositPaidAt,
  finalPaidAt,
}: PaymentSectionProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate amounts
  const deposit = depositAmount || Math.round(totalFee / 2 * 100) / 100;
  const remaining = Math.round((totalFee - deposit) * 100) / 100;

  // Handle Stripe checkout redirect
  const handlePayment = async (paymentType: 'deposit' | 'final') => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/booking-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId, paymentType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        toast.info('Redirecting to secure payment page...');
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create payment session');
    } finally {
      setIsProcessing(false);
    }
  };

  // Payment status badge
  const getStatusBadge = () => {
    switch (paymentStatus) {
      case 'unpaid':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            <Clock className="h-3 w-3 mr-1" /> Awaiting Payment
          </Badge>
        );
      case 'deposit_paid':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Deposit Paid
          </Badge>
        );
      case 'fully_paid':
        return (
          <Badge className="bg-green-600 text-white">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Fully Paid
          </Badge>
        );
      case 'refunded':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" /> Refunded
          </Badge>
        );
      default:
        return null;
    }
  };

  // Payment timeline steps
  const getTimelineSteps = () => {
    const steps = [
      {
        label: 'Booking Accepted',
        status: bookingStatus !== 'pending' ? 'complete' : 'current',
        detail: bookingStatus !== 'pending' ? 'Artist confirmed' : 'Awaiting artist response',
      },
      {
        label: '50% Deposit',
        amount: deposit,
        status: paymentStatus === 'deposit_paid' || paymentStatus === 'fully_paid' ? 'complete' :
                bookingStatus !== 'pending' && paymentStatus === 'unpaid' ? 'current' : 'upcoming',
        detail: depositPaidAt ? `Paid ${new Date(depositPaidAt).toLocaleDateString()}` :
                paymentStatus === 'unpaid' && bookingStatus !== 'pending' ? 'Ready to pay' : 'Pending',
      },
      {
        label: 'Remaining Balance',
        amount: remaining,
        status: paymentStatus === 'fully_paid' ? 'complete' :
                paymentStatus === 'deposit_paid' ? 'current' : 'upcoming',
        detail: finalPaidAt ? `Paid ${new Date(finalPaidAt).toLocaleDateString()}` :
                paymentStatus === 'deposit_paid' ? 'Ready to pay' : 'After deposit',
      },
      {
        label: 'Fully Paid',
        status: paymentStatus === 'fully_paid' ? 'complete' : 'upcoming',
        detail: paymentStatus === 'fully_paid' ? 'All payments received' : 'Awaiting payments',
      },
    ];
    return steps;
  };

  const steps = getTimelineSteps();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment
            </CardTitle>
            <CardDescription>
              {isVenue ? 'Make payments to confirm and complete your booking' : 'Track payment status for this booking'}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-xs text-gray-500 mb-1">Total Fee</div>
            <div className="text-lg font-bold">${totalFee.toFixed(2)}</div>
          </div>
          <div className={`p-3 rounded-lg text-center ${paymentStatus === 'deposit_paid' || paymentStatus === 'fully_paid' ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className="text-xs text-gray-500 mb-1">Deposit (50%)</div>
            <div className={`text-lg font-bold ${paymentStatus === 'deposit_paid' || paymentStatus === 'fully_paid' ? 'text-green-700' : ''}`}>
              ${deposit.toFixed(2)}
            </div>
            {(paymentStatus === 'deposit_paid' || paymentStatus === 'fully_paid') && (
              <CheckCircle2 className="h-3 w-3 text-green-600 mx-auto mt-1" />
            )}
          </div>
          <div className={`p-3 rounded-lg text-center ${paymentStatus === 'fully_paid' ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className="text-xs text-gray-500 mb-1">Remaining</div>
            <div className={`text-lg font-bold ${paymentStatus === 'fully_paid' ? 'text-green-700' : ''}`}>
              ${remaining.toFixed(2)}
            </div>
            {paymentStatus === 'fully_paid' && (
              <CheckCircle2 className="h-3 w-3 text-green-600 mx-auto mt-1" />
            )}
          </div>
        </div>

        {/* Payment Timeline */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold mb-3">Payment Timeline</h4>
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                {/* Timeline dot and line */}
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full mt-1 ${
                    step.status === 'complete' ? 'bg-green-500' :
                    step.status === 'current' ? 'bg-blue-500 ring-4 ring-blue-100' :
                    'bg-gray-200'
                  }`} />
                  {i < steps.length - 1 && (
                    <div className={`w-0.5 h-8 ${
                      step.status === 'complete' ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
                {/* Step content */}
                <div className="pb-4 -mt-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      step.status === 'complete' ? 'text-green-700' :
                      step.status === 'current' ? 'text-blue-700' :
                      'text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                    {step.amount !== undefined && (
                      <span className="text-xs text-gray-500">${step.amount.toFixed(2)}</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">{step.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VENUE: Payment Action Buttons */}
        {isVenue && (
          <div className="space-y-3">
            {/* Pay Deposit Button */}
            {paymentStatus === 'unpaid' && bookingStatus !== 'pending' && (
              <Button
                onClick={() => handlePayment('deposit')}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                size="lg"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Pay 50% Deposit — ${deposit.toFixed(2)}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            )}

            {/* Pay Remaining Balance Button */}
            {paymentStatus === 'deposit_paid' && (
              <Button
                onClick={() => handlePayment('final')}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                size="lg"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Banknote className="h-5 w-5" />
                    Pay Remaining Balance — ${remaining.toFixed(2)}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            )}

            {/* Waiting for artist to accept */}
            {paymentStatus === 'unpaid' && bookingStatus === 'pending' && (
              <div className="flex gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>Waiting for the artist to accept your booking request before payment can be made.</p>
              </div>
            )}

            {/* Fully paid message */}
            {paymentStatus === 'fully_paid' && (
              <div className="flex gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>All payments have been completed for this booking. Thank you!</p>
              </div>
            )}
          </div>
        )}

        {/* ARTIST: Payment Status Messages */}
        {!isVenue && (
          <div className="space-y-3">
            {paymentStatus === 'unpaid' && bookingStatus === 'pending' && (
              <div className="flex gap-2 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                <Clock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>Accept this booking to allow the venue to pay the deposit.</p>
              </div>
            )}

            {paymentStatus === 'unpaid' && bookingStatus !== 'pending' && (
              <div className="flex gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <DollarSign className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p>Booking accepted. Waiting for the venue to pay the 50% deposit (${deposit.toFixed(2)}).</p>
              </div>
            )}

            {paymentStatus === 'deposit_paid' && (
              <div className="flex gap-2 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Deposit received — ${deposit.toFixed(2)}</p>
                  <p className="mt-1">Remaining balance of ${remaining.toFixed(2)} is due before the event.</p>
                </div>
              </div>
            )}

            {paymentStatus === 'fully_paid' && (
              <div className="flex gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Fully paid — ${totalFee.toFixed(2)}</p>
                  <p className="mt-1">All payments received. Funds will be deposited to your connected Stripe account.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Security notice */}
        <div className="flex gap-2 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
          <Shield className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <p>All payments are processed securely through Stripe. Funds are held safely and transferred to the artist's connected account.</p>
        </div>
      </CardContent>
    </Card>
  );
}
