import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const resetPasswordMutation = ((trpc.auth as any)?.resetPassword?.useMutation?.() || { mutateAsync: async () => {} }) as any;

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. No token provided.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPasswordMutation.mutateAsync({
        token,
        newPassword,
      });

      if (result.success) {
        setIsSuccess(true);
        toast.success('Password reset successfully!');
        // Redirect to home after 3 seconds
        setTimeout(() => {
          setLocation('/');
        }, 3000);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to reset password. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {isSuccess ? (
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            ) : error && !token ? (
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-purple-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">
            {isSuccess ? 'Password Reset!' : 'Set New Password'}
          </CardTitle>
          <CardDescription>
            {isSuccess
              ? 'Your password has been updated. You are now logged in.'
              : error && !token
                ? 'This reset link is invalid.'
                : 'Enter your new password below.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSuccess ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                Redirecting you to the homepage...
              </p>
              <Button
                className="w-full"
                onClick={() => setLocation('/')}
              >
                Go to Homepage
              </Button>
            </div>
          ) : error && !token ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-red-600">{error}</p>
              <Button
                className="w-full"
                onClick={() => setLocation('/')}
              >
                Go to Homepage
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <PasswordInput
                  id="new-password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  autoFocus
                />
                <PasswordStrengthIndicator password={newPassword} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <PasswordInput
                  id="confirm-password"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
