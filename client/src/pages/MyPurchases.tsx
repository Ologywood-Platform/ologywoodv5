/**
 * My Purchases — Lists all releases the user has purchased.
 * Shows cover art, title, artist, date, amount, and download button.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music, Download, Loader2, ShoppingBag, ArrowLeft, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/components/ErrorToast";

export default function MyPurchases() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const toast = useToast();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data: purchases, isLoading } = trpc.release.myPurchases.useQuery(undefined, {
    enabled: !!user,
  });

  const handleDownload = async (purchaseId: number) => {
    setDownloadingId(purchaseId);
    try {
      const response = await fetch(`/api/release/download/${purchaseId}`);
      const data = await response.json();
      if (data.success && data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = data.fileName || "release.mp3";
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.addSuccess("Download started", `${data.downloadsRemaining} downloads remaining`);
      } else {
        toast.addError("Download failed", data.error || "Failed to generate download link");
      }
    } catch {
      toast.addError("Download failed", "Network error. Please try again.");
    }
    setDownloadingId(null);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold">My Purchases</h1>
        </div>
        <p className="text-muted-foreground mt-1">
          Your purchased releases and downloads
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && (!purchases || purchases.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No purchases yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Browse artists and discover music to support independent creators.
            </p>
            <Button onClick={() => navigate("/browse")}>
              Browse Artists
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Purchase list */}
      {purchases && purchases.length > 0 && (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Cover art */}
                  <div className="w-full sm:w-32 h-32 flex-shrink-0 bg-muted">
                    {purchase.release?.coverArtUrl ? (
                      <img
                        src={purchase.release.coverArtUrl}
                        alt={purchase.release.title || "Release"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">
                        {purchase.release?.title || "Unknown Release"}
                      </h3>
                      {purchase.release?.artistId && (
                        <button
                          onClick={() => navigate(`/artist/${purchase.release!.artistId}`)}
                          className="text-sm text-primary hover:underline"
                        >
                          View Artist
                        </button>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(purchase.purchasedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          ${(purchase.amountPaidCents / 100).toFixed(2)}
                        </span>
                        {purchase.release?.genre && (
                          <Badge variant="secondary" className="text-xs">
                            {purchase.release.genre}
                          </Badge>
                        )}
                        {purchase.release?.fileFormat && (
                          <Badge variant="outline" className="text-xs uppercase">
                            {purchase.release.fileFormat}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Download button */}
                    <div className="flex flex-col items-end gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(purchase.id)}
                        disabled={downloadingId === purchase.id || purchase.downloadCount >= purchase.maxDownloads}
                      >
                        {downloadingId === purchase.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Download className="h-4 w-4 mr-1" />
                        )}
                        Download
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {purchase.downloadCount >= purchase.maxDownloads
                          ? "Limit reached"
                          : `${purchase.maxDownloads - purchase.downloadCount} of ${purchase.maxDownloads} remaining`}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
