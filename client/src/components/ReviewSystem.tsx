import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Star, Upload, Trash2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: number;
  authorName: string;
  authorRole: 'artist' | 'venue';
  rating: number;
  title: string;
  content: string;
  photos?: string[];
  createdAt: string;
  helpful: number;
  verified: boolean;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface ReviewSystemProps {
  targetId: number;
  targetType: 'artist' | 'venue';
  onReviewSubmitted?: (review: Review) => void;
}

export function ReviewSystem({ targetId, targetType, onReviewSubmitted }: ReviewSystemProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos([...photos, ...Array.from(e.target.files)]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSubmitReview = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // In production, call API to submit review
      // const response = await fetch(`/api/reviews`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     targetId,
      //     targetType,
      //     rating,
      //     title,
      //     content,
      //     photos
      //   })
      // });

      const newReview: Review = {
        id: Math.random(),
        authorName: 'You',
        authorRole: 'venue',
        rating,
        title,
        content,
        photos: [],
        createdAt: new Date().toLocaleDateString(),
        helpful: 0,
        verified: true,
      };

      setReviews([newReview, ...reviews]);
      setTitle('');
      setContent('');
      setRating(5);
      setPhotos([]);
      setShowForm(false);
      toast.success('Review submitted successfully');
      onReviewSubmitted?.(newReview);
    } catch (error) {
      toast.error('Failed to submit review');
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
    return stats.totalReviews > 0
      ? Math.round((ratingCount / stats.totalReviews) * 100)
      : 0;
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Reviews & Ratings</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Average Rating */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold mb-2">{stats.averageRating.toFixed(1)}</div>
            {renderStars(Math.round(stats.averageRating))}
            <p className="text-sm text-gray-600 mt-2">
              Based on {stats.totalReviews} reviews
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="md:col-span-2 space-y-2">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-2">
                <span className="text-sm font-medium w-8">{rating}★</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 h-2 rounded-full"
                    style={{
                      width: `${getRatingPercentage(stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution])}%`,
                    }}
                  />
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {getRatingPercentage(stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution])}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Write Review Button */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full">
          <MessageCircle className="h-4 w-4 mr-2" />
          Write a Review
        </Button>
      )}

      {/* Review Form */}
      {showForm && (
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
            />
          </div>

          {/* Photos */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Add Photos (Optional)</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Click to upload photos</span>
                </div>
              </label>
            </div>

            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Preview ${index}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSubmitReview}
              disabled={loading}
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
        {reviews.length > 0 ? (
          reviews.map(review => (
            <Card key={review.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold">{review.title}</div>
                  <div className="text-sm text-gray-600">
                    {review.authorName} • {review.createdAt}
                    {review.verified && (
                      <Badge className="ml-2 bg-green-100 text-green-800">
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
                {renderStars(review.rating)}
              </div>

              <p className="text-sm text-gray-700 mb-3">{review.content}</p>

              {review.photos && review.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {review.photos.map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Review photo ${index}`}
                      className="w-full h-20 object-cover rounded"
                    />
                  ))}
                </div>
              )}

              <div className="text-sm text-gray-500">
                {review.helpful} people found this helpful
              </div>
            </Card>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No reviews yet. Be the first to share your experience!
          </p>
        )}
      </div>
    </div>
  );
}
