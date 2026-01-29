import { Star } from 'lucide-react';
import { Badge } from './ui/badge';

interface RatingDisplayProps {
  averageRating?: number;
  totalReviews?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RatingDisplay({
  averageRating = 0,
  totalReviews = 0,
  size = 'md',
  showLabel = true,
}: RatingDisplayProps) {
  const rating = Math.round(averageRating * 10) / 10;
  const displayRating = Math.min(5, Math.max(0, rating));

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= Math.floor(displayRating)
                ? 'fill-yellow-400 text-yellow-400'
                : star - displayRating < 1
                ? 'fill-yellow-200 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>

      {showLabel && (
        <div className="flex items-center gap-1">
          <span className={`font-semibold ${textSizeClasses[size]}`}>
            {displayRating.toFixed(1)}
          </span>
          {totalReviews > 0 && (
            <span className={`text-gray-500 ${textSizeClasses[size]}`}>
              ({totalReviews})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface RatingBadgeProps {
  averageRating?: number;
  totalReviews?: number;
}

export function RatingBadge({ averageRating = 0, totalReviews = 0 }: RatingBadgeProps) {
  const rating = Math.round(averageRating * 10) / 10;

  if (rating === 0 || totalReviews === 0) {
    return (
      <Badge variant="outline" className="text-xs">
        No ratings yet
      </Badge>
    );
  }

  return (
    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
      <Star className="h-3 w-3 fill-yellow-500 text-yellow-500 mr-1" />
      {rating.toFixed(1)} ({totalReviews})
    </Badge>
  );
}
