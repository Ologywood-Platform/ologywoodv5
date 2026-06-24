import React, { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Mail, Loader2, XCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export function VerifyEmail() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'resend'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

  const verifyMutation = (trpc.auth as any).verifyEmail.useMutation();
  const resendMutation = (trpc.auth as any).resendConfirmationEmail.useMutation();

  // Extract token and email from query params
  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get('token');
    const emailParam = params.get('email');

    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
      setResendEmail(decodeURIComponent(emailParam));
    }

    if (token) {
      // Auto-verify using the token from the email link
      verifyMutation.mutateAsync({ token })
        .then((result: any) => {
          if (result.success) {
            setStatus('success');
            if (result.email) setEmail(result.email);
            toast.success('Email verified successfully!');
            // Redirect to role selection / account setup after 3 seconds
            setTimeout(() => {
              window.location.href = '/get-started';
            }, 3000);
          } else {
            setStatus('error');
            setErrorMessage('Verification failed. The link may have expired.');
          }
        })
        .catch((err: any) => {
          setStatus('error');
          setErrorMessage(err?.message || 'Invalid or expired verification link. Please request a new one.');
        });
    } else {
      // No token — show resend form
      setStatus('resend');
    }
  }, [search]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      const result = await resendMutation.mutateAsync({ email: resendEmail });
      if (result.success) {
        toast.success('Verification email sent! Check your inbox.');
        setResendCountdown(60);
      } else {
        toast.error(result.message || 'Failed to send verification email');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send verification email. Please try again.');
    }
  };

  // Verifying state — auto-verifying via token
  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
              </div>
            </div>
            <CardTitle>Verifying Your Email</CardTitle>
            <CardDescription>
              Please wait while we confirm your email address...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Success state
  if (status === 'success') {
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
            {email && (
              <p className="text-sm text-green-700">
                <strong>{email}</strong> is now verified.
              </p>
            )}
            <p className="text-sm text-green-600">
              Redirecting you to set up your account...
            </p>
            <div className="flex justify-center">
              <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
            </div>
            <Button
              className="mt-2 bg-purple-600 hover:bg-purple-700"
              onClick={() => window.location.href = '/get-started'}
            >
              Continue to Account Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state — token was invalid or expired
  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-red-900">Verification Failed</CardTitle>
            <CardDescription className="text-red-600">
              {errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Enter your email below to receive a new verification link.
            </p>
            <form onSubmit={handleResend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend-email">Email Address</Label>
                <Input
                  id="resend-email"
                  type="email"
                  placeholder="Enter your email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-700"
                disabled={resendMutation.isPending || resendCountdown > 0 || !resendEmail.trim()}
              >
                {resendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : resendCountdown > 0 ? (
                  `Resend in ${resendCountdown}s`
                ) : (
                  'Send New Verification Link'
                )}
              </Button>
            </form>
            <div className="text-center pt-2">
              <Button variant="link" onClick={() => navigate('/')}>
                Back to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Resend state — no token in URL, user needs to request a new link
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
            Check your inbox for a verification link from Ologywood
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {email && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Verification link sent to: <strong>{email}</strong>
              </p>
            </div>
          )}

          <p className="text-sm text-gray-600 text-center">
            Click the "Confirm Email Address" button in the email we sent you.
            If you don't see it, check your spam folder.
          </p>

          <div className="pt-4 border-t space-y-3">
            <p className="text-sm text-gray-600 text-center">
              Didn't receive the email?
            </p>
            <form onSubmit={handleResend} className="space-y-3">
              {!email && (
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                  />
                </div>
              )}
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={resendMutation.isPending || resendCountdown > 0 || !resendEmail.trim()}
              >
                {resendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : resendCountdown > 0 ? (
                  `Resend in ${resendCountdown}s`
                ) : (
                  'Resend Verification Email'
                )}
              </Button>
            </form>
          </div>

          <div className="pt-2">
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-700 text-center font-medium">
                You must verify your email before setting up your profile.
              </p>
              <p className="text-xs text-purple-600 text-center mt-1">
                This helps us keep the platform safe from spam and fake accounts.
              </p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-semibold mb-1">Having trouble?</p>
              <p>Check your spam folder or contact support@ologywood.com for help.</p>
            </div>
          </div>

          <div className="text-center">
            <Button variant="link" onClick={() => navigate('/')}>
              Back to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default VerifyEmail;
