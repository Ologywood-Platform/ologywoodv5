import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { getLoginUrl } from '@/const';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, Users, Mail, AlertCircle } from 'lucide-react';

export function AcceptTeamInvite() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login_required'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const params = new URLSearchParams(search);
  const token = params.get('token') || '';

  // Fetch invitation preview (public endpoint - shows invited email without requiring login)
  const invitationPreview = trpc.team.getInvitationPreview.useQuery(
    { token },
    { enabled: !!token && !user }
  );

  const acceptMutation = trpc.team.acceptInvitation.useMutation({
    onSuccess: (data) => {
      setStatus('success');
    },
    onError: (err) => {
      setStatus('error');
      setErrorMessage(err.message);
    },
  });

  const declineMutation = trpc.team.declineInvitation.useMutation({
    onSuccess: () => {
      navigate('/');
    },
    onError: (err) => {
      setStatus('error');
      setErrorMessage(err.message);
    },
  });

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid invitation link');
      return;
    }
    if (!user) {
      setStatus('login_required');
      return;
    }
    // Auto-accept on load if user is logged in
    setStatus('loading');
    acceptMutation.mutate({ token });
  }, [token, user]);

  if (status === 'login_required') {
    const invitedEmail = invitationPreview.data?.email;
    const inviterName = invitationPreview.data?.inviterName;
    const teamRole = invitationPreview.data?.role;
    const returnPath = `/team/accept?token=${token}`;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-primary" />
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>
              {inviterName
                ? `${inviterName} has invited you to join their team${teamRole ? ` as ${teamRole}` : ''}`
                : 'You have been invited to join a team'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {invitedEmail && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 dark:text-blue-200">Invitation sent to:</p>
                  <p className="text-blue-700 dark:text-blue-300">{invitedEmail}</p>
                  <p className="text-blue-600/80 dark:text-blue-400/80 text-xs mt-1">
                    Please log in or sign up with this email address to accept the invitation.
                  </p>
                </div>
              </div>
            )}

            {invitationPreview.data?.expired && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">
                  This invitation has expired. Please ask the team owner to send a new invitation.
                </p>
              </div>
            )}

            {!invitationPreview.data?.expired && (
              <>
                <Button
                  className="w-full"
                  onClick={() => {
                    // Use getLoginUrl with returnPath to properly preserve the redirect
                    // through the Manus OAuth flow
                    const loginUrl = getLoginUrl(returnPath);
                    if (loginUrl) {
                      window.location.href = loginUrl;
                    } else {
                      // Fallback: navigate to homepage with redirect param
                      navigate(`/?redirect=${encodeURIComponent(returnPath)}`);
                    }
                  }}
                >
                  Log In to Accept
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    // For Google OAuth, pass returnPath so user comes back after login
                    window.location.href = `/api/auth/google?returnPath=${encodeURIComponent(returnPath)}`;
                  }}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Accepting invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-600" />
            <CardTitle>Welcome to the Team!</CardTitle>
            <CardDescription>You now have access to manage this artist's profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => navigate('/artist-dashboard')}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <XCircle className="h-12 w-12 mx-auto mb-3 text-destructive" />
          <CardTitle>Invitation Error</CardTitle>
          <CardDescription>{errorMessage || 'Something went wrong'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
