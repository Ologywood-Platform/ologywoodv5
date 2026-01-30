/**
 * Payment Testing UI Component
 * Allows admins to test payment redirects and verify payment flows
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export function PaymentTestingUI() {
  const [bookingId, setBookingId] = useState('');
  const [testResult, setTestResult] = useState<{
    type: 'success' | 'failure' | 'retry' | null;
    message: string;
    timestamp: Date;
  }>({ type: null, message: '', timestamp: new Date() });
  const [isLoading, setIsLoading] = useState(false);

  const handleTestPayment = async (testType: 'success' | 'failure' | 'retry') => {
    if (!bookingId || isNaN(Number(bookingId))) {
      setTestResult({
        type: null,
        message: 'Please enter a valid booking ID',
        timestamp: new Date(),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/payment/test/${testType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: Number(bookingId) }),
      });

      const data = await response.json();

      setTestResult({
        type: testType,
        message: data.message || `Payment ${testType} test completed successfully`,
        timestamp: new Date(),
      });
    } catch (error) {
      setTestResult({
        type: null,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Payment Testing Tools
          </CardTitle>
          <CardDescription>
            Test payment redirect flows and verify success/failure/retry scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Booking ID Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Booking ID</label>
            <Input
              type="number"
              placeholder="Enter booking ID to test"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
              disabled={isLoading}
              className="max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Enter the booking ID you want to test payment flows for
            </p>
          </div>

          {/* Test Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => handleTestPayment('success')}
              disabled={isLoading || !bookingId}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Test Success
            </Button>

            <Button
              onClick={() => handleTestPayment('failure')}
              disabled={isLoading || !bookingId}
              className="bg-red-600 hover:bg-red-700"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Test Failure
            </Button>

            <Button
              onClick={() => handleTestPayment('retry')}
              disabled={isLoading || !bookingId}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Test Retry
            </Button>
          </div>

          {/* Test Result */}
          {testResult.type && (
            <div
              className={`p-4 rounded-lg border ${
                testResult.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : testResult.type === 'failure'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {testResult.type === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                )}
                {testResult.type === 'failure' && (
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                )}
                {testResult.type === 'retry' && (
                  <RefreshCw className="h-5 w-5 text-yellow-600 mt-0.5" />
                )}
                <div>
                  <p className="font-medium capitalize">{testResult.type} Test Result</p>
                  <p className="text-sm text-muted-foreground mt-1">{testResult.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {testResult.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900 mb-2">Testing Instructions:</p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Enter a valid booking ID from your system</li>
              <li>• Click one of the test buttons to simulate payment scenarios</li>
              <li>• Success: Simulates a successful payment completion</li>
              <li>• Failure: Simulates a payment failure scenario</li>
              <li>• Retry: Simulates a payment retry scenario</li>
              <li>• Check your logs to verify the payment flow works correctly</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
