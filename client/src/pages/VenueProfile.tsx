import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Building2, Users, Star, Wifi, Zap, Accessibility, ParkingCircle, Volume2, Music } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { useParams, useLocation } from 'wouter';
import { ProfileHeaderSkeleton, ProfileSectionSkeleton } from '@/components/SkeletonLoader';

export default function VenueProfile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const venueId = id ? parseInt(id, 10) : 0;

  const { data: venueProfile, isLoading } = trpc.venue.getById.useQuery({ id: venueId }, { enabled: venueId > 0 });
  const { data: venueReviews } = trpc.venueReview.getByVenue.useQuery({ venueId }, { enabled: venueId > 0 });
  const { data: averageRating } = trpc.venueReview.getAverageRating.useQuery({ venueId }, { enabled: venueId > 0 });

  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');

  const respondMutation = trpc.venueReview.respondToReview.useMutation({
    onSuccess: () => {
      toast.success('Response submitted successfully');
      setRespondingTo(null);
      setResponseText('');
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit response');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <ProfileHeaderSkeleton />
        <ProfileSectionSkeleton />
        <ProfileSectionSkeleton />
      </div>
    );
  }

  const handleRespond = (reviewId: number) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    respondMutation.mutate({
      reviewId,
      response: responseText.trim(),
    });
  };

  if (!venueId || venueId === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Invalid venue ID</p>
          <Button onClick={() => navigate('/browse')}>Back to Browse</Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading venue profile...</p>
        </div>
      </div>
    );
  }

  if (!venueProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Venue not found</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  const isVenueOwner = user?.role === 'venue' && venueProfile.userId === user.id;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <img src="/logo-icon.png" alt="Ologywood" className="h-8 w-8 rounded" />
            Ologywood
          </a>
          <Button variant="ghost" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Venue Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{venueProfile.organizationName}</CardTitle>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Contact: {venueProfile.contactName}</span>
                </div>
              </div>
              {averageRating && averageRating.count > 0 && (
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-2xl font-bold">
                      {averageRating.average.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {averageRating.count} {averageRating.count === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {venueProfile.contactPhone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>📞 {venueProfile.contactPhone}</span>
              </div>
            )}
            
            {venueProfile.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>🌐 <a href={venueProfile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{venueProfile.website}</a></span>
              </div>
            )}
            
            {venueProfile.bio && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">{venueProfile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Venue Amenities & Details for Artists */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Venue Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Venue Type</p>
                    <p className="text-sm text-muted-foreground">Concert Hall / Event Space</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Capacity</p>
                    <p className="text-sm text-muted-foreground">Up to 500 guests</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">Location</p>
                    <p className="text-sm text-muted-foreground">{venueProfile.location || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Amenities & Facilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span className="text-sm">Power Supply</span>
              </div>
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-primary" />
                <span className="text-sm">WiFi Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                <span className="text-sm">Sound System</span>
              </div>
              <div className="flex items-center gap-2">
                <Accessibility className="h-5 w-5 text-primary" />
                <span className="text-sm">Accessible</span>
              </div>
              <div className="flex items-center gap-2">
                <ParkingCircle className="h-5 w-5 text-primary" />
                <span className="text-sm">Parking Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                <span className="text-sm">Stage Setup</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        {venueProfile.mediaGallery && venueProfile.mediaGallery.photos && venueProfile.mediaGallery.photos.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Photo Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {venueProfile.mediaGallery.photos.map((photo: string, idx: number) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`${venueProfile.organizationName} photo ${idx + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Artist Reviews Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What Artists Say</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Read reviews from artists who have performed at this venue</p>
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle>Reviews from Artists</CardTitle>
          </CardHeader>
          <CardContent>
            {venueReviews && venueReviews.length > 0 ? (
              <div className="space-y-6">
                {venueReviews.map((review) => (
                  <div key={review.id} className="border-b pb-6 last:border-b-0">
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
                    
                    {review.comment && (
                      <p className="text-muted-foreground mb-3">{review.comment}</p>
                    )}

                    {/* Venue Response */}
                    {false ? (
                      <div className="bg-muted p-4 rounded-lg mt-3">
                        <p className="text-sm font-semibold mb-1">Response from {venueProfile?.organizationName}</p>
                        <p className="text-sm text-muted-foreground">Venue response not available</p>
                        {false && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Responded on {new Date().toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ) : isVenueOwner && (
                      <div className="mt-3">
                        {respondingTo === review.id ? (
                          <div className="space-y-2">
                            <Textarea
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              placeholder="Write your response..."
                              rows={3}
                              maxLength={1000}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRespond(review.id)}
                                disabled={respondMutation.isPending}
                              >
                                {respondMutation.isPending ? 'Submitting...' : 'Submit Response'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRespondingTo(null);
                                  setResponseText('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRespondingTo(review.id)}
                          >
                            Respond to Review
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No reviews yet. Be the first to review this venue!
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
