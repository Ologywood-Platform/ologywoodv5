import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import ReviewResponseForm from "@/components/ReviewResponseForm";

interface ReviewsTabContentProps {
  artistId?: number;
}

export default function ReviewsTabContent({ artistId }: ReviewsTabContentProps) {
  const { data: reviews, refetch } = trpc.review.getByArtist.useQuery(
    { artistId: artistId! },
    { enabled: !!artistId }
  );
  
  const { data: avgRating } = trpc.review.getAverageRating.useQuery(
    { artistId: artistId! },
    { enabled: !!artistId }
  );

  if (!artistId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Complete your artist profile to view reviews
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Reviews & Ratings</h2>
        <p className="text-muted-foreground">
          View and respond to reviews from venues
        </p>
      </div>

      {avgRating && avgRating.count > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-bold">{avgRating.average.toFixed(1)}</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(avgRating.average)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {avgRating.count} {avgRating.count === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {reviews && reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.reviewText && (
                  <CardDescription className="text-base">
                    {review.reviewText}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <ReviewResponseForm
                  reviewId={review.id}
                  existingResponse={review.artistResponse}
                  onResponseSubmitted={() => refetch()}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center">
              No reviews yet. Complete bookings to receive reviews from venues.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
