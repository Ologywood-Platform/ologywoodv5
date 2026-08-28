import { useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, Video } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { ShareVideoButton } from '@/components/ShareVideoButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { artistUrl } from '@/lib/slugify';
import { portfolioVideoDescription } from '@shared/portfolioVideoShare';

export default function PortfolioVideo() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [playing, setPlaying] = useState(false);
  const videoId = useMemo(() => {
    const match = slug.match(/(?:^|-)(\d+)$/);
    return match ? Number(match[1]) : 0;
  }, [slug]);
  const { data: video, isLoading } = trpc.artist.getPortfolioVideo.useQuery(
    { videoId },
    { enabled: videoId > 0 },
  );

  if (isLoading) {
    return <><SiteHeader /><main className="min-h-[620px] flex items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700" /></main></>;
  }

  if (!video || videoId <= 0) {
    return <><SiteHeader /><main className="min-h-[620px] flex items-center justify-center px-4"><Card className="max-w-lg w-full"><CardContent className="pt-8 text-center space-y-4"><Video className="h-12 w-12 text-muted-foreground mx-auto" /><h1 className="text-2xl font-bold">Portfolio video not found</h1><p className="text-muted-foreground">This clip may have been removed or the link may be incorrect.</p><Button asChild><Link href="/browse">Browse creators</Link></Button></CardContent></Card></main></>;
  }

  const backUrl = artistUrl(video.artistName, video.artistProfileId);
  const description = portfolioVideoDescription(video.title, video.artistName, video.category);

  return (
    <>
      <SiteHeader />
      <main className="min-h-[720px] bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950/30 px-4 py-10">
        <div className="max-w-5xl mx-auto space-y-6">
          <Link href={backUrl} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-purple-700"><ArrowLeft className="h-4 w-4" />Back to {video.artistName}</Link>
          <div className="overflow-hidden rounded-2xl bg-black shadow-xl aspect-video">
            {video.embedUrl ? (
              <iframe src={`${video.embedUrl}?autoplay=1`} title={video.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="w-full h-full border-0" />
            ) : playing ? (
              <video src={video.videoUrl} poster={video.thumbnailUrl || undefined} controls autoPlay className="w-full h-full object-contain" />
            ) : (
              <button type="button" onClick={() => setPlaying(true)} className="relative w-full h-full group" aria-label={`Play ${video.title}`}>
                {video.thumbnailUrl ? <img src={video.thumbnailUrl} alt={`Thumbnail for ${video.title}`} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-slate-900 to-black" />}
                <span className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/35 transition-colors"><span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-lg"><span className="ml-1 h-0 w-0 border-y-[12px] border-y-transparent border-l-[20px] border-l-black" /></span></span>
              </button>
            )}
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2"><Badge variant="secondary">{video.category.replace(/_/g, ' ')}</Badge><h1 className="text-3xl font-bold tracking-tight">{video.title}</h1><Link href={backUrl} className="font-medium text-purple-700 hover:underline">by {video.artistName}</Link><p className="max-w-2xl text-muted-foreground">{description}</p></div>
            <ShareVideoButton artistId={video.artistProfileId} artistName={video.artistName} videoId={video.id} videoTitle={video.title} />
          </div>
        </div>
      </main>
    </>
  );
}
