import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface EmailVerificationModalProps {
  isOpen: boolean;
  currentEmail: string;
  onClose: () => void;
  onSuccess: (newEmail: string) => void;
}

export function EmailVerificationModal({
  isOpen,
  currentEmail,
  onClose,
  onSuccess,
}: EmailVerificationModalProps) {
  const [, navigate] = useLocation();
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [newEmail, setNewEmail] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const requestEmailChange = trpc.emailChange.requestChange.useMutation();
  const verifyEmailChange = trpc.emailChange.verifyChange.useMutation();

  const handleRequestChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!newEmail || newEmail === currentEmail) {
        setError('Please enter a different email address');
        setLoading(false);
        return;
      }

      const result = await requestEmailChange.mutateAsync({
        newEmail,
      });

      if (result.success) {
        toast.success('Verification code sent to your email!');
        // Redirect to verify-email page with email parameter
        onClose();
        navigate(`/verify-email?email=${encodeURIComponent(newEmail)}`);
      } else {
        setError(result.message || 'Failed to send verification email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!verificationToken) {
        setError('Please enter the verification code');
        setLoading(false);
        return;
      }

      const result = await verifyEmailChange.mutateAsync({
        token: verificationToken,
      });

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess(newEmail);
          onClose();
        }, 1500);
      } else {
        setError(result.message || 'Failed to verify email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Change Email Address</h2>

        {step === 'request' ? (
          <form onSubmit={handleRequestChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Email
              </label>
              <input
                type="email"
                value={currentEmail}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Email Address
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter your new email"
                disabled={loading}
                className="w-full"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600">
                  Verification email sent to {newEmail}
                </span>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                A verification link will be sent to your new email address. You'll need to confirm it within 24 hours.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !newEmail}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Verification Email'
                )}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyChange} className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                We've sent a verification code to <strong>{newEmail}</strong>. Please check your email and enter the code below.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <Input
                type="text"
                value={verificationToken}
                onChange={(e) => setVerificationToken(e.target.value)}
                placeholder="Enter verification code"
                disabled={loading}
                className="w-full font-mono"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-600">Email verified successfully!</span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep('request');
                  setError('');
                  setVerificationToken('');
                }}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loading || !verificationToken}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
