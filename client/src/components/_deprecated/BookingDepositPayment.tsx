import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface BookingDepositPaymentProps {
  bookingId: number;
  totalFee: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function BookingDepositPayment({
  bookingId,
  totalFee,
  onSuccess,
  onError,
}: BookingDepositPaymentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const depositAmount = Math.round((totalFee * 0.5) * 100) / 100; // 50% deposit
  const depositAmountCents = Math.round(depositAmount * 100); // Convert to cents for Stripe

  const createDepositPayment = ((trpc.booking as any)?.createDepositPayment?.useMutation?.() || { mutateAsync: async () => ({ clientSecret: '' }) });

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe is not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Step 1: Create payment intent on backend
      const paymentResponse = await createDepositPayment.mutateAsync({
        bookingId,
        amount: depositAmount,
      });

      if (!paymentResponse.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Step 2: Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const result = await stripe.confirmCardPayment(paymentResponse.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // Add billing details if needed
          },
        },
      });

      if (result.error) {
        setError(result.error.message || 'Payment failed');
        onError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent?.status === 'succeeded') {
        setSuccess(true);
        onSuccess();
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment processing failed';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Deposit Payment Successful</h3>
        </div>
        <p className="text-green-700">
          Your ${depositAmount.toFixed(2)} deposit has been processed. 
          The remaining ${(totalFee - depositAmount).toFixed(2)} will be due upon event completion.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Secure Deposit Payment</h3>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>Total Fee:</strong> ${totalFee.toFixed(2)}<br />
          <strong>Deposit Required (50%):</strong> ${depositAmount.toFixed(2)}<br />
          <strong>Due at Event:</strong> ${(totalFee - depositAmount).toFixed(2)}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-red-900">Payment Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handlePayment} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="border border-gray-300 rounded-lg p-4 bg-white">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full px-4 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Processing Payment...
            </>
          ) : (
            `Pay Deposit: $${depositAmount.toFixed(2)}`
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Your payment is secure and encrypted by Stripe.
        </p>
      </form>
    </div>
  );
}
