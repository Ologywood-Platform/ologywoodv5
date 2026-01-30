import { Star, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface RecommendedArtist {
  artistId: number;
  artistName: string;
  similarity: number;
  matchReasons: string[];
  averageRating: number;
  genre?: string[];
  feeRangeMin?: number;
  feeRangeMax?: number;
  profilePhotoUrl?: string;
}

interface ArtistRecommendationsProps {
  recommendations: RecommendedArtist[];
  isLoading?: boolean;
  onArtistClick?: (artistId: number) => void;
}

export function ArtistRecommendations({
  recommendations,
  isLoading = false,
  onArtistClick,
}: ArtistRecommendationsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommended Artists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Finding similar artists...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recommended Artists
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No similar artists found yet.</p>
            <p className="text-sm mt-2">More recommendations will appear as you explore.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Recommended Artists ({recommendations.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Based on genre, fee range, and quality ratings
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((artist) => (
            <div
              key={artist.artistId}
              className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{artist.artistName}</h4>
                  {artist.genre && artist.genre.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {artist.genre.slice(0, 3).join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">{artist.similarity}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Match</p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(artist.averageRating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">{artist.averageRating.toFixed(1)}</span>
              </div>

              {/* Match Reasons */}
              {artist.matchReasons.length > 0 && (
                <div className="mb-3 space-y-1">
                  {artist.matchReasons.map((reason, idx) => (
                    <p key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {reason}
                    </p>
                  ))}
                </div>
              )}

              {/* Fee Range */}
              {artist.feeRangeMin && artist.feeRangeMax && (
                <p className="text-sm text-muted-foreground mb-3">
                  Fee: ${artist.feeRangeMin.toLocaleString()} - ${artist.feeRangeMax.toLocaleString()}
                </p>
              )}

              {/* View Button */}
              <Button
                onClick={() => onArtistClick?.(artist.artistId)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                View Profile
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
