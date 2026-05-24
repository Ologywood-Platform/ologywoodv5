import { useState } from 'react';
import { Star } from 'lucide-react';
import { trpc } from '../lib/trpc';

interface ArtistReviewFormProps {
  bookingId: number;
  artistId: number;
  artistName: string;
  onSuccess?: () => void;
}

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400 w-40">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5"
          >
            <Star
              className={`w-5 h-5 ${
                star <= (hover || value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ArtistReviewForm({ bookingId, artistId, artistName, onSuccess }: ArtistReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [reliabilityRating, setReliabilityRating] = useState(0);
  const [stagePresenceRating, setStagePresenceRating] = useState(0);
  const [crowdEngagementRating, setCrowdEngagementRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const createReview = trpc.artistReview.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      onSuccess?.();
    },
  });

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
        <p className="text-green-700 dark:text-green-300 font-medium">Thank you for your review!</p>
        <p className="text-sm text-green-600 dark:text-green-400 mt-1">Your feedback helps the community.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Rate {artistName}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">How was your experience working with this artist?</p>

      <div className="space-y-3 mb-4">
        <StarRating value={rating} onChange={setRating} label="Overall Rating" />
        <StarRating value={reliabilityRating} onChange={setReliabilityRating} label="Reliability" />
        <StarRating value={stagePresenceRating} onChange={setStagePresenceRating} label="Stage Presence" />
        <StarRating value={crowdEngagementRating} onChange={setCrowdEngagementRating} label="Crowd Engagement" />
        <StarRating value={professionalismRating} onChange={setProfessionalismRating} label="Professionalism" />
      </div>

      <textarea
        value={reviewText}
        onChange={(e) => setReviewText(e.target.value)}
        placeholder="Share your experience working with this artist (optional)..."
        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
        rows={3}
      />

      <button
        onClick={() => createReview.mutate({
          bookingId,
          artistId,
          rating,
          reliabilityRating: reliabilityRating || undefined,
          stagePresenceRating: stagePresenceRating || undefined,
          crowdEngagementRating: crowdEngagementRating || undefined,
          professionalismRating: professionalismRating || undefined,
          reviewText: reviewText || undefined,
        })}
        disabled={rating === 0 || createReview.isPending}
        className="mt-3 w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
      >
        {createReview.isPending ? 'Submitting...' : 'Submit Review'}
      </button>

      {createReview.isError && (
        <p className="text-red-500 text-sm mt-2">{createReview.error.message}</p>
      )}
    </div>
  );
}
