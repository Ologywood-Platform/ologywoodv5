import { useEffect, useMemo } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { CheckCircle2, Clock3, Crown, XCircle } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function FanClubCheckoutResult({ cancelled = false }: { cancelled?: boolean }) {
  const [, navigate] = useLocation();
  const search = useSearch();
  const sessionId = useMemo(() => new URLSearchParams(search).get('session_id'), [search]);
  const membershipsQuery = trpc.fanClub.listMyMemberships.useQuery(undefined, {
    enabled: !cancelled,
    refetchInterval: (query) => {
      const memberships = query.state.data;
      return memberships?.some((membership: any) => membership.status === 'active') ? false : 2000;
    },
  });

  useEffect(() => {
    if (cancelled) return;
    const timeout = window.setTimeout(() => membershipsQuery.refetch(), 8000);
    return () => window.clearTimeout(timeout);
  }, [cancelled]);

  const hasActiveMembership = membershipsQuery.data?.some((membership: any) => membership.status === 'active');
  const confirming = !cancelled && !hasActiveMembership && (membershipsQuery.isLoading || membershipsQuery.isFetching);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-950 dark:to-purple-950/30">
      <SiteHeader />
      <main className="mx-auto flex max-w-2xl items-center px-4 py-16">
        <Card className="w-full shadow-lg">
          <CardContent className="py-12 text-center">
            {cancelled ? (
              <>
                <XCircle className="mx-auto mb-5 h-14 w-14 text-slate-500" />
                <h1 className="text-3xl font-bold">Fan Club checkout cancelled</h1>
                <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                  No membership was created. You can return to the creator’s profile whenever you’re ready.
                </p>
              </>
            ) : hasActiveMembership ? (
              <>
                <CheckCircle2 className="mx-auto mb-5 h-14 w-14 text-emerald-600" />
                <h1 className="text-3xl font-bold">You’re in the Fan Club</h1>
                <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                  Your membership is active. Open My Ology to see your membership and member access.
                </p>
              </>
            ) : (
              <>
                {confirming ? <Clock3 className="mx-auto mb-5 h-14 w-14 animate-pulse text-purple-700" /> : <Crown className="mx-auto mb-5 h-14 w-14 text-purple-700" />}
                <h1 className="text-3xl font-bold">Payment received</h1>
                <p className="mx-auto mt-3 max-w-md text-muted-foreground">
                  {sessionId
                    ? 'Stripe has returned you to OlogyWood. We are confirming your membership now; this page will update automatically.'
                    : 'We are confirming your membership now. Open My Ology shortly to see your access.'}
                </p>
              </>
            )}
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {!cancelled && <Button onClick={() => navigate('/my-ology')}>Open My Ology</Button>}
              <Button asChild variant="outline"><Link href="/browse">Browse creators</Link></Button>
              <Button asChild variant="ghost"><Link href="/">Back home</Link></Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
