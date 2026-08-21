import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Handshake, ExternalLink as ExtLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Building2, Users, Star, Wifi, Zap, Accessibility, ParkingCircle, Volume2, Music, Share2, X, ChevronLeft, ChevronRight, ImageIcon, Clock, UtensilsCrossed, TreePine, Truck, Shirt, Lightbulb, Check, MessageSquare, Send, Loader2, CalendarDays, Flag } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { QuickSignupModal } from '@/components/QuickSignupModal';
import { toast } from 'sonner';
import { formatEventTime } from '@/lib/utils';
import { useAuth } from '@/_core/hooks/useAuth';
import { useParams, useLocation } from 'wouter';
import { ProfileHeaderSkeleton, ProfileSectionSkeleton } from '@/components/SkeletonLoader';
import { ShareVenueModal } from '@/components/ShareVenueModal';
import { MerchDisplay } from '@/components/MerchDisplay';
import { FollowVenueButton } from '@/components/FollowVenueButton';
import { ReportContentModal } from '@/components/ReportContentModal';
import { trpc } from '@/lib/trpc';
import { JsonLd, buildVenueJsonLd, buildBreadcrumbJsonLd } from '@/components/JsonLd';
import SiteHeader from '@/components/SiteHeader';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';

export default function VenueProfile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  // Support both numeric IDs (/venue/1) and name slugs (/venue/ologist)
  const isNumericId = !!(id && /^\d+$/.test(id));
  const venueId = isNumericId ? parseInt(id!, 10) : 0;
  const slugParam = !isNumericId ? id : null;

  // Fetch by numeric ID
  const { data: venueById, isLoading: loadingById } = trpc.venue.getById.useQuery({ id: venueId }, { enabled: isNumericId && venueId > 0 });
  // Fetch by slug
  const { data: venueBySlug, isLoading: loadingBySlug } = (trpc.venue as any).getBySlug.useQuery({ slug: slugParam || '' }, { enabled: !!slugParam });

  const venueProfile = isNumericId ? venueById : venueBySlug;
  const isLoading = isNumericId ? loadingById : loadingBySlug;
  const resolvedVenueId = venueProfile?.id || venueId;

  const { data: venueReviews } = trpc.venueReview.getByVenue.useQuery({ venueId: resolvedVenueId }, { enabled: resolvedVenueId > 0 });
  const { data: averageRating } = trpc.venueReview.getAverageRating.useQuery({ venueId: resolvedVenueId }, { enabled: resolvedVenueId > 0 });

  // Track venue profile view
  const trackViewMutation = trpc.venue.trackProfileView.useMutation();
  useEffect(() => {
    if (resolvedVenueId > 0) {
      trackViewMutation.mutate({ venueId: resolvedVenueId });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedVenueId]);

  // Set SEO meta tags when venue data loads
  useEffect(() => {
    if (venueProfile) {
      setMetaTags(pageMetaTags.venueProfile(venueProfile.organizationName || 'Venue', resolvedVenueId));
    }
  }, [venueProfile, venueId]);

  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [responseText, setResponseText] = useState('');
  const [shareVenueOpen, setShareVenueOpen] = useState(false);
  const [galleryLightbox, setGalleryLightbox] = useState<number | null>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    inquiryType: 'booking' as 'booking' | 'general' | 'availability' | 'pricing',
    subject: '',
    message: '',
    preferredDate: '',
  });

  // Fetch blocked dates for the next 3 months (public)
  const { data: blockedDatesPublic } = trpc.venue.getBlockedDatesPublic.useQuery(
    { venueId: resolvedVenueId, startDate: new Date().toISOString().split('T')[0] },
    { enabled: resolvedVenueId > 0, staleTime: 120_000 }
  );
  const blockedDatesSet = new Set(blockedDatesPublic?.blockedDates || []);
  const recurringBlockedDays = new Set(blockedDatesPublic?.recurringBlockedDays || []);
  
  // Helper to check if a date is blocked (explicit or recurring)
  const isDateBlocked = (dateStr: string) => {
    if (blockedDatesSet.has(dateStr)) return true;
    const d = new Date(dateStr + 'T12:00:00');
    return recurringBlockedDays.has(d.getDay());
  };

  const contactVenueMutation = trpc.venue.contactVenue.useMutation({
    onSuccess: (data) => {
      toast.success('Inquiry sent! The venue will be notified.');
      setContactModalOpen(false);
      setContactForm({ inquiryType: 'booking', subject: '', message: '', preferredDate: '' });
      // Optionally navigate to the conversation
      if (data.bookingId) {
        navigate(`/messages/${data.bookingId}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send inquiry');
    },
  });

  const handleContactSubmit = () => {
    if (!contactForm.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }
    if (!contactForm.message.trim()) {
      toast.error('Please enter a message');
      return;
    }
    contactVenueMutation.mutate({
      venueId: resolvedVenueId,
      inquiryType: contactForm.inquiryType,
      subject: contactForm.subject.trim(),
      message: contactForm.message.trim(),
      preferredDate: contactForm.preferredDate || undefined,
    });
  };

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

  if (!resolvedVenueId || resolvedVenueId === 0) {
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
      {venueProfile && <JsonLd data={[buildVenueJsonLd(venueProfile), buildBreadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: 'Browse Venues', url: '/venues' }, { name: venueProfile.organizationName, url: `/venue/${resolvedVenueId}` }])]} id={`venue-${resolvedVenueId}`} />}
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

            {/* Follow & Contact Venue */}
            {!isVenueOwner && (
              <div className="mt-4 pt-4 border-t space-y-3">
                <FollowVenueButton
                  venueUserId={venueProfile.userId}
                  venueName={venueProfile.organizationName || 'Venue'}
                  size="default"
                  showCount={true}
                />
                {user ? (
                  <Button onClick={() => setContactModalOpen(true)} className="w-full sm:w-auto gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Contact Venue
                  </Button>
                ) : (
                  <Button onClick={() => setShowAuthModal(true)} variant="outline" className="w-full sm:w-auto gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Log in to Contact Venue
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto gap-2 text-muted-foreground hover:text-destructive"
                  onClick={() => setReportOpen(true)}
                >
                  <Flag className="h-4 w-4" />
                  Report Content
                </Button>
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
          let amenityList: string[] = [];
          if (amenities) {
            if (Array.isArray(amenities)) {
              amenityList = amenities;
            } else if (typeof amenities === 'object') {
              // Handle mixed data: numeric keys have string values (amenity names),
              // named keys (like "Bar") have boolean true values
              const names: string[] = [];
              for (const [key, value] of Object.entries(amenities)) {
                if (/^\d+$/.test(key) && typeof value === 'string') {
                  // Numeric key: the value IS the amenity name
                  names.push(value);
                } else if (value === true) {
                  // Named key with boolean: the key IS the amenity name
                  names.push(key);
                }
              }
              // Deduplicate
              amenityList = [...new Set(names)];
            }
          }
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

        {/* Upcoming Events */}
        <VenueUpcomingEvents venueId={resolvedVenueId} />

        {/* Venue Sponsors */}
        <VenueSponsorsSection venueId={resolvedVenueId} />

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

        {/* Shop & Offers Section */}
        {venueProfile && (venueProfile as any)?.userId && (
          <div className="mb-6">
            <MerchDisplay userId={(venueProfile as any).userId} userType="venue" />
          </div>
        )}

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle>What Artists Say</CardTitle>
            <p className="text-sm text-muted-foreground">Reviews from artists who have performed at this venue</p>
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

                    {/* Category Ratings */}
                    {(review.professionalismRating || review.soundQualityRating || review.greenRoomRating || review.paymentTimelinessRating) && (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3 text-sm">
                        {review.professionalismRating && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Professionalism</span>
                            <span className="font-medium">{review.professionalismRating}/5</span>
                          </div>
                        )}
                        {review.soundQualityRating && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Sound Quality</span>
                            <span className="font-medium">{review.soundQualityRating}/5</span>
                          </div>
                        )}
                        {review.greenRoomRating && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Green Room</span>
                            <span className="font-medium">{review.greenRoomRating}/5</span>
                          </div>
                        )}
                        {review.paymentTimelinessRating && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Payment Timeliness</span>
                            <span className="font-medium">{review.paymentTimelinessRating}/5</span>
                          </div>
                        )}
                      </div>
                    )}
                    
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
          venueId={resolvedVenueId}
          venueName={(venueProfile as any)?.organizationName}
          venueDescription={(venueProfile as any)?.description}
          venueProfileImage={(venueProfile as any)?.profilePhotoUrl}
          venueLocation={(venueProfile as any)?.city}
          venueCapacity={(venueProfile as any)?.capacity}
        />
      )}

      {/* Auth Modal for unauthenticated users */}
      <QuickSignupModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        targetType="venue"
        defaultTab="login"
      />

      {/* Contact Venue Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setContactModalOpen(false); setContactForm({ inquiryType: 'booking', subject: '', message: '', preferredDate: '' }); }}>
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Contact {venueProfile?.organizationName}</h2>
                  <p className="text-sm text-muted-foreground mt-1">Send an inquiry directly to this venue</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => { setContactModalOpen(false); setContactForm({ inquiryType: 'booking', subject: '', message: '', preferredDate: '' }); }}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-4">
                {/* Inquiry Type */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Inquiry Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'booking', label: 'Booking Request', icon: '🎵' },
                      { value: 'availability', label: 'Check Availability', icon: '📅' },
                      { value: 'pricing', label: 'Pricing Info', icon: '💰' },
                      { value: 'general', label: 'General Question', icon: '💬' },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setContactForm({ ...contactForm, inquiryType: type.value as any })}
                        className={`flex items-center gap-2 p-3 rounded-lg border text-sm text-left transition-colors ${
                          contactForm.inquiryType === type.value
                            ? 'border-primary bg-primary/5 text-primary font-medium'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Date (optional) */}
                {(contactForm.inquiryType === 'booking' || contactForm.inquiryType === 'availability') && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Preferred Date (optional)</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="date"
                        value={contactForm.preferredDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (isDateBlocked(val)) {
                            toast.error('This date is unavailable. Please choose a different date.');
                            return;
                          }
                          setContactForm({ ...contactForm, preferredDate: val });
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    {contactForm.preferredDate && isDateBlocked(contactForm.preferredDate) && (
                      <p className="text-xs text-red-500 mt-1">⚠️ This date is marked as unavailable by the venue</p>
                    )}
                    {(blockedDatesPublic?.blockedDates?.length || blockedDatesPublic?.recurringBlockedDays?.length) ? (
                      <p className="text-xs text-muted-foreground mt-1">Some dates are unavailable for this venue</p>
                    ) : null}
                  </div>
                )}

                {/* Subject */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Subject <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="e.g., Live band for Saturday night event"
                    maxLength={200}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">Required</p>
                    <p className="text-xs text-muted-foreground">{contactForm.subject.length}/200</p>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Message <span className="text-red-500">*</span></label>
                  <Textarea
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Tell the venue about your event, what you're looking for, and any specific requirements..."
                    rows={5}
                    maxLength={2000}
                    className="resize-none"
                  />
                  <div className="flex justify-between mt-1">
                    <p className="text-xs text-muted-foreground">Required</p>
                    <p className="text-xs text-muted-foreground">{contactForm.message.length}/2000</p>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => { setContactModalOpen(false); setContactForm({ inquiryType: 'booking', subject: '', message: '', preferredDate: '' }); }} className="flex-1">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleContactSubmit}
                    disabled={contactVenueMutation.isPending || !contactForm.subject.trim() || !contactForm.message.trim()}
                    className="flex-1 gap-2"
                  >
                    {contactVenueMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</>
                    ) : (
                      <><Send className="h-4 w-4" /> Send Inquiry</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Content Modal */}
      {venueProfile && (
        <ReportContentModal
          open={reportOpen}
          onOpenChange={setReportOpen}
          contentType="venue"
          contentName={venueProfile.organizationName || 'Venue'}
        />
      )}

    </div>
  );
}


function VenueUpcomingEvents({ venueId }: { venueId: number }) {
  const [, navigate] = useLocation();
  const { data: events, isLoading } = trpc.events.getByVenueId.useQuery(
    { venueId },
    { enabled: venueId > 0 }
  );

  if (isLoading) return null;

  // Filter to only upcoming events
  const now = new Date();
  const upcomingEvents = (events || []).filter((e: any) => {
    const eventDate = new Date(e.eventDate);
    return eventDate >= now;
  }).sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

  const pastEvents = (events || []).filter((e: any) => {
    const eventDate = new Date(e.eventDate);
    return eventDate < now;
  }).sort((a: any, b: any) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()).slice(0, 5);

  if (upcomingEvents.length === 0 && pastEvents.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Upcoming</h4>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 6).map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <div className="text-center min-w-[50px]">
                    <p className="text-xs text-muted-foreground uppercase">
                      {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-xl font-bold">
                      {new Date(event.eventDate).getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.eventTime ? formatEventTime(event.eventTime) : 'Time TBD'}
                      {event.ticketPrice ? ` · $${event.ticketPrice}` : ' · Free'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pastEvents.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Past Shows</h4>
            <div className="space-y-2">
              {pastEvents.map((event: any) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 p-2 rounded-lg opacity-70"
                >
                  <div className="text-center min-w-[50px]">
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{event.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function VenueSponsorsSection({ venueId }: { venueId: number }) {
  const { data: sponsors } = trpc.venueSponsor.getPublicSponsors.useQuery(
    { venueId },
    { enabled: venueId > 0 }
  );

  if (!sponsors || sponsors.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Handshake className="h-5 w-5" />
          Our Sponsors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sponsors.map(sponsor => (
            <div key={sponsor.id} className="flex flex-col items-center text-center p-3 rounded-lg border hover:shadow-sm transition-shadow">
              {sponsor.companyLogoUrl ? (
                <img
                  src={sponsor.companyLogoUrl}
                  alt={sponsor.companyName}
                  className="w-12 h-12 rounded object-contain mb-2"
                />
              ) : (
                <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center mb-2">
                  <span className="text-lg font-bold text-primary">{sponsor.companyName.charAt(0)}</span>
                </div>
              )}
              <p className="text-xs font-medium truncate w-full">{sponsor.companyName}</p>
              {sponsor.companyWebsite && (
                <a
                  href={sponsor.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:underline mt-1 flex items-center gap-0.5"
                >
                  <ExtLink className="h-2.5 w-2.5" /> Visit
                </a>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
