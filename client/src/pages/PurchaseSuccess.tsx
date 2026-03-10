/**
 * Purchase Success — Shown after a successful Stripe checkout for a release.
 * Displays purchase confirmation with download button and artist link.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation, useSearch } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Download, Music, Loader2, ArrowRight, ShoppingBag } from "lucide-react";
import { useToast } from "@/components/ErrorToast";

export default function PurchaseSuccess() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const search = useSearch();
  const toast = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  // Extract session_id from URL query params
  const params = new URLSearchParams(search);
  const sessionId = params.get("session_id");

  const { data: purchase, isLoading } = trpc.release.purchaseBySession.useQuery(
    { sessionId: sessionId || "" },
    { enabled: !!user && !!sessionId }
  );

  const handleDownload = async () => {
    if (!purchase) return;
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/release/download/${purchase.id}`);
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
    setIsDownloading(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">No purchase found</h2>
        <p className="text-muted-foreground mb-6">This page requires a valid checkout session.</p>
        <Button onClick={() => navigate("/browse")}>Browse Artists</Button>
      </div>
    );
  }

  // Purchase not found or still processing
  if (!purchase) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
        <h2 className="text-xl font-semibold mb-2">Processing your purchase...</h2>
        <p className="text-muted-foreground mb-6">
          Your payment is being confirmed. This may take a moment. 
          If this takes longer than expected, check your email for a confirmation.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Success header */}
          <div className="bg-green-50 dark:bg-green-950/30 p-6 text-center border-b">
            <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-1">Purchase Complete!</h1>
            <p className="text-muted-foreground">Thank you for supporting independent artists</p>
          </div>

          {/* Release details */}
          <div className="p-6">
            <div className="flex gap-4 mb-6">
              {/* Cover art */}
              <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {purchase.release?.coverArtUrl ? (
                  <img
                    src={purchase.release.coverArtUrl}
                    alt={purchase.release.title || "Release"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">
                  {purchase.release?.title || "Release"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  ${(purchase.amountPaidCents / 100).toFixed(2)} paid
                </p>
                <p className="text-sm text-muted-foreground">
                  {purchase.release?.fileFormat?.toUpperCase()} format
                </p>
              </div>
            </div>

            {/* Download button */}
            <Button
              className="w-full mb-3"
              size="lg"
              onClick={handleDownload}
              disabled={isDownloading || purchase.downloadCount >= purchase.maxDownloads}
            >
              {isDownloading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <Download className="h-5 w-5 mr-2" />
              )}
              Download Your Track
            </Button>
            <p className="text-xs text-center text-muted-foreground mb-6">
              {purchase.maxDownloads - purchase.downloadCount} of {purchase.maxDownloads} downloads remaining
            </p>

            {/* Action links */}
            <div className="flex flex-col gap-2">
              {purchase.release?.artistId && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/artist/${purchase.release!.artistId}`)}
                >
                  View Artist Profile
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/my-purchases")}
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                View All Purchases
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
