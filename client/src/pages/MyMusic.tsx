/**
 * My Music — Full-featured music player for purchased tracks.
 * Features: play/pause, skip forward/back, seek bar, volume, shuffle,
 * sort by artist/title/date/genre, delete from library, download to device.
 * Styled in Ologywood purple/gradient colors.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Volume2, VolumeX,
  Download, Trash2, Music, Loader2, ArrowLeft, SortAsc, ChevronDown,
  Repeat, ListMusic, X
} from "lucide-react";

type Track = {
  purchaseId: number;
  releaseId: number;
  title: string;
  artistName: string;
  artistId: number | null;
  genre: string | null;
  durationSeconds: number;
  fileFormat: string;
  coverArtUrl: string | null;
  purchasedAt: string | Date;
  amountPaidCents: number;
};

type SortOption = "recent" | "title" | "artist" | "genre";

export default function MyMusic() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  // Player state
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isLoadingTrack, setIsLoadingTrack] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const shuffleOrderRef = useRef<number[]>([]);

  // Fetch library
  const { data: library, isLoading, refetch } = trpc.release.myLibrary.useQuery(undefined, {
    enabled: !!user,
  });

  const hideMutation = trpc.release.hideFromLibrary.useMutation({
    onSuccess: () => {
      toast.success("Track removed from library");
      refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to remove track"),
    onSettled: () => setDeletingId(null),
  });

  // Sort tracks
  const sortedTracks: Track[] = (() => {
    if (!library) return [];
    const tracks = [...library] as Track[];
    switch (sortBy) {
      case "title":
        return tracks.sort((a, b) => a.title.localeCompare(b.title));
      case "artist":
        return tracks.sort((a, b) => a.artistName.localeCompare(b.artistName));
      case "genre":
        return tracks.sort((a, b) => (a.genre || "").localeCompare(b.genre || ""));
      case "recent":
      default:
        return tracks.sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
    }
  })();

  const currentTrack = currentTrackIndex >= 0 && currentTrackIndex < sortedTracks.length
    ? sortedTracks[currentTrackIndex]
    : null;

  // Generate shuffle order
  const generateShuffleOrder = useCallback((length: number) => {
    const order = Array.from({ length }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    shuffleOrderRef.current = order;
  }, []);

  // Format time
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Audio progress animation
  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;
    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);
    setProgress(audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0);
    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, [isPlaying]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Play a track by index
  const playTrack = async (index: number) => {
    if (index < 0 || index >= sortedTracks.length) return;

    const track = sortedTracks[index];
    setCurrentTrackIndex(index);
    setIsLoadingTrack(true);
    setProgress(0);
    setCurrentTime(0);

    try {
      // Fetch streaming URL
      const response = await fetch(`/api/release/download/preview/${track.releaseId}`);
      const data = await response.json();

      // For purchased tracks, use the full download endpoint for streaming
      const streamResponse = await fetch(`/api/release/download/${track.purchaseId}`);
      const streamData = await streamResponse.json();

      const audioUrl = streamData.success ? streamData.downloadUrl : (data.success ? data.previewUrl : null);

      if (!audioUrl) {
        toast.error("Could not load track");
        setIsLoadingTrack(false);
        return;
      }

      // Stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      const audio = new Audio(audioUrl);
      audio.volume = isMuted ? 0 : volume;
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };

      audio.onended = () => {
        setIsPlaying(false);
        handleNext();
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoadingTrack(false);
        toast.error("Failed to play track");
      };

      await audio.play();
      setIsPlaying(true);
      setIsLoadingTrack(false);
    } catch {
      toast.error("Failed to load track");
      setIsLoadingTrack(false);
    }
  };

  // Playback controls
  const handlePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) {
      if (sortedTracks.length > 0) playTrack(0);
      return;
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleNext = () => {
    if (sortedTracks.length === 0) return;
    let nextIndex: number;
    if (isShuffled) {
      const currentShufflePos = shuffleOrderRef.current.indexOf(currentTrackIndex);
      const nextShufflePos = (currentShufflePos + 1) % shuffleOrderRef.current.length;
      nextIndex = shuffleOrderRef.current[nextShufflePos];
    } else {
      nextIndex = (currentTrackIndex + 1) % sortedTracks.length;
    }
    if (nextIndex === 0 && !isRepeat && !isShuffled) {
      // End of playlist
      setIsPlaying(false);
      return;
    }
    playTrack(nextIndex);
  };

  const handlePrevious = () => {
    if (sortedTracks.length === 0) return;
    const audio = audioRef.current;
    // If more than 3 seconds in, restart current track
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
      return;
    }
    let prevIndex: number;
    if (isShuffled) {
      const currentShufflePos = shuffleOrderRef.current.indexOf(currentTrackIndex);
      const prevShufflePos = (currentShufflePos - 1 + shuffleOrderRef.current.length) % shuffleOrderRef.current.length;
      prevIndex = shuffleOrderRef.current[prevShufflePos];
    } else {
      prevIndex = (currentTrackIndex - 1 + sortedTracks.length) % sortedTracks.length;
    }
    playTrack(prevIndex);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const newTime = ratio * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(ratio * 100);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) audioRef.current.volume = val;
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) audioRef.current.volume = newMuted ? 0 : volume;
  };

  const toggleShuffle = () => {
    const newShuffled = !isShuffled;
    setIsShuffled(newShuffled);
    if (newShuffled) {
      generateShuffleOrder(sortedTracks.length);
    }
  };

  const toggleRepeat = () => setIsRepeat(!isRepeat);

  // Delete from library
  const handleDelete = (purchaseId: number) => {
    if (!confirm("Remove this track from your library? You can still re-download it from My Purchases.")) return;
    setDeletingId(purchaseId);
    hideMutation.mutate({ purchaseId });
    // If we're deleting the currently playing track, stop
    if (currentTrack?.purchaseId === purchaseId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      setIsPlaying(false);
      setCurrentTrackIndex(-1);
    }
  };

  // Download to device
  const handleDownload = async (purchaseId: number) => {
    setDownloadingId(purchaseId);
    try {
      const response = await fetch(`/api/release/download/${purchaseId}`);
      const data = await response.json();
      if (data.success && data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = data.fileName || "track.mp3";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Download started");
      } else {
        toast.error(data.error || "Download failed");
      }
    } catch {
      toast.error("Download failed");
    }
    setDownloadingId(null);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-950/20 to-gray-900">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-violet-700 flex items-center justify-center">
            <ListMusic className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">My Music</h1>
            <p className="text-sm text-gray-400">
              {sortedTracks.length} {sortedTracks.length === 1 ? "track" : "tracks"} in your library
            </p>
          </div>
        </div>
      </div>

      {/* Now Playing + Controls */}
      {currentTrack && (
        <div className="sticky top-0 z-30 bg-gray-900/95 backdrop-blur-md border-b border-purple-900/30">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Album Art */}
              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800 shadow-lg shadow-purple-900/20">
                {currentTrack.coverArtUrl ? (
                  <img src={currentTrack.coverArtUrl} alt={currentTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-6 w-6 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate text-sm">{currentTrack.title}</p>
                <p className="text-gray-400 text-xs truncate">{currentTrack.artistName}</p>

                {/* Progress Bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-gray-500 w-8 text-right">{formatTime(currentTime)}</span>
                  <div
                    className="flex-1 h-1.5 bg-gray-700 rounded-full cursor-pointer group relative"
                    onClick={handleSeek}
                  >
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-500 w-8">{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleShuffle}
                  className={`p-2 rounded-full transition-colors ${isShuffled ? "text-purple-400 bg-purple-900/30" : "text-gray-400 hover:text-white"}`}
                  title="Shuffle"
                >
                  <Shuffle className="h-4 w-4" />
                </button>
                <button onClick={handlePrevious} className="p-2 text-gray-300 hover:text-white transition-colors" title="Previous">
                  <SkipBack className="h-5 w-5" />
                </button>
                <button
                  onClick={handlePlayPause}
                  disabled={isLoadingTrack}
                  className="p-3 bg-gradient-to-br from-purple-600 to-violet-700 rounded-full text-white hover:from-purple-500 hover:to-violet-600 transition-all shadow-lg shadow-purple-900/40 disabled:opacity-50"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isLoadingTrack ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </button>
                <button onClick={handleNext} className="p-2 text-gray-300 hover:text-white transition-colors" title="Next">
                  <SkipForward className="h-5 w-5" />
                </button>
                <button
                  onClick={toggleRepeat}
                  className={`p-2 rounded-full transition-colors ${isRepeat ? "text-purple-400 bg-purple-900/30" : "text-gray-400 hover:text-white"}`}
                  title="Repeat"
                >
                  <Repeat className="h-4 w-4" />
                </button>

                {/* Volume */}
                <div className="hidden sm:flex items-center gap-1 ml-2">
                  <button onClick={toggleMute} className="p-1.5 text-gray-400 hover:text-white transition-colors">
                    {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-16 h-1 accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort Controls */}
      {sortedTracks.length > 0 && (
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-800"
            >
              <SortAsc className="h-4 w-4" />
              Sort: {sortBy === "recent" ? "Date Added" : sortBy === "title" ? "Title" : sortBy === "artist" ? "Artist" : "Genre"}
              <ChevronDown className="h-3 w-3" />
            </button>
            {showSortMenu && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-1 z-20 min-w-[160px]">
                {([["recent", "Date Added"], ["title", "Title (A-Z)"], ["artist", "Artist (A-Z)"], ["genre", "Genre"]] as [SortOption, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setSortBy(key); setShowSortMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${sortBy === key ? "text-purple-400 bg-purple-900/20" : "text-gray-300 hover:bg-gray-700"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (sortedTracks.length > 0) {
                const randomIndex = Math.floor(Math.random() * sortedTracks.length);
                playTrack(randomIndex);
                setIsShuffled(true);
                generateShuffleOrder(sortedTracks.length);
              }
            }}
            className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-900/20"
          >
            <Shuffle className="h-4 w-4" />
            Play Random
          </button>
        </div>
      )}

      {/* Track List */}
      <div className="max-w-5xl mx-auto px-4 pb-32">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          </div>
        )}

        {!isLoading && sortedTracks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center mb-6">
              <Music className="h-10 w-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Your library is empty</h3>
            <p className="text-gray-400 mb-6 max-w-md">
              Purchase music from artists on Ologywood and it will appear here for playback.
            </p>
            <Button
              onClick={() => navigate("/browse")}
              className="bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-500 hover:to-violet-600 text-white"
            >
              Browse Artists
            </Button>
          </div>
        )}

        {sortedTracks.length > 0 && (
          <div className="space-y-1">
            {sortedTracks.map((track, index) => {
              const isActive = currentTrackIndex === index;
              return (
                <div
                  key={track.purchaseId}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? "bg-purple-900/30 border border-purple-700/40"
                      : "hover:bg-gray-800/60 border border-transparent"
                  }`}
                  onClick={() => playTrack(index)}
                >
                  {/* Track number / play indicator */}
                  <div className="w-8 text-center flex-shrink-0">
                    {isActive && isPlaying ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="w-0.5 h-3 bg-purple-400 rounded-full animate-pulse" />
                        <span className="w-0.5 h-4 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                        <span className="w-0.5 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 group-hover:hidden">{index + 1}</span>
                    )}
                    {!isActive && (
                      <Play className="h-4 w-4 text-white hidden group-hover:block mx-auto" />
                    )}
                  </div>

                  {/* Cover Art */}
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-800">
                    {track.coverArtUrl ? (
                      <img src={track.coverArtUrl} alt={track.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? "text-purple-300" : "text-white"}`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{track.artistName}</p>
                  </div>

                  {/* Genre badge */}
                  {track.genre && (
                    <span className="hidden md:inline-block text-[10px] text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                      {track.genre}
                    </span>
                  )}

                  {/* Duration */}
                  <span className="text-xs text-gray-500 w-10 text-right flex-shrink-0">
                    {formatTime(track.durationSeconds)}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleDownload(track.purchaseId)}
                      disabled={downloadingId === track.purchaseId}
                      className="p-1.5 text-gray-400 hover:text-green-400 transition-colors rounded"
                      title="Download to device"
                    >
                      {downloadingId === track.purchaseId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(track.purchaseId)}
                      disabled={deletingId === track.purchaseId}
                      className="p-1.5 text-gray-400 hover:text-red-400 transition-colors rounded"
                      title="Remove from library"
                    >
                      {deletingId === track.purchaseId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Close sort menu on outside click */}
      {showSortMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
      )}
    </div>
  );
}
