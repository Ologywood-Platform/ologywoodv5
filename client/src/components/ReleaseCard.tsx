/**
 * ReleaseCard — Displays a single release on an artist's public profile.
 * Shows cover art, title, price, and a buy button.
 * Includes an inline audio preview player with progress bar and 30-second cap.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Music, Play, Pause, ShoppingCart, Download, Loader2, Volume2, Heart } from "lucide-react";
import { useToast } from "@/components/ErrorToast";

const PREVIEW_MAX_SECONDS = 30;

interface ReleaseCardProps {
  release: {
    id: number;
    title: string;
    genre?: string | null;
    priceInCents: number;
    coverArtUrl?: string | null;
    previewFileKey?: string | null;
    audioFileKey?: string | null;
    totalSales: number;
    publishedAt?: string | Date | null;
    durationSeconds?: number | null;
    fileFormat?: string | null;
    allowPayWhatYouWant?: boolean;
  };
  artistName: string;
  isOwner?: boolean;
  purchaseId?: number | null;
}

export function ReleaseCard({ release, artistName, isOwner = false, purchaseId }: ReleaseCardProps) {
  const toast = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(PREVIEW_MAX_SECONDS);
  const [hasPreviewFile, setHasPreviewFile] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const priceFormatted = (release.priceInCents / 100).toFixed(2);
  const minPrice = release.priceInCents / 100;
  const [customPrice, setCustomPrice] = useState<string>(priceFormatted);
  const [showPriceInput, setShowPriceInput] = useState(false);
  const hasPurchased = !!purchaseId;
  const hasPreview = !!(release.previewFileKey || release.audioFileKey);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

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

  const updateProgress = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !isPlaying) return;

    const time = audio.currentTime;
    const maxDuration = hasPreviewFile ? audio.duration : Math.min(audio.duration, PREVIEW_MAX_SECONDS);

    setCurrentTime(time);
    setProgress(maxDuration > 0 ? (time / maxDuration) * 100 : 0);

    // Enforce 30-second cap when using full audio file as preview
    if (!hasPreviewFile && time >= PREVIEW_MAX_SECONDS) {
      audio.pause();
      setIsPlaying(false);
      setProgress(100);
      setCurrentTime(PREVIEW_MAX_SECONDS);
      return;
    }

    animFrameRef.current = requestAnimationFrame(updateProgress);
  }, [isPlaying, hasPreviewFile]);

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

  const handlePreviewToggle = async () => {
    // If already playing, pause
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // If audio is loaded and paused, resume
    if (audioRef.current && audioRef.current.src && !isPlaying) {
      const audio = audioRef.current;
      // If at the end, restart
      if (!hasPreviewFile && audio.currentTime >= PREVIEW_MAX_SECONDS) {
        audio.currentTime = 0;
        setCurrentTime(0);
        setProgress(0);
      }
      audio.play();
      setIsPlaying(true);
      return;
    }

    // Load preview from server
    setIsLoadingPreview(true);
    try {
      const response = await fetch(`/api/release/download/preview/${release.id}`);
      const data = await response.json();
      if (data.success && data.previewUrl) {
        setHasPreviewFile(!!data.hasPreviewFile);

        const audio = new Audio(data.previewUrl);
        audioRef.current = audio;

        audio.onloadedmetadata = () => {
          const maxDur = data.hasPreviewFile ? audio.duration : Math.min(audio.duration, PREVIEW_MAX_SECONDS);
          setPreviewDuration(maxDur);
        };

        audio.onended = () => {
          setIsPlaying(false);
          setProgress(100);
        };

        audio.onerror = () => {
          setIsPlaying(false);
          setIsLoadingPreview(false);
          toast.addError("Preview unavailable", "Could not load audio preview");
        };

        await audio.play();
        setIsPlaying(true);
      } else {
        toast.addError("Preview unavailable", data.error || "No preview available");
      }
    } catch {
      toast.addError("Preview unavailable", "Could not load audio preview");
    }
    setIsLoadingPreview(false);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    const maxDur = hasPreviewFile ? audio.duration : Math.min(audio.duration, PREVIEW_MAX_SECONDS);
    const newTime = ratio * maxDur;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(ratio * 100);
  };

  const handleBuy = async () => {
    // If PWYW is enabled and we haven't shown the price input yet, show it
    if (release.allowPayWhatYouWant && !showPriceInput) {
      setShowPriceInput(true);
      return;
    }

    const finalAmountCents = release.allowPayWhatYouWant
      ? Math.round(parseFloat(customPrice) * 100)
      : release.priceInCents;

    if (release.allowPayWhatYouWant && (isNaN(finalAmountCents) || finalAmountCents < release.priceInCents)) {
      toast.addError("Invalid amount", `Minimum price is $${priceFormatted}`);
      return;
    }

    setIsBuying(true);
    try {
      const response = await fetch('/api/release/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          releaseId: release.id,
          ...(release.allowPayWhatYouWant ? { customAmountCents: finalAmountCents } : {}),
        }),
      });
      const data = await response.json();
      if (data.checkoutUrl) {
        toast.addSuccess("Checkout", "Redirecting to Stripe checkout...");
        window.open(data.checkoutUrl, '_blank');
      } else {
        toast.addError("Purchase failed", data.error || 'Failed to create checkout session');
      }
    } catch {
      toast.addError("Purchase failed", 'Network error. Please try again.');
    }
    setIsBuying(false);
  };

  const handleDownload = async () => {
    if (!purchaseId) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/release/download/${purchaseId}`);
      const data = await response.json();
      if (data.success && data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = data.fileName || `${release.title}.mp3`;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.addSuccess("Download started", `${data.downloadsRemaining} downloads remaining`);
      } else {
        toast.addError("Download failed", data.error || "Unable to generate download link");
      }
    } catch {
      toast.addError("Download failed", "Network error. Please try again.");
    }
    setIsDownloading(false);
  };

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex flex-col">
        {/* Cover Art */}
        <div className="relative aspect-square w-full flex-shrink-0 bg-muted">
          {release.coverArtUrl ? (
            <img
              src={release.coverArtUrl}
              alt={`${release.title} cover art`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          {/* Preview play button overlay on cover art */}
          {hasPreview && (
            <button
              onClick={handlePreviewToggle}
              disabled={isLoadingPreview}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={isPlaying ? "Pause preview" : "Play preview"}
            >
              {isLoadingPreview ? (
                <Loader2 className="h-10 w-10 text-white animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-10 w-10 text-white" />
              ) : (
                <Play className="h-10 w-10 text-white" />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-3">
          {/* Title */}
          <h3 className="font-semibold text-sm leading-snug break-words">{release.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{artistName}</p>

          {/* Price */}
          <div className="mt-1.5">
            <span className="text-lg font-bold text-primary">${priceFormatted}</span>
            {release.allowPayWhatYouWant && (
              <span className="text-[10px] text-muted-foreground ml-1">or more</span>
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {release.genre && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {release.genre}
              </Badge>
            )}
            {release.durationSeconds && (
              <span className="text-[10px] text-muted-foreground">
                {formatDuration(release.durationSeconds)}
              </span>
            )}
            {release.fileFormat && (
              <span className="text-[10px] text-muted-foreground uppercase">
                {release.fileFormat}
              </span>
            )}
            {release.totalSales > 0 && (
              <span className="text-[10px] text-muted-foreground">
                {release.totalSales} {release.totalSales === 1 ? "sale" : "sales"}
              </span>
            )}
          </div>

          {/* Audio Preview Player */}
          {(isPlaying || (audioRef.current && progress > 0)) && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handlePreviewToggle}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-muted transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Play className="h-3.5 w-3.5 text-primary" />
                  )}
                </button>
                <div
                  className="flex-1 h-1.5 bg-muted rounded-full cursor-pointer relative overflow-hidden"
                  onClick={handleProgressClick}
                  role="progressbar"
                  aria-valuenow={Math.round(progress)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-[width] duration-100"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                {isPlaying && (
                  <Volume2 className="h-3 w-3 text-primary flex-shrink-0 animate-pulse" />
                )}
              </div>
              <div className="text-[10px] text-muted-foreground text-center tabular-nums">
                {formatTime(currentTime)} / {formatTime(previewDuration)}
              </div>
            </div>
          )}

          {/* Inline preview button when player is not active */}
          {hasPreview && !isPlaying && !(audioRef.current && progress > 0) && (
            <div className="mt-1.5">
              <button
                onClick={handlePreviewToggle}
                disabled={isLoadingPreview}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {isLoadingPreview ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                Preview ({formatTime(Math.min(release.durationSeconds || PREVIEW_MAX_SECONDS, PREVIEW_MAX_SECONDS))})
              </button>
            </div>
          )}

          {/* PWYW Price Input */}
          {release.allowPayWhatYouWant && showPriceInput && !hasPurchased && !isOwner && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min={minPrice}
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="pl-5 h-7 text-xs"
                  placeholder={priceFormatted}
                />
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">min ${priceFormatted}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-2">
            {hasPurchased ? (
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full h-8 text-xs"
              >
                {isDownloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Download className="h-3.5 w-3.5 mr-1" />
                )}
                Download
              </Button>
            ) : !isOwner ? (
              <Button
                size="sm"
                onClick={handleBuy}
                disabled={isBuying}
                className="w-full h-8 text-xs"
              >
                {isBuying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : release.allowPayWhatYouWant ? (
                  <Heart className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                )}
                {release.allowPayWhatYouWant
                  ? (showPriceInput ? `Pay $${parseFloat(customPrice || priceFormatted).toFixed(2)}` : "Name Your Price")
                  : `Buy $${priceFormatted}`
                }
              </Button>
            ) : null}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
