import { useEffect, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, Users } from 'lucide-react';

export function AcceptTeamInvite() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login_required'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const params = new URLSearchParams(search);
  const token = params.get('token') || '';

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
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-primary" />
            <CardTitle>Team Invitation</CardTitle>
            <CardDescription>Please log in to accept this team invitation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={() => navigate(`/?redirect=/team/accept?token=${token}`)}>
              Log In to Accept
            </Button>
            <Button variant="outline" className="w-full" onClick={() => declineMutation.mutate({ token })}>
              Decline Invitation
            </Button>
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
