/**
 * ReleaseCard — Displays a single release on an artist's public profile.
 * Shows cover art, title, price, and a buy button.
 * Includes a simple audio preview player when a preview is available.
 */

import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Play, Pause, ShoppingCart, Download, Loader2 } from "lucide-react";
import { useToast } from "@/components/ErrorToast";

interface ReleaseCardProps {
  release: {
    id: number;
    title: string;
    genre?: string | null;
    priceInCents: number;
    coverArtUrl?: string | null;
    previewFileKey?: string | null;
    totalSales: number;
    publishedAt?: string | Date | null;
    durationSeconds?: number | null;
    fileFormat?: string | null;
  };
  artistName: string;
  isOwner?: boolean;
  purchaseId?: number | null;
}

export function ReleaseCard({ release, artistName, isOwner = false, purchaseId }: ReleaseCardProps) {
  const toast = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const priceFormatted = (release.priceInCents / 100).toFixed(2);
  const hasPurchased = !!purchaseId;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleBuy = async () => {
    setIsBuying(true);
    try {
      // Use fetch to call the checkout endpoint directly
      const response = await fetch('/api/release/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseId: release.id }),
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
        // Open download URL
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

  const handlePreviewToggle = async () => {
    if (!release.previewFileKey) return;

    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      const response = await fetch(`/api/release/download/preview/${release.id}`);
      const data = await response.json();
      if (data.success && data.previewUrl) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(data.previewUrl);
        audioRef.current = audio;
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setIsPlaying(true);
      }
    } catch {
      toast.addError("Preview unavailable", "Could not load audio preview");
    }
  };

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Cover Art */}
        <div className="relative w-full sm:w-32 h-32 sm:h-auto flex-shrink-0 bg-muted">
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
          {/* Preview play button overlay */}
          {release.previewFileKey && (
            <button
              onClick={handlePreviewToggle}
              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={isPlaying ? "Pause preview" : "Play preview"}
            >
              {isPlaying ? (
                <Pause className="h-8 w-8 text-white" />
              ) : (
                <Play className="h-8 w-8 text-white" />
              )}
            </button>
          )}
        </div>

        {/* Content */}
        <CardContent className="flex-1 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-base leading-tight">{release.title}</h3>
                <p className="text-sm text-muted-foreground">{artistName}</p>
              </div>
              <span className="text-lg font-bold text-primary whitespace-nowrap">
                ${priceFormatted}
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {release.genre && (
                <Badge variant="secondary" className="text-xs">
                  {release.genre}
                </Badge>
              )}
              {release.durationSeconds && (
                <span className="text-xs text-muted-foreground">
                  {formatDuration(release.durationSeconds)}
                </span>
              )}
              {release.fileFormat && (
                <span className="text-xs text-muted-foreground">
                  {release.fileFormat}
                </span>
              )}
              {release.totalSales > 0 && (
                <span className="text-xs text-muted-foreground">
                  {release.totalSales} {release.totalSales === 1 ? "sale" : "sales"}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-3 flex gap-2">
            {hasPurchased ? (
              <Button
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                Download
              </Button>
            ) : !isOwner ? (
              <Button
                size="sm"
                onClick={handleBuy}
                disabled={isBuying}
                className="flex-1"
              >
                {isBuying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <ShoppingCart className="h-4 w-4 mr-1" />
                )}
                Buy ${priceFormatted}
              </Button>
            ) : null}
            {release.previewFileKey && (
              <Button
                size="sm"
                variant="outline"
                onClick={handlePreviewToggle}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
