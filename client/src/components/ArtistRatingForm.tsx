import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface ArtistRatingFormProps {
  artistId: number;
  bookingId: number;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ArtistRatingForm({
  artistId,
  bookingId,
  onSubmit,
  isLoading = false,
  disabled = false,
}: ArtistRatingFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      setSubmitError('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await onSubmit(rating, comment);
      setSubmitSuccess(true);
      setRating(0);
      setComment('');
      
      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to submit rating'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-green-800 font-medium">
              Thank you for your rating! Your feedback helps other venues find great artists.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rate This Artist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium mb-3">Your Rating</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                disabled={disabled || isSubmitting}
                className="transition-transform hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]} rating
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium mb-2">Your Review (Optional)</label>
          <Textarea
            placeholder="Share your experience with this artist... (e.g., professionalism, performance quality, communication)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={disabled || isSubmitting}
            className="min-h-24"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={disabled || isSubmitting || rating === 0}
          className="w-full"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Your rating helps other venues make informed decisions and helps artists improve their services.
        </p>
      </CardContent>
    </Card>
  );
}
