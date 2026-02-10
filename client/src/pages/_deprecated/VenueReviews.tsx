import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, ThumbsUp } from 'lucide-react';

interface Review {
  id: number;
  artistName: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  helpful: number;
  verified: boolean;
}

interface VenueReview {
  id: number;
  venueName: string;
  location: string;
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
}

const mockVenueReviews: VenueReview[] = [
  {
    id: 1,
    venueName: 'The Blue Room',
    location: 'Los Angeles, CA',
    averageRating: 4.8,
    totalReviews: 24,
    reviews: [
      {
        id: 1,
        artistName: 'Sarah Johnson',
        rating: 5,
        title: 'Perfect intimate venue!',
        content: 'The Blue Room provided an amazing experience for our acoustic set. The sound quality was excellent, the staff was professional, and the audience was engaged. Highly recommend!',
        date: '2024-01-15',
        helpful: 12,
        verified: true
      },
      {
        id: 2,
        artistName: 'The Jazz Collective',
        rating: 5,
        title: 'Great atmosphere and support',
        content: 'Fantastic venue with incredible lighting and sound. The management was super helpful with setup and technical requirements. Will definitely book again!',
        date: '2024-01-10',
        helpful: 8,
        verified: true
      },
      {
        id: 3,
        artistName: 'Mike Chen',
        rating: 4,
        title: 'Solid venue, minor parking issues',
        content: 'Great performance space and supportive crowd. Only downside was parking availability on weekends. Otherwise, highly recommended!',
        date: '2024-01-05',
        helpful: 5,
        verified: true
      }
    ]
  },
  {
    id: 2,
    venueName: 'Sunset Theater',
    location: 'Los Angeles, CA',
    averageRating: 4.9,
    totalReviews: 42,
    reviews: [
      {
        id: 1,
        artistName: 'Emma Williams',
        rating: 5,
        title: 'Stunning historic venue',
        content: 'Performed at Sunset Theater last month and it was absolutely incredible. The acoustics are phenomenal, the technical team is top-notch, and the venue has so much character.',
        date: '2024-01-12',
        helpful: 18,
        verified: true
      },
      {
        id: 2,
        artistName: 'Rock Band X',
        rating: 5,
        title: 'Professional all the way',
        content: 'From booking to performance, everything was handled professionally. The stage setup was perfect, lighting was great, and the audience was fantastic.',
        date: '2024-01-08',
        helpful: 14,
        verified: true
      }
    ]
  }
];

export function VenueReviews() {
  const [, navigate] = useLocation();
  const [selectedVenue, setSelectedVenue] = useState<VenueReview | null>(mockVenueReviews[0]);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const [filterRating, setFilterRating] = useState<number | null>(null);

  const filteredReviews = selectedVenue?.reviews
    .filter(review => !filterRating || review.rating === filterRating)
    .sort((a, b) => {
      switch (sortBy) {
        case 'helpful':
          return b.helpful - a.helpful;
        case 'rating':
          return b.rating - a.rating;
        case 'recent':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    }) || [];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Venue Reviews & Ratings</h1>
          <p className="text-lg text-slate-600">
            Read authentic reviews from artists who have performed at our venues
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Venue List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Venues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockVenueReviews.map((venue) => (
                  <button
                    key={venue.id}
                    onClick={() => setSelectedVenue(venue)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedVenue?.id === venue.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <div className="font-semibold">{venue.venueName}</div>
                    <div className="text-sm opacity-75 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-current" />
                      {venue.averageRating} ({venue.totalReviews})
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Reviews */}
          <div className="lg:col-span-3">
            {selectedVenue && (
              <div className="space-y-6">
                {/* Venue Header */}
                <Card>
                  <CardContent className="pt-6">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2">
                      {selectedVenue.venueName}
                    </h2>
                    <p className="text-slate-600 mb-4">{selectedVenue.location}</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {renderStars(Math.round(selectedVenue.averageRating))}
                        <span className="text-2xl font-bold text-slate-900">
                          {selectedVenue.averageRating}
                        </span>
                      </div>
                      <span className="text-slate-600">
                        Based on {selectedVenue.totalReviews} reviews
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Filters and Sort */}
                <div className="flex flex-wrap gap-3">
                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-slate-900 self-center">Filter:</span>
                    <Button
                      onClick={() => setFilterRating(null)}
                      variant={filterRating === null ? 'default' : 'outline'}
                      size="sm"
                    >
                      All
                    </Button>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <Button
                        key={rating}
                        onClick={() => setFilterRating(rating)}
                        variant={filterRating === rating ? 'default' : 'outline'}
                        size="sm"
                      >
                        {rating}★
                      </Button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <span className="text-sm font-semibold text-slate-900 self-center">Sort:</span>
                    <Button
                      onClick={() => setSortBy('recent')}
                      variant={sortBy === 'recent' ? 'default' : 'outline'}
                      size="sm"
                    >
                      Recent
                    </Button>
                    <Button
                      onClick={() => setSortBy('helpful')}
                      variant={sortBy === 'helpful' ? 'default' : 'outline'}
                      size="sm"
                    >
                      Helpful
                    </Button>
                    <Button
                      onClick={() => setSortBy('rating')}
                      variant={sortBy === 'rating' ? 'default' : 'outline'}
                      size="sm"
                    >
                      Rating
                    </Button>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {filteredReviews.length > 0 ? (
                    filteredReviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-900">
                                  {review.artistName}
                                </span>
                                {review.verified && (
                                  <Badge className="bg-green-100 text-green-800">
                                    Verified Artist
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {renderStars(review.rating)}
                                <span className="text-sm text-slate-500">
                                  {new Date(review.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>

                          <h3 className="font-semibold text-slate-900 mb-2">{review.title}</h3>
                          <p className="text-slate-600 mb-4">{review.content}</p>

                          <div className="flex items-center gap-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-600 hover:text-blue-500"
                            >
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              Helpful ({review.helpful})
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-600 hover:text-blue-500"
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-slate-600">No reviews match your filters</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Write Review CTA */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-slate-900 mb-2">Have you performed here?</h3>
                    <p className="text-slate-600 mb-4">
                      Share your experience and help other artists make informed decisions
                    </p>
                    <Button 
                      onClick={() => navigate('/demo-venue')}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      Write a Review
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
