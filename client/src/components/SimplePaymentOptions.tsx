/**
 * Simple Payment Options Component
 * Displays two simple payment options: Deposit (50%) or Full Payment
 * Keeps the UX clean and easy to understand
 */

import React, { useState } from 'react';
import { Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface SimplePaymentOptionsProps {
  bookingId: number;
  totalFee: number;
  artistName: string;
  venueName: string;
  eventDate: string;
}

export function SimplePaymentOptions({
  bookingId,
  totalFee,
  artistName,
  venueName,
  eventDate,
}: SimplePaymentOptionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<'deposit' | 'full' | null>(null);

  const depositAmount = totalFee * 0.5;
  const finalPaymentAmount = totalFee * 0.5;

  // TRPC mutations for deposit and full payment
  const createDepositCheckout = trpc.payment.createDepositCheckout.useMutation();
  const createFullCheckout = trpc.payment.createFullPaymentCheckout.useMutation();

  const handleDepositPayment = async () => {
    setLoading(true);
    setError(null);
    setSelectedOption('deposit');

    try {
      const result = await createDepositCheckout.mutateAsync({
        bookingId,
      });

      if (result.url) {
        window.open(result.url, '_blank');
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process deposit payment');
      setSelectedOption(null);
    } finally {
      setLoading(false);
    }
  };

  const handleFullPayment = async () => {
    setLoading(true);
    setError(null);
    setSelectedOption('full');

    try {
      const result = await createFullCheckout.mutateAsync({
        bookingId,
      });

      if (result.url) {
        window.open(result.url, '_blank');
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process full payment');
      setSelectedOption(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Payment Option</h2>
        <p className="text-gray-600">Total booking fee: <span className="font-semibold text-gray-900">${totalFee.toFixed(2)}</span></p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Payment Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Deposit Option */}
        <button
          onClick={handleDepositPayment}
          disabled={loading}
          className={`p-4 border-2 rounded-lg transition-all text-left ${
            selectedOption === 'deposit'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Pay Deposit Now</h3>
              <p className="text-sm text-gray-600">50% upfront, 50% before event</p>
            </div>
            {selectedOption === 'deposit' && loading && (
              <Loader className="w-5 h-5 text-blue-600 animate-spin" />
            )}
          </div>
          <p className="text-lg font-bold text-blue-600">${depositAmount.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Final payment due by {new Date(eventDate).toLocaleDateString()}</p>
        </button>

        {/* Full Payment Option */}
        <button
          onClick={handleFullPayment}
          disabled={loading}
          className={`p-4 border-2 rounded-lg transition-all text-left ${
            selectedOption === 'full'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400 bg-white'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Pay Full Amount</h3>
              <p className="text-sm text-gray-600">Complete payment now</p>
            </div>
            {selectedOption === 'full' && loading && (
              <Loader className="w-5 h-5 text-green-600 animate-spin" />
            )}
          </div>
          <p className="text-lg font-bold text-green-600">${totalFee.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Booking fully secured</p>
        </button>
      </div>

      {/* Info Text */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">💡 Tip:</span> Paying the deposit now reserves your date. You'll receive a reminder for the final payment.
        </p>
      </div>
    </div>
  );
}
