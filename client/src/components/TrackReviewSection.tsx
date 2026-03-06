/**
 * TrackReviewSection — Purchase-gated track reviews.
 * Only fans who purchased a single can leave a 1-5 star rating and short review (max 280 chars).
 * Shows reviews with average rating, reviewer name, and date.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StarRating } from "@/components/ui/star-rating";
import { Star, MessageSquare, Loader2, Trash2, ShieldCheck } from "lucide-react";
import { useToast } from "@/components/ErrorToast";

interface TrackReviewSectionProps {
  releaseId: number;
  releaseTitle: string;
  isOwner?: boolean;
}

export function TrackReviewSection({ releaseId, releaseTitle, isOwner = false }: TrackReviewSectionProps) {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Fetch reviews
  const reviewsQuery = trpc.release.getReviews.useQuery({ releaseId });

  // Check if user can review (only for authenticated users)
  const canReviewQuery = trpc.release.canReview.useQuery(
    { releaseId },
    { enabled: isAuthenticated }
  );

  // Mutations
  const createReviewMutation = trpc.release.createReview.useMutation({
    onSuccess: () => {
      toast.addSuccess("Review submitted", "Thank you for your review!");
      setRating(0);
      setReviewText("");
      setShowForm(false);
      reviewsQuery.refetch();
      canReviewQuery.refetch();
    },
    onError: (error) => {
      toast.addError("Review failed", error.message);
    },
  });

  const deleteReviewMutation = trpc.release.deleteReview.useMutation({
    onSuccess: () => {
      toast.addSuccess("Review deleted", "Your review has been removed.");
      reviewsQuery.refetch();
      canReviewQuery.refetch();
    },
    onError: (error) => {
      toast.addError("Delete failed", error.message);
    },
  });

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.addError("Rating required", "Please select a star rating.");
      return;
    }
    setIsSubmitting(true);
    try {
      await createReviewMutation.mutateAsync({
        releaseId,
        rating,
        reviewText: reviewText.trim() || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    await deleteReviewMutation.mutateAsync({ reviewId });
  };

  const reviews = reviewsQuery.data?.reviews || [];
  const avgRating = reviewsQuery.data?.avgRating || 0;
  const reviewCount = reviewsQuery.data?.reviewCount || 0;
  const canReview = canReviewQuery.data?.canReview || false;
  const existingReview = canReviewQuery.data?.existingReview;
  const reviewReason = canReviewQuery.data?.reason;

  return (
    <div className="mt-4 space-y-3">
      {/* Review Summary Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StarRating value={Math.round(avgRating)} readOnly size="sm" />
          {reviewCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {avgRating} ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          )}
          {reviewCount === 0 && (
            <span className="text-sm text-muted-foreground">No reviews yet</span>
          )}
        </div>

        {/* Write Review Button */}
        {canReview && !showForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="text-xs"
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form (only for verified purchasers) */}
      {showForm && canReview && (
        <Card className="border-primary/20">
          <CardContent className="pt-4 space-y-3">
            <div>
              <p className="text-sm font-medium mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-green-600" />
                Verified Purchase Review
              </p>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>

            <div>
              <Textarea
                placeholder="Share your thoughts about this track... (optional, max 280 characters)"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value.slice(0, 280))}
                rows={3}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">
                {reviewText.length}/280
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0}
                className="text-xs"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Star className="h-3.5 w-3.5 mr-1" />
                )}
                Submit Review
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  setRating(0);
                  setReviewText("");
                }}
                className="text-xs"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Already reviewed message */}
      {reviewReason === "already_reviewed" && existingReview && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
          You reviewed this track
        </p>
      )}

      {/* Reviews List */}
      {reviews.length > 0 && (
        <div className="space-y-2">
          {reviews.map((review: any) => (
            <div
              key={review.id}
              className="flex items-start gap-3 py-2.5 border-b border-border/50 last:border-0"
            >
              {/* Avatar placeholder */}
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-primary">
                  {(review.reviewerName || "A").charAt(0).toUpperCase()}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{review.reviewerName}</span>
                  <StarRating value={review.rating} readOnly size="sm" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-xs text-green-600 flex items-center gap-0.5">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Purchase
                  </span>
                </div>
                {review.reviewText && (
                  <p className="text-sm text-muted-foreground mt-1">{review.reviewText}</p>
                )}
              </div>

              {/* Delete button for own reviews or artist */}
              {(isOwner || (isAuthenticated && canReviewQuery.data?.reason === "already_reviewed")) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(review.id)}
                  className="text-xs text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                  title="Delete review"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
