/**
 * ContentReleasesDisplay — Shows published content releases on an artist's public profile.
 * Handles access control: free releases show the link, paid ones show a purchase button.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Film, Music, Mic, BookOpen, Video, Play, ExternalLink, Lock, DollarSign } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { AIUseDisclosureTag } from "@/components/AIUseDisclosure";

function getReleaseTypeIcon(type: string) {
  switch (type) {
    case 'movie': case 'documentary': case 'short_film': case 'web_series':
      return <Film className="h-5 w-5" />;
    case 'concert': case 'livestream':
      return <Video className="h-5 w-5" />;
    case 'podcast_episode': case 'interview':
      return <Mic className="h-5 w-5" />;
    case 'album': case 'music_video':
      return <Music className="h-5 w-5" />;
    case 'course': case 'masterclass':
      return <BookOpen className="h-5 w-5" />;
    default:
      return <Play className="h-5 w-5" />;
  }
}

function getAccessLabel(model: string) {
  switch (model) {
    case 'free': return '✅ Free';
    case 'ticketed': return '🎟 Ticket Required';
    case 'fan_club_only': return '⭐ Fan Club Only';
    case 'pay_what_you_want': return '💰 Pay What You Want';
    case 'unlock_after_purchase': return '🔓 Unlock After Purchase';
    default: return model;
  }
}

function getPlatformLabel(platform: string) {
  const map: Record<string, string> = {
    youtube: 'YouTube', vimeo: 'Vimeo', twitch: 'Twitch', spotify: 'Spotify',
    apple_podcasts: 'Apple Podcasts', soundcloud: 'SoundCloud',
    personal_website: 'Personal Website', other: 'Other',
  };
  return map[platform] || platform;
}

function getReleaseTypeLabel(type: string) {
  const map: Record<string, string> = {
    movie: 'Movie', documentary: 'Documentary', short_film: 'Short Film',
    web_series: 'Web Series', concert: 'Concert', livestream: 'Livestream',
    podcast_episode: 'Podcast Episode', album: 'Album', course: 'Course',
    masterclass: 'Masterclass', interview: 'Interview', music_video: 'Music Video',
    behind_the_scenes: 'Behind the Scenes', other: 'Other',
  };
  return map[type] || type;
}

interface ReleaseCardProps {
  release: any;
}

function ReleaseCard({ release }: ReleaseCardProps) {
  const { user } = useAuth();
  const { data: access } = trpc.contentRelease.checkAccess.useQuery(
    { releaseId: release.id },
    { enabled: !!user && release.accessModel !== 'free' }
  );
  const purchaseMutation = trpc.contentRelease.purchase.useMutation({
    onSuccess: () => { toast.success("Access granted! Enjoy the content."); },
    onError: (err) => toast.error(err.message),
  });

  const isFree = release.accessModel === 'free';
  const hasAccess = isFree || access?.hasAccess;
  const price = release.price ? parseFloat(release.price) : 0;

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/30 transition-colors">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {getReleaseTypeIcon(release.releaseType)}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{release.title}</h4>
        {release.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{release.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Badge variant="outline" className="text-[10px]">{getReleaseTypeLabel(release.releaseType)}</Badge>
          <Badge variant="outline" className="text-[10px]">{getPlatformLabel(release.hostingPlatform)}</Badge>
          {release.genre && <Badge variant="secondary" className="text-[10px]">{release.genre}</Badge>}
          {release.duration && <span className="text-[10px] text-muted-foreground">{release.duration}</span>}
        </div>
        <AIUseDisclosureTag disclosure={release} className="mt-2" />
        {release.includesLiveQA && <span className="text-[10px] text-muted-foreground block mt-1">🎤 Includes Live Q&A</span>}
        {release.includesBonusContent && <span className="text-[10px] text-muted-foreground block">🎁 Bonus Content</span>}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        <span className="text-[10px] text-muted-foreground">{getAccessLabel(release.accessModel)}</span>
        {hasAccess ? (
          <Button size="sm" variant="default" className="gap-1 text-xs" onClick={() => window.open(release.contentUrl, '_blank')}>
            <ExternalLink className="h-3 w-3" /> Watch
          </Button>
        ) : (
          <div className="text-right">
            {price > 0 && <p className="text-sm font-semibold">${price.toFixed(2)}</p>}
            <Button size="sm" variant="outline" className="gap-1 text-xs mt-1" onClick={() => {
              if (!user) { toast.error("Please log in to purchase"); return; }
              purchaseMutation.mutate({ releaseId: release.id, amount: price });
            }}>
              <Lock className="h-3 w-3" /> Unlock
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ContentReleasesDisplayProps {
  artistProfileId: number;
}

export function ContentReleasesDisplay({ artistProfileId }: ContentReleasesDisplayProps) {
  const { data: releases, isLoading } = trpc.contentRelease.getByArtist.useQuery({ artistProfileId });

  if (isLoading || !releases || releases.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Film className="h-5 w-5 text-primary" />
          Content Releases ({releases.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {releases.map((release: any) => (
          <ReleaseCard key={release.id} release={release} />
        ))}
      </CardContent>
    </Card>
  );
}
