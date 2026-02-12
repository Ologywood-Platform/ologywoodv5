import React, { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Mail, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function VerifyEmail() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  // Extract email from query params
  useEffect(() => {
    const params = new URLSearchParams(search);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [search]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const verifyMutation = trpc.emailChange.verifyChange.useMutation();
  const resendMutation = trpc.emailChange.requestChange.useMutation();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      toast.error('Please enter the verification code');
      return;
    }

    if (!email) {
      toast.error('Email address not found. Please try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyMutation.mutateAsync({
        email,
        token: verificationCode,
      });

      setVerificationSuccess(true);
      toast.success('Email verified successfully!');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error: any) {
      toast.error(error?.message || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      toast.error('Email address not found');
      return;
    }

    try {
      await resendMutation.mutateAsync({ newEmail: email });
      toast.success('Verification code sent to your email');
      setResendCountdown(60); // 60 second cooldown
      setVerificationCode('');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to resend code');
    }
  };

  if (verificationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200 bg-green-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-green-900">Email Verified!</CardTitle>
            <CardDescription className="text-green-700">
              Your email has been successfully verified
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-green-700">
              Redirecting you to your dashboard...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-purple-100 rounded-full">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            Enter the verification code sent to your email
          </CardDescription>
        </CardHeader>

        <CardContent>
          {email && (
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Verification code sent to: <strong>{email}</strong>
              </p>
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={isSubmitting}
                className="text-center text-lg tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500">
                Check your email for the verification code. It expires in 24 hours.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting || !verificationCode.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendCode}
              disabled={resendCountdown > 0 || resendMutation.isPending}
            >
              {resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : 'Resend Code'}
            </Button>
          </div>

          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-semibold mb-1">Having trouble?</p>
              <p>Check your spam folder or try requesting a new code.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyEmail;
