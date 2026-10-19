import { useEffect } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { Loader2, Music } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { SiteHeader } from '@/components/SiteHeader';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { ReleaseCard } from '@/components/ReleaseCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { setMetaTags } from '@/utils/seoMeta';
import { MUSIC_RELEASE_PUBLIC_ORIGIN, musicReleasePath, musicReleasePrice, parseMusicReleaseId } from '@shared/musicReleaseShare';

export default function MusicSingle() {
  const { slug } = useParams<{ slug: string }>();
  const id = parseMusicReleaseId(slug || '');
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const single = trpc.release.getPublicSingle.useQuery({ id: id || 0 }, { enabled: id !== null, retry: false, staleTime: 0, refetchOnMount: 'always' });
  const purchases = trpc.release.myPurchases.useQuery(undefined, { enabled: Boolean(user), retry: false });
  const ownerProfile = trpc.artist.getMyProfile.useQuery(undefined, { enabled: user?.role === 'artist' || user?.role === 'admin', retry: false });
  const team = trpc.team.getMyWorkspaceContext.useQuery(undefined, { enabled: user?.role === 'artist' || user?.role === 'admin', retry: false });
  const release = single.isError ? undefined : single.data;
  useEffect(() => {
    if (!release) {
      setMetaTags({ title: 'Single | OlogyWood', description: 'Discover independent music on OlogyWood.' });
      return;
    }
    const path = musicReleasePath(release.title, release.id);
    const url = MUSIC_RELEASE_PUBLIC_ORIGIN + path;
    const description = `${release.title} by ${release.artistName} — ${musicReleasePrice(release)}. ${release.description || 'Preview this single and support its creator on OlogyWood.'}`.slice(0, 240);
    setMetaTags({ title: `${release.title} | ${release.artistName} | OlogyWood`, description, ogUrl: url, canonical: url, ogType: 'product', ogImage: `${MUSIC_RELEASE_PUBLIC_ORIGIN}/api/og-image/music/${release.id}` });
    if (location !== path) navigate(path, { replace: true });
  }, [release, location, navigate]);
  const purchaseId = purchases.data?.find(purchase => purchase.releaseId === release?.id)?.id;
  const isOwner = Boolean(user && ownerProfile.isSuccess && ownerProfile.data?.userId === user.id && ownerProfile.data?.id === release?.artistId && team.isSuccess && (!team.data || team.data.role === 'owner') && !/team member/i.test(ownerProfile.data?.artistName || ''));
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="container mx-auto min-w-0 max-w-4xl px-4 py-8">
        {!release ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              {id !== null && single.isLoading ? <><Loader2 className="h-8 w-8 animate-spin" /><p role="status">Loading single…</p></> : <>
                <Music className="h-10 w-10 text-muted-foreground" />
                <h1 className="text-2xl font-semibold">{id === null || single.error?.data?.code === 'NOT_FOUND' ? 'Single not available' : 'Could not load this single'}</h1>
                <p className="max-w-md text-muted-foreground">{id === null || single.error?.data?.code === 'NOT_FOUND' ? 'This single may no longer be published, or the link may be incorrect.' : 'The release is temporarily unavailable. Please try again.'}</p>
                {id !== null && single.error?.data?.code !== 'NOT_FOUND' && <Button variant="outline" onClick={() => void single.refetch()}>Retry</Button>}
                <Link href="/browse" className="text-primary underline">Discover talent</Link>
              </>}
            </CardContent>
          </Card>
        ) : (
          <>
            <PageBreadcrumb segments={[{ label: 'Discover', href: '/browse' }, { label: release.artistName, href: release.artistUrl }, { label: release.title }]} />
            <div className="mb-6 mt-4 min-w-0 [overflow-wrap:anywhere]">
              <p className="text-sm font-medium text-primary">Single</p>
              <h1 className="mt-1 text-3xl font-bold">{release.title}</h1>
              <Link href={release.artistUrl} className="mt-2 inline-block text-muted-foreground underline underline-offset-4">By {release.artistName}</Link>
            </div>
            <div className="grid min-w-0 grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
              <ReleaseCard release={release} artistName={release.artistName} isOwner={isOwner} purchaseId={purchaseId} showDescription={false} showDetailsLink={false} />
              <Card>
                <CardContent className="p-5 [overflow-wrap:anywhere]">
                  <h2 className="mb-3 text-lg font-semibold">About this single</h2>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{release.description || 'The creator has not added a description yet.'}</p>
                  <p className="mt-5 border-t pt-4 text-sm text-muted-foreground">Preview up to 30 seconds. Purchasing uses OlogyWood's existing checkout and gives you the audio download plus playback in your My Ology music library.</p>
                  {purchaseId && <Link href="/my-ology" className="mt-3 inline-block text-sm font-medium text-primary underline">Open My Ology</Link>}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
