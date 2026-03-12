import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Building2, Users, Star, Wifi, Zap, Accessibility, ParkingCircle, Volume2, Music, Share2, X, ChevronLeft, ChevronRight, ImageIcon, Clock, UtensilsCrossed, TreePine, Truck, Shirt, Lightbulb, Check } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { useParams, useLocation } from 'wouter';
import { ProfileHeaderSkeleton, ProfileSectionSkeleton } from '@/components/SkeletonLoader';
import { ShareVenueModal } from '@/components/ShareVenueModal';
import { trpc } from '@/lib/trpc';
import { JsonLd, buildVenueJsonLd, buildBreadcrumbJsonLd } from '@/components/JsonLd';
import SiteHeader from '@/components/SiteHeader';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';
import Footer from '@/components/Footer';

export default function VenueProfile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const venueId = id ? parseInt(id, 10) : 0;

  const { data: venueProfile, isLoading } = trpc.venue.getById.useQuery({ id: venueId }, { enabled: venueId > 0 });
  const { data: venueReviews } = trpc.venueReview.getByVenue.useQuery({ venueId }, { enabled: venueId > 0 });
  const { data: averageRating } = trpc.venueReview.getAverageRating.useQuery({ venueId }, { enabled: venueId > 0 });

  // Set SEO meta tags when venue data loads
  useEffect(() => {
    if (venueProfile) {
      setMetaTags(pageMetaTags.venueProfile(venueProfile.organizationName || 'Venue', venueId));
    }
  }, [venueProfile, venueId]);

  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [shareVenueOpen, setShareVenueOpen] = useState(false);
  const [galleryLightbox, setGalleryLightbox] = useState<number | null>(null);

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

  const isVenueOwner = user?.role === 'venue' && (venueProfile as any)?.userId === user.id;

  return (
    <div className="min-h-screen bg-background">
      {venueProfile && <JsonLd data={[buildVenueJsonLd(venueProfile), buildBreadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: 'Browse Venues', url: '/venues' }, { name: venueProfile.organizationName, url: `/venue/${venueId}` }])]} id={`venue-${venueId}`} />}
      {/* Shared Header with Following link */}
      <SiteHeader
        extraNav={
          <>
            <Button variant="ghost" size="sm" onClick={() => setShareVenueOpen(true)} className="gap-1 text-xs sm:text-sm px-2 sm:px-4">
              <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </>
        }
      />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Browse Venues', href: '/venues' },
            { label: venueProfile?.organizationName || 'Venue' },
          ]}
        />
        {/* Venue Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <CardTitle className="text-2xl sm:text-3xl mb-2">{venueProfile.organizationName}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span>Contact: {(venueProfile as any)?.contactName}</span>
                </div>
              </div>
              {averageRating && typeof averageRating === 'object' && 'reviewCount' in averageRating && averageRating.reviewCount > 0 && (
                <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:text-right">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="text-xl sm:text-2xl font-bold">
                      {(averageRating as { averageRating: number; reviewCount: number }).averageRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(averageRating as { averageRating: number; reviewCount: number }).reviewCount} {(averageRating as { averageRating: number; reviewCount: number }).reviewCount === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {(venueProfile as any)?.contactPhone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>📞 {(venueProfile as any)?.contactPhone}</span>
              </div>
            )}
            
            {(venueProfile as any)?.website && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>🌐 <a href={(venueProfile as any)?.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{(venueProfile as any)?.website}</a></span>
              </div>
            )}
            
            {venueProfile.bio && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">{venueProfile.bio}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Venue Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Venue Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                {(venueProfile as any)?.venueType && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Venue Type</p>
                      <p className="text-sm text-muted-foreground">{(venueProfile as any).venueType}</p>
                    </div>
                  </div>
                )}
                {(venueProfile as any)?.capacity && (venueProfile as any).capacity > 0 && (
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Capacity</p>
                      <p className="text-sm text-muted-foreground">Up to {(venueProfile as any).capacity.toLocaleString()} guests</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {(venueProfile as any)?.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Location</p>
                      <p className="text-sm text-muted-foreground">{(venueProfile as any).location}</p>
                    </div>
                  </div>
                )}
                {(venueProfile as any)?.operatingHours && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold">Operating Hours</p>
                      <p className="text-sm text-muted-foreground">{(venueProfile as any).operatingHours}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Amenities */}
        {(() => {
          const amenities = (venueProfile as any)?.amenities;
          const amenityList = amenities
            ? (typeof amenities === 'object' && !Array.isArray(amenities)
                ? Object.keys(amenities).filter(k => amenities[k])
                : Array.isArray(amenities) ? amenities : [])
            : [];
          if (amenityList.length === 0) return null;

          const amenityIcons: Record<string, any> = {
            'Stage': Music,
            'Sound System': Volume2,
            'Lighting': Lightbulb,
            'Parking': ParkingCircle,
            'Green Room': Shirt,
            'Wi-Fi': Wifi,
            'Bar': UtensilsCrossed,
            'Kitchen': UtensilsCrossed,
            'Outdoor Space': TreePine,
            'Wheelchair Accessible': Accessibility,
            'Dressing Room': Shirt,
            'Loading Dock': Truck,
          };

          return (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Amenities & Facilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {amenityList.map((amenity: string) => {
                    const IconComponent = amenityIcons[amenity] || Check;
                    return (
                      <div key={amenity} className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        <span className="text-sm">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Photo Gallery */}
        {(() => {
          const gallery = (venueProfile as any)?.mediaGallery;
          const photos = gallery?.photos || [];
          if (photos.length === 0) return null;
          return (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Photo Gallery
                  <Badge variant="secondary" className="ml-2">{photos.length} photos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Hero image + grid layout */}
                {photos.length === 1 ? (
                  <img
                    src={photos[0].url || photos[0]}
                    alt={photos[0].caption || `${(venueProfile as any)?.organizationName} photo`}
                    className="w-full h-64 sm:h-80 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => setGalleryLightbox(0)}
                  />
                ) : photos.length <= 3 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {photos.map((photo: any, idx: number) => (
                      <img
                        key={photo.id || idx}
                        src={photo.url || photo}
                        alt={photo.caption || `${(venueProfile as any)?.organizationName} photo ${idx + 1}`}
                        className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setGalleryLightbox(idx)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-2 row-span-2">
                      <img
                        src={photos[0].url || photos[0]}
                        alt={photos[0].caption || `${(venueProfile as any)?.organizationName} featured photo`}
                        className="w-full h-full min-h-[280px] object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setGalleryLightbox(0)}
                      />
                    </div>
                    {photos.slice(1, 5).map((photo: any, idx: number) => (
                      <div key={photo.id || idx} className="relative">
                        <img
                          src={photo.url || photo}
                          alt={photo.caption || `${(venueProfile as any)?.organizationName} photo ${idx + 2}`}
                          className="w-full h-[136px] object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => setGalleryLightbox(idx + 1)}
                        />
                        {idx === 3 && photos.length > 5 && (
                          <div
                            className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-black/60 transition-colors"
                            onClick={() => setGalleryLightbox(4)}
                          >
                            <span className="text-white text-lg font-semibold">+{photos.length - 5} more</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

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
                        <p className="text-sm font-semibold mb-1">Response from {(venueProfile as any)?.organizationName}</p>
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

      {/* Gallery Lightbox */}
      {galleryLightbox !== null && (() => {
        const photos = ((venueProfile as any)?.mediaGallery?.photos || []);
        if (photos.length === 0) return null;
        const currentPhoto = photos[galleryLightbox];
        return (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setGalleryLightbox(null)}>
            <button
              onClick={() => setGalleryLightbox(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white z-10"
            >
              <X className="h-6 w-6" />
            </button>
            {galleryLightbox > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setGalleryLightbox(galleryLightbox - 1); }}
                className="absolute left-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            {galleryLightbox < photos.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setGalleryLightbox(galleryLightbox + 1); }}
                className="absolute right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
            <div className="max-w-4xl max-h-[85vh] w-full px-12" onClick={(e) => e.stopPropagation()}>
              <img
                src={currentPhoto?.url || currentPhoto}
                alt={currentPhoto?.caption || 'Venue photo'}
                className="w-full h-full object-contain rounded-lg"
              />
              <div className="text-center mt-3">
                {currentPhoto?.caption && <p className="text-white text-sm">{currentPhoto.caption}</p>}
                <p className="text-white/60 text-xs mt-1">{galleryLightbox + 1} of {photos.length}</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Share Venue Modal */}
      {venueProfile && (
        <ShareVenueModal
          isOpen={shareVenueOpen}
          onClose={() => setShareVenueOpen(false)}
          venueId={venueId}
          venueName={(venueProfile as any)?.organizationName}
          venueDescription={(venueProfile as any)?.description}
          venueProfileImage={(venueProfile as any)?.profilePhotoUrl}
          venueLocation={(venueProfile as any)?.city}
          venueCapacity={(venueProfile as any)?.capacity}
        />
      )}
          <Footer />
    </div>
  );
}
