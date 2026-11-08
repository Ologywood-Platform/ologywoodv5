import { useMemo } from 'react';
import { Link } from 'wouter';
import { Crown, Loader2, Users } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function FanClubDiscovery() {
  const clubsQuery = trpc.fanClub.getDiscoverableClubs.useQuery();
  const clubs = useMemo(() => {
    const grouped = new Map<number, any>();
    for (const row of clubsQuery.data || []) {
      const existing = grouped.get(row.talentUserId);
      if (existing) existing.tiers.push(row);
      else grouped.set(row.talentUserId, { ...row, tiers: [row] });
    }
    return Array.from(grouped.values());
  }, [clubsQuery.data]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-slate-950 dark:via-slate-950 dark:to-purple-950/30">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 max-w-2xl">
          <Badge className="mb-3 gap-1 bg-purple-700"><Crown className="h-3 w-3" /> Fan Clubs</Badge>
          <h1 className="text-4xl font-bold tracking-tight">Support the creators you follow</h1>
          <p className="mt-3 text-muted-foreground">Join a creator’s monthly community for exclusive updates, behind-the-scenes content, and member perks.</p>
        </div>
        {clubsQuery.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-purple-700" /></div>
        ) : clubs.length === 0 ? (
          <Card className="border-dashed"><CardContent className="py-16 text-center"><Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" /><h2 className="text-xl font-semibold">No Fan Clubs are available yet</h2><p className="mt-2 text-muted-foreground">Check back soon or browse creators to find your next favorite.</p><Button asChild className="mt-6"><Link href="/browse">Browse creators</Link></Button></CardContent></Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club: any) => {
              const lowest = [...club.tiers].sort((a, b) => a.priceCents - b.priceCents)[0];
              return (
                <Card key={club.talentUserId} className="overflow-hidden transition-shadow hover:shadow-lg">
                  <CardHeader className="flex-row items-center gap-3 space-y-0">
                    {club.profilePhotoUrl ? <img src={club.profilePhotoUrl} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 text-purple-700"><Crown className="h-6 w-6" /></div>}
                    <div className="min-w-0"><CardTitle className="truncate text-lg">{club.artistName}</CardTitle><p className="text-sm text-muted-foreground">{club.tiers.length} membership tier{club.tiers.length === 1 ? '' : 's'}</p></div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Join from ${((lowest?.priceCents || lowest?.priceMonthly || 0) / 100).toFixed(2)}/month.</p>
                    <div className="mt-4 flex flex-wrap gap-2">{club.tiers.slice(0, 3).map((tier: any) => <Badge key={tier.id} variant="outline">{tier.name}</Badge>)}</div>
                    <Button asChild className="mt-6 w-full bg-purple-700 hover:bg-purple-800"><Link href={`/artist/${club.talentUserId}`}>View profile and join</Link></Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
