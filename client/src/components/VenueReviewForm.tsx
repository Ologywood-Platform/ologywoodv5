import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

interface VenueReviewFormProps {
  bookingId: number;
  venueId: number;
  venueName: string;
  onReviewSubmitted: () => void;
}

const CATEGORIES = [
  { key: 'professionalism', label: 'Professionalism', description: 'Communication, punctuality, organization' },
  { key: 'soundQuality', label: 'Sound Quality', description: 'PA system, monitors, acoustics' },
  { key: 'greenRoom', label: 'Green Room', description: 'Backstage amenities, comfort, hospitality' },
  { key: 'paymentTimeliness', label: 'Payment Timeliness', description: 'Paid on time per contract terms' },
] as const;

function StarRating({ value, onChange, size = 'md' }: { value: number; onChange: (v: number) => void; size?: 'sm' | 'md' }) {
  const [hovered, setHovered] = useState(0);
  const starSize = size === 'sm' ? 'w-5 h-5' : 'w-8 h-8';

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${starSize} ${
              star <= (hovered || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function VenueReviewForm({ bookingId, venueId, venueName, onReviewSubmitted }: VenueReviewFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [categoryRatings, setCategoryRatings] = useState<Record<string, number>>({
    professionalism: 0,
    soundQuality: 0,
    greenRoom: 0,
    paymentTimeliness: 0,
  });
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const createReviewMutation = trpc.venueReview.create.useMutation({
    onSuccess: () => {
      toast.success('Venue review submitted successfully!');
      setSubmitted(true);
      onReviewSubmitted();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit review');
    },
  });

  if (submitted) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${
                  star <= overallRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <h3 className="font-semibold text-lg mb-1">Thank you for your review!</h3>
          <p className="text-sm text-muted-foreground">Your feedback helps other artists make informed decisions.</p>
        </CardContent>
      </Card>
    );
  }

  const handleCategoryChange = (key: string, value: number) => {
    const updated = { ...categoryRatings, [key]: value };
    setCategoryRatings(updated);
    
    // Auto-calculate overall as average of filled categories
    const filled = Object.values(updated).filter(v => v > 0);
    if (filled.length > 0) {
      setOverallRating(Math.round(filled.reduce((a, b) => a + b, 0) / filled.length));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (overallRating === 0) {
      toast.error('Please provide at least an overall rating');
      return;
    }

    createReviewMutation.mutate({
      bookingId,
      venueId,
      rating: overallRating,
      professionalismRating: categoryRatings.professionalism || undefined,
      soundQualityRating: categoryRatings.soundQuality || undefined,
      greenRoomRating: categoryRatings.greenRoom || undefined,
      paymentTimelinessRating: categoryRatings.paymentTimeliness || undefined,
      reviewText: reviewText.trim() || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Review {venueName}</CardTitle>
        <p className="text-sm text-muted-foreground">Rate your experience working with this venue</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category Ratings */}
          <div className="space-y-3">
            {CATEGORIES.map((cat) => (
              <div key={cat.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{cat.label}</p>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </div>
                <div className="shrink-0">
                  <StarRating
                    value={categoryRatings[cat.key]}
                    onChange={(v) => handleCategoryChange(cat.key, v)}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t pt-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4">
              <div>
                <p className="font-medium">Overall Rating</p>
                <p className="text-xs text-muted-foreground">Auto-calculated or set manually</p>
              </div>
              <div className="shrink-0">
                <StarRating value={overallRating} onChange={setOverallRating} />
              </div>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Additional Comments (Optional)
            </label>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your experience working with this venue..."
              rows={3}
              maxLength={1000}
              className="resize-none break-words"
              style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {reviewText.length}/1000 characters
            </p>
          </div>

          <Button
            type="submit"
            disabled={createReviewMutation.isPending || overallRating === 0}
            className="w-full"
          >
            {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
