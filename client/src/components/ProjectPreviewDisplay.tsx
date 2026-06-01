/**
 * ProjectPreviewDisplay — Public display of an artist's project previews.
 * Shows project cards with cover art, track lists, and inline audio players.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import {
  Disc3, Play, Pause, Music, ExternalLink, Calendar, ListMusic,
  Share2, Copy, Check, Twitter, Facebook
} from 'lucide-react';

interface ProjectPreviewDisplayProps {
  userId: number;
}

export function ProjectPreviewDisplay({ userId }: ProjectPreviewDisplayProps) {
  const { data: projects } = trpc.projectPreviews.getPublicProjects.useQuery({ userId });

  if (!projects || projects.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Disc3 className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold">Projects</h2>
        <Badge variant="secondary" className="text-xs">{projects.length}</Badge>
      </div>

      <div className="space-y-4">
        {projects.map((project: any) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: any }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Cover art */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
            {project.coverArtUrl ? (
              <img src={project.coverArtUrl} alt={project.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Disc3 className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate">{project.title}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge variant="secondary" className="text-xs capitalize">
                {project.releaseType.replace('_', ' ')}
              </Badge>
              {project.status === 'coming_soon' && (
                <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Coming Soon
                </Badge>
              )}
              {project.releaseDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(project.releaseDate).toLocaleDateString()}
                </span>
              )}
            </div>
            {project.description && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{project.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {project.externalLink && (
                <Button
                  variant="outline" size="sm" className="text-xs h-7 px-2.5 gap-1"
                  onClick={() => window.open(project.externalLink, '_blank')}
                >
                  <ExternalLink className="h-3 w-3" />
                  Listen
                </Button>
              )}
              <ShareButton projectTitle={project.title} />
            </div>
          </div>
        </div>

        {/* Track list with audio players */}
        {project.tracks && project.tracks.length > 0 && (
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <ListMusic className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {project.tracks.length} track{project.tracks.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-1">
              {project.tracks.map((track: any) => (
                <TrackRow key={track.id} track={track} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShareButton({ projectTitle }: { projectTitle: string }) {
  const [copied, setCopied] = useState(false);

  // The share URL is the current page (artist profile) since projects live on the artist profile
  const shareUrl = window.location.href;
  const shareText = `Check out "${projectTitle}" on Ologywood!`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);
    let url = '';

    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'whatsapp':
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
    }

    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  // Use native share API on mobile if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: projectTitle, text: shareText, url: shareUrl });
      } catch {
        // User cancelled or error, ignore
      }
    }
  };

  // On mobile, use native share
  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;
  if (hasNativeShare) {
    return (
      <Button
        variant="outline" size="sm" className="text-xs h-7 px-2.5 gap-1"
        onClick={handleNativeShare}
      >
        <Share2 className="h-3 w-3" />
        Share
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs h-7 px-2.5 gap-1">
          <Share2 className="h-3 w-3" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <button
            onClick={() => handleShare('twitter')}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Twitter className="h-3.5 w-3.5" />
            Twitter / X
          </button>
          <button
            onClick={() => handleShare('facebook')}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Facebook className="h-3.5 w-3.5" />
            Facebook
          </button>
          <button
            onClick={() => handleShare('whatsapp')}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TrackRow({ track }: { track: any }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const maxDuration = track.durationSeconds || 30;

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    const time = audio.currentTime;
    setCurrentTime(time);
    setProgress(maxDuration > 0 ? (time / maxDuration) * 100 : 0);

    // Enforce snippet duration cap
    if (time >= maxDuration) {
      audio.pause();
      setIsPlaying(false);
      setProgress(100);
      setCurrentTime(maxDuration);
      return;
    }

    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, [isPlaying, maxDuration]);

  useEffect(() => {
    if (isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateProgress);
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, updateProgress]);

  const handleToggle = async () => {
    if (!track.audioUrl) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current && audioRef.current.src && !isPlaying) {
      if (audioRef.current.currentTime >= maxDuration) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        setProgress(0);
      }
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // Load audio
    const audio = new Audio(track.audioUrl);
    audioRef.current = audio;

    audio.onended = () => {
      setIsPlaying(false);
      setProgress(100);
    };

    await audio.play();
    setIsPlaying(true);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    const newTime = ratio * maxDuration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(ratio * 100);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 py-1 group">
      {/* Track number */}
      <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{track.trackNumber}.</span>

      {/* Play button (only if audio exists) */}
      {track.audioUrl ? (
        <button
          onClick={handleToggle}
          className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 hover:bg-purple-200 dark:hover:bg-purple-900/50 shrink-0"
        >
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3 ml-0.5" />}
        </button>
      ) : (
        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 shrink-0">
          <Music className="h-3 w-3 text-gray-400" />
        </div>
      )}

      {/* Title */}
      <span className="text-sm flex-1 truncate">{track.title}</span>

      {/* Progress bar (only when playing or has progress) */}
      {track.audioUrl && (isPlaying || progress > 0) && (
        <div className="flex items-center gap-1.5 min-w-[100px]">
          <span className="text-[10px] text-muted-foreground w-7 text-right">{formatTime(currentTime)}</span>
          <div
            className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
            onClick={handleProgressClick}
            role="progressbar"
            aria-valuenow={progress}
          >
            <div
              className="h-full bg-purple-600 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-7">{formatTime(maxDuration)}</span>
        </div>
      )}

      {/* Duration badge when not playing */}
      {track.audioUrl && !isPlaying && progress === 0 && (
        <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">
          {formatTime(maxDuration)}
        </Badge>
      )}
    </div>
  );
}
