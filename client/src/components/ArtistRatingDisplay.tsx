import { Star, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface Rating {
  id: number;
  rating: number;
  comment?: string;
  venueId: number;
  venueName?: string;
  createdAt: Date;
}

interface ArtistRatingDisplayProps {
  artistId: number;
  ratings: Rating[];
  averageRating: number;
  totalRatings: number;
  isLoading?: boolean;
}

export function ArtistRatingDisplay({
  ratings,
  averageRating,
  totalRatings,
  isLoading = false,
}: ArtistRatingDisplayProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ratings & Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading ratings...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Ratings & Reviews</span>
          <span className="text-sm font-normal text-muted-foreground">
            {totalRatings} review{totalRatings !== 1 ? 's' : ''}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating Summary */}
        {totalRatings > 0 ? (
          <div className="space-y-4">
            {/* Average Rating */}
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = ratings.filter(r => r.rating === stars).length;
                  const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-8">{stars}★</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Individual Reviews */}
            <div className="space-y-4 mt-6 border-t pt-6">
              {ratings.length > 0 ? (
                ratings.map((review) => (
                  <div key={review.id} className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {review.venueName || 'Anonymous Venue'}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-foreground">{review.comment}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No reviews yet. Be the first to review this artist!</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No ratings yet</p>
            <p className="text-sm">Ratings will appear here after the first booking</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
