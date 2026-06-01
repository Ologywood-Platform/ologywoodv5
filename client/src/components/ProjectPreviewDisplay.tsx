/**
 * ProjectPreviewDisplay — Public display of an artist's project previews.
 * Shows project cards with cover art, track lists, and inline audio players.
 */
import { useState, useRef, useCallback, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Disc3, Play, Pause, Music, ExternalLink, Calendar, ListMusic
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
            {project.externalLink && (
              <Button
                variant="outline" size="sm" className="mt-2 text-xs h-7 px-2.5 gap-1"
                onClick={() => window.open(project.externalLink, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
                Listen
              </Button>
            )}
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
