import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function RevertEmail() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'confirm' | 'processing' | 'success'>('confirm');

  // NOTE: emailChange router was removed during cleanup
  const revertMutation = { mutate: () => {}, mutateAsync: async (data: any) => ({ success: false, message: 'Router disabled' }), isPending: false };

  // Extract token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  const handleRevert = async () => {
    if (!token) {
      setError('No revert token provided. Please use the link from your email.');
      return;
    }

    setLoading(true);
    setStep('processing');
    setError('');

    try {
      const result = await revertMutation.mutateAsync({ token });

      if (result.success) {
        setSuccess(true);
        setStep('success');
        toast.success('Email change reverted successfully!');

        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        setError(result.message || 'Failed to revert email change');
        setStep('confirm');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while reverting your email');
      setStep('confirm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {step === 'confirm' && (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-purple-600" />
                </div>
                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                  Revert Email Change
                </h1>
                <p className="text-center text-gray-600">
                  Are you sure you want to revert your email address change? This action will restore your previous email address.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You have 48 hours from the time of your email change to use this revert link. After that, you'll need to contact support.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-600">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  disabled={loading}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleRevert}
                  disabled={loading || !token}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Revert'
                  )}
                </Button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">Processing...</h2>
              <p className="text-gray-600">Reverting your email address change...</p>
            </div>
          )}

          {step === 'success' && (
            <>
              <div className="mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
                  Email Reverted Successfully
                </h1>
                <p className="text-center text-gray-600">
                  Your email address has been reverted to your previous email. You'll receive a confirmation email shortly.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-800">
                  <strong>✓ Success:</strong> Your email change has been reverted. You can now log in with your previous email address.
                </p>
              </div>

              <p className="text-center text-sm text-gray-600 mb-6">
                Redirecting to dashboard in 3 seconds...
              </p>

              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Need help? <a href="/contact" className="text-purple-600 hover:text-purple-700 font-medium">Contact Support</a></p>
        </div>
      </div>
    </div>
  );
}
