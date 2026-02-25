import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Star, MessageCircle, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { trpc } from '@/lib/trpc';

interface ReviewSystemProps {
  targetId: number;
  targetType: 'artist' | 'venue';
  onReviewSubmitted?: () => void;
}

export function ReviewSystem({ targetId, targetType, onReviewSubmitted }: ReviewSystemProps) {
  const { user, isAuthenticated } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch reviews from the database
  const reviewsQuery = trpc.review.getByArtist.useQuery(
    { artistId: targetId },
    { enabled: targetType === 'artist' }
  );

  // Fetch average rating
  const ratingQuery = trpc.review.getAverageRating.useQuery(
    { artistId: targetId },
    { enabled: targetType === 'artist' }
  );

  // Create review mutation
  const createReviewMutation = trpc.review.createFromProfile.useMutation({
    onSuccess: () => {
      toast.success('Review submitted successfully!');
      setTitle('');
      setContent('');
      setRating(5);
      setShowForm(false);
      // Refetch reviews and rating
      reviewsQuery.refetch();
      ratingQuery.refetch();
      onReviewSubmitted?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit review');
    },
  });

  const reviews = reviewsQuery.data || [];
  const averageRating = ratingQuery.data?.averageRating || 0;
  const totalReviews = ratingQuery.data?.reviewCount || 0;

  // Determine if the current user can leave a review
  const canReview = isAuthenticated && user && (
    (targetType === 'artist' && user.role === 'venue') ||
    (targetType === 'venue' && user.role === 'artist')
  );

  const reviewerRole = targetType === 'artist' ? 'venue' : 'artist';

  // Calculate rating distribution from actual reviews
  const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r: any) => {
    const rVal = r.rating as 1 | 2 | 3 | 4 | 5;
    if (rVal >= 1 && rVal <= 5) {
      ratingDistribution[rVal]++;
    }
  });

  const handleSubmitReview = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await createReviewMutation.mutateAsync({
        artistId: targetId,
        rating,
        title: title.trim(),
        reviewText: content.trim(),
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (count: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => interactive && setRating(star)}
            className={`${interactive ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <Star
              className={`h-5 w-5 ${
                star <= count
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getRatingPercentage = (ratingCount: number) => {
    return totalReviews > 0
      ? Math.round((ratingCount / totalReviews) * 100)
      : 0;
  };

  // Parse review comment to extract title and content
  const parseReviewComment = (comment: string | null) => {
    if (!comment) return { title: '', content: '' };
    const parts = comment.split('\n\n');
    if (parts.length >= 2) {
      return { title: parts[0], content: parts.slice(1).join('\n\n') };
    }
    return { title: '', content: comment };
  };

  const renderReviewPrompt = () => {
    // Case 1: Not logged in
    if (!isAuthenticated) {
      return (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="text-center space-y-3">
            <MessageCircle className="h-8 w-8 text-purple-500 mx-auto" />
            <h4 className="font-semibold text-lg">Have you worked with this {targetType}?</h4>
            <p className="text-sm text-muted-foreground">
              Sign up as a {reviewerRole} to share your experience and help others make informed booking decisions.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Button
                onClick={() => { window.location.href = getLoginUrl(window.location.pathname); }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => { window.location.href = getLoginUrl(window.location.pathname); }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </div>
          </div>
        </Card>
      );
    }

    // Case 2: Logged in but wrong role
    if (!canReview) {
      return (
        <Card className="p-6 bg-gray-50 border-gray-200">
          <div className="text-center space-y-2">
            <MessageCircle className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="text-sm text-muted-foreground">
              Only registered {reviewerRole}s who have worked with this {targetType} can leave reviews.
            </p>
          </div>
        </Card>
      );
    }

    // Case 3: Logged in as correct role — show the Leave a Review button
    if (!showForm) {
      return (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <MessageCircle className="h-4 w-4 mr-2" />
          Leave a Review
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Reviews & Ratings</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Rating */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
            {renderStars(Math.round(averageRating))}
            <p className="text-sm text-gray-600 mt-2">
              Based on {totalReviews} review{totalReviews !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="md:col-span-2 space-y-2">
            {[5, 4, 3, 2, 1].map(r => (
              <div key={r} className="flex items-center gap-2">
                <span className="text-sm font-medium w-8">{r}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${getRatingPercentage(ratingDistribution[r as keyof typeof ratingDistribution])}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {getRatingPercentage(ratingDistribution[r as keyof typeof ratingDistribution])}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Review Prompt (auth-aware) */}
      {renderReviewPrompt()}

      {/* Review Form — only shown when canReview and showForm is true */}
      {showForm && canReview && (
        <Card className="p-6 border-blue-200 bg-blue-50">
          <h4 className="font-semibold mb-4">Share Your Experience</h4>

          {/* Rating */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Rating</label>
            {renderStars(rating, true)}
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Title</label>
            <Input
              placeholder="Summarize your experience"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Content */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Your Review</label>
            <Textarea
              placeholder="Share details about your experience..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">{content.length}/2000 characters</p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitReview}
              disabled={loading || !title.trim() || !content.trim()}
              className="flex-1"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h4 className="font-semibold">Recent Reviews</h4>
        {reviewsQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-full mb-1" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review: any) => {
            const parsed = parseReviewComment(review.comment);
            return (
              <Card key={review.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    {parsed.title && (
                      <div className="font-semibold">{parsed.title}</div>
                    )}
                    <div className="text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleDateString()}
                      {review.bookingId && (
                        <Badge className="ml-2 bg-green-100 text-green-800">
                          Verified Booking
                        </Badge>
                      )}
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>

                <p className="text-sm text-gray-700 mb-3">
                  {parsed.content || review.comment}
                </p>

                {review.artistResponse && (
                  <div className="mt-3 pl-4 border-l-2 border-purple-300 bg-purple-50 p-3 rounded-r">
                    <p className="text-xs font-semibold text-purple-700 mb-1">Artist Response</p>
                    <p className="text-sm text-gray-700">{review.artistResponse}</p>
                  </div>
                )}
              </Card>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No reviews yet. Be the first to share your experience!
          </p>
        )}
      </div>
    </div>
  );
}
