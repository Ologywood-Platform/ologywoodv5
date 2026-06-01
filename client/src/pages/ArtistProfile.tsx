import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { QuickSignupModal } from "@/components/QuickSignupModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Music, MapPin, DollarSign, Users, Globe, Instagram, Facebook, Youtube, Music2, FileText, ChevronDown, Star, Heart, Settings, Video, Calendar, Ticket, ExternalLink, Plane } from "lucide-react";
import { ShareVideoButton } from '@/components/ShareVideoButton';
import { ReportVideoButton } from '@/components/ReportVideoButton';
import { FollowButton } from "@/components/FollowButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareProfileModal } from "@/components/ShareProfileModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { RiderComparisonTool } from "../components/RiderComparisonTool";
import { ReleaseCard } from "@/components/ReleaseCard";
import { JsonLd, buildArtistJsonLd, buildBreadcrumbJsonLd, buildMusicRecordingJsonLd } from "../components/JsonLd";
import { ReviewSystem } from "@/components/ReviewSystem";
import { MerchDisplay } from "@/components/MerchDisplay";
import { ProjectPreviewDisplay } from "@/components/ProjectPreviewDisplay";
import { useState, useEffect, useRef } from "react";
import { Share2 } from "lucide-react";
import { TipQRSection } from "@/components/TipQRCode";
import { toast } from "sonner";
import { useParams, useLocation } from "wouter";
import { ProfileHeaderSkeleton, ProfileSectionSkeleton, PhotoGridSkeleton } from "@/components/SkeletonLoader";
import { setMetaTags, pageMetaTags } from "@/utils/seoMeta";
import { getDashboardUrl } from "@/utils/dashboardUrl";
import SiteHeader from "@/components/SiteHeader";
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { TouringDisplay } from '@/components/TouringDisplay';
import { StickyBookingBar } from "@/components/StickyBookingBar";

export default function ArtistProfile() {
  const { id: idParam } = useParams();
  // Ensure idParam is a string and parse it safely
  const artistId = idParam && typeof idParam === 'string' ? parseInt(idParam, 10) : 0;
  
  // Validate that artistId is a valid number
  if (isNaN(artistId) || artistId <= 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Invalid artist ID</p>
        <Link href="/browse">
          <Button>Browse Artists</Button>
        </Link>
      </div>
    );
  }
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  // Only query if we have a valid numeric artist ID
  const isValidId = !isNaN(artistId) && artistId > 0;
  
  const { data: artist, isLoading } = trpc.artist.getProfile.useQuery(
    { id: artistId },
    { enabled: isValidId }
  );

  // Set SEO meta tags when artist data loads
  useEffect(() => {
    if (artist) {
      setMetaTags(pageMetaTags.artistProfile(artist.artistName, artist.id, artist.profilePhotoUrl || undefined));
    }
  }, [artist]);
  const { data: availability } = trpc.availability.getForArtist.useQuery(
    { artistId },
    { enabled: isValidId }
  );
  // Note: getForArtist endpoint not available in new rider router
  // For now, we'll skip loading rider templates on artist profile
  const riderTemplates: any[] = [];
  const { data: reviews } = trpc.review.getByArtist.useQuery(
    { artistId },
    { enabled: isValidId }
  );
  const { data: avgRating } = trpc.review.getAverageRating.useQuery(
    { artistId },
    { enabled: isValidId }
  );
  const { data: artistReviews } = trpc.artistReview.getByArtist.useQuery(
    { artistId },
    { enabled: isValidId }
  );
  const { data: artistAvgRating } = trpc.artistReview.getAverageRating.useQuery(
    { artistId },
    { enabled: isValidId }
  );
  const { data: recentPhotos = [] } = trpc.events.getRecentPhotos.useQuery(
    { artistId, limit: 4 },
    { enabled: isValidId }
  );

  const { data: portfolioStats } = trpc.events.getPortfolioStats.useQuery(
    { artistId },
    { enabled: isValidId }
  );

  const { data: upcomingEvents = [] } = trpc.events.getUpcomingEvents.useQuery(
    { artistId },
    { enabled: isValidId }
  );

  const { data: releases } = trpc.release.getByArtist.useQuery(
    { artistId },
    { enabled: isValidId }
  );
  
  // Show error if no valid ID
  if (!isValidId) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Artist Not Found</CardTitle>
            <CardDescription>The artist ID is invalid or missing.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/browse")}>Browse Artists</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRiderComparison, setShowRiderComparison] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueStreet, setVenueStreet] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueState, setVenueState] = useState("");
  const [venueZip, setVenueZip] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [totalFee, setTotalFee] = useState("");
  const [expandedRiders, setExpandedRiders] = useState<Set<number>>(new Set());
  const [shareProfileOpen, setShareProfileOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  
  const toggleRiderExpanded = (riderId: number) => {
    setExpandedRiders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(riderId)) {
        newSet.delete(riderId);
      } else {
        newSet.add(riderId);
      }
      return newSet;
    });
  };
  
  // Load templates for venues
  const { data: templates } = trpc.bookingTemplate.getMyTemplates.useQuery(
    undefined,
    { enabled: user?.role === 'venue' && isValidId }
  );
  
  // Auto-fill form when template is selected
  const handleTemplateSelect = (templateId: string) => {
    if (!templateId || !templates) {
      setSelectedTemplate(null);
      return;
    }
    
    const template = templates.find(t => t.id === parseInt(templateId));
    if (template) {
      setSelectedTemplate(template.id);
      setVenueName((template as any).templateData?.venueName || "");
      // Parse template address if available
      const templateAddr = (template as any).templateData?.venueAddress || "";
      if (templateAddr) {
        setVenueStreet(templateAddr);
      }
      
      // Build event details from template
      let details = "";
      if ((template as any).templateData?.eventType) details += `Event Type: ${(template as any).templateData.eventType}\n`;
      if ((template as any).templateData?.venueCapacity) details += `Capacity: ${(template as any).templateData.venueCapacity} guests\n`;
      if ((template as any).templateData?.standardRequirements) details += `\nRequirements:\n${(template as any).templateData.standardRequirements}\n`;
      if ((template as any).templateData?.additionalNotes) details += `\nAdditional Notes:\n${(template as any).templateData.additionalNotes}`;
      setEventDetails(details);
      
      // Set budget if available
      if ((template as any).templateData?.budgetMax) {
        setTotalFee((template as any).templateData.budgetMax.toString());
      }
    }
  };
  
  const createBooking = trpc.booking.create.useMutation({
    onSuccess: () => {
      toast.success("Booking request sent! The artist will review and respond via messages.", {
        duration: 5000,
        action: {
          label: 'View Bookings',
          onClick: () => navigate('/bookings'),
        },
      });
      setBookingDialogOpen(false);
      setSelectedRiderId(null);
      setShowRiderComparison(false);
      navigate("/bookings");
    },
      onError: (error: any) => {
      toast.error(error.message || "Failed to create booking");
    },
  });


  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    
    if (user?.role !== 'venue') {
      toast.error("Only venues can create booking requests");
      return;
    }
    
    // Combine address fields into a single string for the API
    const fullAddress = [venueStreet, venueCity, venueState, venueZip].filter(Boolean).join(', ');
    
    createBooking.mutate({
      artistId,
      eventDate,
      eventTime,
      venueName,
      venueAddress: fullAddress || undefined,
      eventDetails,
      totalFee: totalFee ? parseFloat(totalFee) : undefined,
    });
    
    // Note: selectedRiderId is stored in state for future use in rider acknowledgment workflow
    if (selectedRiderId) {
      // Rider selection tracked for booking workflow
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <ProfileHeaderSkeleton />
        <ProfileSectionSkeleton />
        <ProfileSectionSkeleton />
        <div className="space-y-3">
          <div className="h-6 w-32 bg-muted rounded" />
          <PhotoGridSkeleton />
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-muted-foreground mb-4">Artist not found</p>
        <Link href="/browse">
          <Button>Browse Artists</Button>
        </Link>
      </div>
    );
  }

  const socialLinks = artist.socialLinks as { instagram?: string; facebook?: string; youtube?: string; spotify?: string; twitter?: string; appleMusic?: string; tidal?: string; soundcloud?: string; otherStreaming?: string } | null;
  const hasSocialLinks = socialLinks && Object.values(socialLinks).some(v => !!v);
  const tipLinks = artist.tipLinks as { cashapp?: string; venmo?: string; paypal?: string; zelle?: string } | null;
  const hasTipLinks = tipLinks && Object.values(tipLinks).some(v => !!v);
  const mediaGallery = artist.mediaGallery as { photos: string[]; videos: string[] } | null;

  return (
    <div className="min-h-screen bg-background">
      {artist && <JsonLd data={[buildArtistJsonLd(artist), buildBreadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: 'Browse Artists', url: '/browse' }, { name: artist.artistName, url: `/artist/${artistId}` }])]} id={`artist-${artistId}`} />}
      {artist && releases && releases.length > 0 && (
        <JsonLd
          data={releases.map((r: any) => buildMusicRecordingJsonLd({
            id: r.id,
            title: r.title,
            artistName: artist.artistName,
            artistId: artistId,
            genre: r.genre,
            description: r.description,
            coverArtUrl: r.coverArtUrl,
            priceInCents: r.priceInCents,
            currency: r.currency,
            durationSeconds: r.durationSeconds,
            publishedAt: r.publishedAt,
          }))}
          id={`releases-${artistId}`}
        />
      )}
      {/* Shared Header with Following link */}
      <SiteHeader />

      <div className="container mx-auto px-4 py-8">
        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Browse', href: '/browse' },
            { label: artist.artistName },
          ]}
        />
        {/* Hero Section */}
        <div className="mb-6 sm:mb-8" ref={heroRef}>
          {artist.profilePhotoUrl ? (
            <div className="flex justify-center mb-6">
              <img 
                src={artist.profilePhotoUrl} 
                alt={artist.artistName}
                className="max-h-[300px] sm:max-h-[350px] md:max-h-[400px] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="w-full h-[200px] sm:h-[240px] bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center mb-6">
              <Music className="h-24 w-24 text-primary/40" />
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">{artist.artistName}</h1>
                {user && artist.userId === user.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/profile/edit')}
                    className="gap-1.5"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                )}
              </div>
              <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-3">
                {Array.isArray(artist.genre) && artist.genre.length > 0 
                  ? artist.genre.join(", ") 
                  : "Various Genres"}
              </p>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {artist.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{artist.location}</span>
                  </div>
                )}
                {artist.feeRangeMin && artist.feeRangeMax && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>${artist.feeRangeMin} - ${artist.feeRangeMax}</span>
                  </div>
                )}
                {artist.touringPartySize && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{artist.touringPartySize} {artist.touringPartySize === 1 ? 'person' : 'people'}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              {/* Primary action - full width on mobile */}
              {user?.role === 'venue' ? (
              <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="lg" className="w-full sm:w-auto md:min-w-[200px]">
                    Request Booking
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto fixed inset-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] translate-x-0 translate-y-0 rounded-none sm:rounded-lg w-full sm:w-auto sm:max-w-[calc(100%-2rem)] p-4 sm:p-6">
                <DialogHeader className="sticky top-0 bg-background z-10 pb-3 border-b sm:border-b-0 sm:static sm:pb-0">
                  <DialogTitle className="text-lg sm:text-xl">Request Booking with {artist.artistName}</DialogTitle>
                  <DialogDescription className="text-sm">
                    Fill out the details below to send a booking request.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {(riderTemplates as any[]) && (riderTemplates as any[]).length > 0 && (
                    <div className="border-b pb-4">
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-base font-semibold">Review Artist Riders</Label>
                        <Button
                          type="button"
                          variant={showRiderComparison ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowRiderComparison(!showRiderComparison)}
                        >
                          {showRiderComparison ? "Hide" : "Show"} Riders
                        </Button>
                      </div>
                      {showRiderComparison && (
                        <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                          <RiderComparisonTool
                            riders={(riderTemplates as unknown as any[]) || []}
                            onSelect={(riderId) => {
                              setSelectedRiderId(riderId);
                              toast.success("Rider selected for this booking");
                            }}
                          />
                        </div>
                      )}
                      {selectedRiderId && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                          Selected: {(riderTemplates as any[])?.find((r: any) => r.id === selectedRiderId)?.templateName || 'N/A'}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {user?.role === 'venue' && templates && templates.length > 0 && (
                    <div>
                      <Label htmlFor="template">Use Template (Optional)</Label>
                      <select
                        id="template"
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedTemplate || ""}
                        onChange={(e) => handleTemplateSelect(e.target.value)}
                      >
                        <option value="">-- Select a template --</option>
                        {templates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.templateName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eventDate" className="text-sm font-medium">Event Date *</Label>
                      <input
                        id="eventDate"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] appearance-none"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventTime" className="text-sm font-medium">Event Time</Label>
                      <input
                        id="eventTime"
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="flex h-11 sm:h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base sm:text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] appearance-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="venueName" className="text-sm font-medium">Venue Name *</Label>
                    <Input
                      id="venueName"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="Enter venue name"
                      required
                      className="h-11 sm:h-10 text-base sm:text-sm"
                    />
                  </div>
                  
                  {/* Venue Address - broken into separate fields */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Venue Address</Label>
                    <div>
                      <Input
                        id="venueStreet"
                        value={venueStreet}
                        onChange={(e) => setVenueStreet(e.target.value)}
                        placeholder="Street address"
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        id="venueCity"
                        value={venueCity}
                        onChange={(e) => setVenueCity(e.target.value)}
                        placeholder="City"
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                      <Input
                        id="venueState"
                        value={venueState}
                        onChange={(e) => setVenueState(e.target.value)}
                        placeholder="State"
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                      <Input
                        id="venueZip"
                        value={venueZip}
                        onChange={(e) => setVenueZip(e.target.value)}
                        placeholder="Zip"
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="totalFee" className="text-sm font-medium">Offered Fee ($)</Label>
                    <Input
                      id="totalFee"
                      type="number"
                      value={totalFee}
                      onChange={(e) => setTotalFee(e.target.value)}
                      placeholder="Enter your offer"
                      className="h-11 sm:h-10 text-base sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="eventDetails">Event Details</Label>
                    <Textarea
                      id="eventDetails"
                      value={eventDetails}
                      onChange={(e) => setEventDetails(e.target.value)}
                      placeholder="Tell the artist about your event..."
                      rows={4}
                    />
                  </div>
                  
                  <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end sticky bottom-0 bg-background pt-3 border-t sm:border-t-0 sm:static sm:pt-0">
                    <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createBooking.isPending} className="w-full sm:w-auto">
                      {createBooking.isPending ? "Sending..." : "Send Request"}
                    </Button>
                  </div>
                </form>
                </DialogContent>
              </Dialog>
              ) : (
                <Button size="lg" className="w-full sm:w-auto md:min-w-[200px]" onClick={() => {
                  if (!isAuthenticated) {
                    setShowAuthModal(true);
                    return;
                  }
                  navigate(`/book/${artistId}`);
                }}>
                  Book This Artist
                </Button>
              )}

              {/* Secondary actions row */}
              <div className="flex items-center gap-2 flex-wrap">
                <FollowButton artistUserId={artist.userId || artistId} artistName={artist.artistName} showCount={false} />
                <FavoriteButton artistId={artistId} artistUserId={artist.userId || artistId} size="lg" showText={false} />
                <Button
                  onClick={() => setShareProfileOpen(true)}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <FollowerCount artistUserId={artist.userId || artistId} />
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:p-4 md:p-8">
          {/* Main Content - Left Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            {artist.bio && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">{artist.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Touring Availability */}
            <TouringDisplay artistProfileId={artistId} />

            {/* Performance Video */}
            {(artist as any).performanceVideoUrl && ((artist as any).performanceVideoStatus === 'approved' || (artist as any).performanceVideoStatus === 'flagged') && (artist as any).performanceVideoStatus !== 'taken_down' && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" />
                      <CardTitle>Performance</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShareVideoButton artistId={artist.id} artistName={artist.artistName || 'Artist'} />
                      <ReportVideoButton artistProfileId={artist.id} isOwnProfile={user?.id === artist.userId} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                    <video
                      src={(artist as any).performanceVideoUrl}
                      controls
                      preload="metadata"
                      className="w-full h-full object-contain"
                      poster={(artist as any).performanceVideoThumbnail || undefined}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Media Gallery */}
            {mediaGallery && (mediaGallery.photos.length > 0 || mediaGallery.videos.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Media Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mediaGallery.photos.map((photo, idx) => (
                      <img 
                        key={idx}
                        src={photo} 
                        alt={`${artist.artistName} photo ${idx + 1}`}
                        className="w-full h-40 object-cover rounded-md"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Right Column (short items only) */}
          <div className="space-y-6">
            {/* Social Links */}
            {(hasSocialLinks || artist.websiteUrl) && (
              <Card>
                <CardHeader>
                  <CardTitle>Connect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {artist.websiteUrl && (
                    <a href={artist.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                      <Globe className="h-4 w-4" />
                      <span>Website</span>
                    </a>
                  )}
                  {socialLinks?.instagram && (
                    <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                      <Instagram className="h-4 w-4" />
                      <span>Instagram</span>
                    </a>
                  )}
                  {socialLinks?.facebook && (
                    <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                      <Facebook className="h-4 w-4" />
                      <span>Facebook</span>
                    </a>
                  )}
                  {socialLinks?.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                      <Youtube className="h-4 w-4" />
                      <span>YouTube</span>
                    </a>
                  )}
                  {socialLinks?.spotify && (
                    <a href={socialLinks.spotify} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1DB954"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                      <span>Spotify</span>
                    </a>
                  )}
                  {socialLinks?.appleMusic && (
                    <a href={socialLinks.appleMusic} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#FA243C"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.802.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.862.358-1.31.083-.59.105-1.18.108-1.772.003-3.413.002-6.828.002-10.242zM17.7 18.09c0 .36-.072.71-.21 1.04-.27.64-.71 1.09-1.34 1.35-.39.16-.8.24-1.22.27-.65.04-1.3.01-1.9-.27-.78-.37-1.18-1.03-1.18-1.89V11.5c0-.12.01-.24.04-.36.09-.38.3-.67.66-.84.23-.11.49-.15.74-.17.37-.02.73 0 1.08.11.56.17.91.52 1.04 1.09.04.17.06.35.06.53v6.23zm-.07-9.93c-.03.42-.17.81-.43 1.15-.38.5-.89.78-1.51.87-.25.04-.5.04-.75.02-.55-.05-1.03-.26-1.41-.66-.3-.31-.47-.69-.53-1.12-.04-.25-.04-.5-.02-.76.05-.56.26-1.04.67-1.42.34-.32.75-.5 1.2-.56.25-.03.5-.03.75-.01.56.06 1.04.27 1.42.68.31.33.48.73.53 1.18.02.13.03.26.03.39v.24z"/></svg>
                      <span>Apple Music</span>
                    </a>
                  )}
                  {socialLinks?.tidal && (
                    <a href={socialLinks.tidal} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L8 4l4 4-4 4 4 4 4-4-4-4 4-4-4-4zm-8 4l4 4-4 4 4 4-4-4-4 4 4-4-4-4 4-4zm16 0l-4 4 4 4-4 4 4-4 4 4-4-4 4-4-4-4z"/></svg>
                      <span>Tidal</span>
                    </a>
                  )}
                  {socialLinks?.soundcloud && (
                    <a href={socialLinks.soundcloud} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#FF5500"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.282c.013.06.045.094.104.094.057 0 .09-.035.104-.094l.2-1.282-.2-1.332c-.014-.057-.047-.094-.104-.094m1.8-1.18c-.066 0-.108.046-.118.1l-.213 2.506.213 2.41c.01.057.052.1.118.1.063 0 .108-.043.116-.1l.24-2.41-.24-2.506c-.008-.054-.053-.1-.116-.1m.899-.395c-.073 0-.12.046-.127.1l-.195 2.9.195 2.56c.007.058.054.1.127.1.07 0 .12-.042.126-.1l.22-2.56-.22-2.9c-.006-.054-.056-.1-.126-.1m.9-.432c-.08 0-.127.046-.133.1l-.18 3.332.18 2.66c.006.06.053.1.133.1.076 0 .127-.04.131-.1l.202-2.66-.202-3.332c-.004-.054-.055-.1-.131-.1m.891-.567c-.084 0-.135.05-.14.11l-.16 3.899.16 2.727c.005.06.056.11.14.11.08 0 .135-.05.139-.11l.18-2.727-.18-3.899c-.004-.06-.059-.11-.14-.11m.9-.39c-.09 0-.14.05-.146.11l-.143 4.289.143 2.76c.006.06.056.11.146.11.087 0 .14-.05.145-.11l.16-2.76-.16-4.289c-.005-.06-.058-.11-.145-.11m.89-.238c-.1 0-.148.05-.153.11l-.128 4.527.128 2.78c.005.06.053.11.153.11.094 0 .148-.05.152-.11l.14-2.78-.14-4.527c-.004-.06-.058-.11-.152-.11m.904-.13c-.1 0-.155.054-.159.116l-.112 4.657.112 2.8c.004.06.059.116.159.116.096 0 .155-.056.158-.116l.125-2.8-.125-4.657c-.003-.062-.062-.116-.158-.116m.89.05c-.11 0-.163.054-.166.116l-.098 4.49.098 2.81c.003.06.056.116.166.116.104 0 .163-.056.165-.116l.11-2.81-.11-4.49c-.002-.062-.06-.116-.165-.116m.9.1c-.11 0-.168.058-.17.12l-.084 4.39.084 2.81c.002.06.06.12.17.12.107 0 .168-.06.17-.12l.093-2.81-.093-4.39c-.002-.062-.063-.12-.17-.12m5.1 1.677c-.475 0-.905.186-1.225.487a6.652 6.652 0 00-6.635-6.14c-.476 0-.943.054-1.394.154-.165.037-.22.075-.222.15v12.18c.002.077.06.14.14.153h9.336a2.46 2.46 0 002.46-2.46 2.46 2.46 0 00-2.46-2.46"/></svg>
                      <span>SoundCloud</span>
                    </a>
                  )}
                  {socialLinks?.otherStreaming && (
                    <a href={socialLinks.otherStreaming} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary">
                      <ExternalLink className="h-4 w-4" />
                      <span>More Music</span>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Support This Artist - Tip Links */}
            {hasTipLinks && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Support {artist.artistName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tipLinks?.cashapp && (
                    <a
                      href={tipLinks.cashapp.startsWith('http') ? tipLinks.cashapp : `https://cash.app/${tipLinks.cashapp.replace(/^\$/, '$')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ backgroundColor: '#00D54B' }}>
                        <span className="text-white text-xs font-bold">$</span>
                      </span>
                      <span>Cash App</span>
                    </a>
                  )}
                  {tipLinks?.venmo && (
                    <a
                      href={tipLinks.venmo.startsWith('http') ? tipLinks.venmo : `https://venmo.com/${tipLinks.venmo.replace(/^@/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ backgroundColor: '#3D95CE' }}>
                        <span className="text-white text-xs font-bold">V</span>
                      </span>
                      <span>Venmo</span>
                    </a>
                  )}
                  {tipLinks?.paypal && (
                    <a
                      href={tipLinks.paypal.startsWith('http') ? tipLinks.paypal : `https://paypal.me/${tipLinks.paypal}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ backgroundColor: '#00457C' }}>
                        <span className="text-white text-xs font-bold">P</span>
                      </span>
                      <span>PayPal</span>
                    </a>
                  )}
                  {tipLinks?.zelle && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded" style={{ backgroundColor: '#6D1ED4' }}>
                        <span className="text-white text-xs font-bold">Z</span>
                      </span>
                      <span>Zelle: {tipLinks.zelle}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-1">Tip directly — no platform fees</p>
                  <TipQRSection tipLinks={tipLinks} artistName={artist.artistName} />
                </CardContent>
              </Card>
            )}

            {/* Rider Templates */}
            {riderTemplates && riderTemplates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Technical Riders
                  </CardTitle>
                  <CardDescription>
                    View {artist.artistName}'s technical requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(riderTemplates as any)?.map((template: any) => (
                    <Collapsible key={template.id} open={expandedRiders.has(template.id)} onOpenChange={() => toggleRiderExpanded(template.id)}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-md hover:bg-accent text-left">
                        <span className="font-medium">{template.templateName}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedRiders.has(template.id) ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-3 pt-2 space-y-3 text-sm">
                        {(template.technicalRequirements?.soundSystem || template.technicalRequirements?.lighting || template.technicalRequirements?.backline || template.hospitalityRequirements?.catering || template.financialTerms?.depositAmount) ? (
                          <>
                            {template.technicalRequirements?.soundSystem && (
                              <div>
                                <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Sound</p>
                                <p className="text-muted-foreground">PA System Required</p>
                              </div>
                            )}
                            {template.technicalRequirements?.lighting && (
                              <div>
                                <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Lighting</p>
                                <p className="text-muted-foreground">{template.technicalRequirements?.lighting || "Standard"}</p>
                              </div>
                            )}
                            {template.technicalRequirements?.backline && (
                              <div>
                                <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Backline</p>
                                <p className="text-muted-foreground">{template.technicalRequirements.backline}</p>
                              </div>
                            )}
                            {template.hospitalityRequirements?.catering && (
                              <div>
                                <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Catering</p>
                                <p className="text-muted-foreground">Provided</p>
                              </div>
                            )}
                            {template.financialTerms?.depositAmount && (
                              <div>
                                <p className="font-semibold text-xs uppercase text-muted-foreground mb-1">Deposit</p>
                                <p className="text-muted-foreground">${template.financialTerms.depositAmount}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="py-4 text-center">
                            <p className="text-muted-foreground text-sm">No specific requirements listed for this rider.</p>
                            <p className="text-xs text-muted-foreground mt-2">Contact the artist for more details.</p>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* White Label Releases */}
            {releases && releases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5 text-primary" />
                    Music ({releases.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {releases.map((release: any) => (
                    <ReleaseCard
                      key={release.id}
                      release={release}
                      artistName={artist?.artistName || ""}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

          </div>
        </div>

        {/* Full-width sections below the two-column grid */}
        <div className="space-y-6 sm:p-4 md:px-8">
            {/* Project Previews Section */}
            {artist && (
              <ProjectPreviewDisplay userId={artist.userId} />
            )}

            {/* Merch Section */}
            {artist && (
              <MerchDisplay userId={artist.userId} userType="artist" />
            )}

            {/* Reviews Section */}
            {reviews && reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    Reviews ({reviews.length})
                    {avgRating && (
                      <span className="text-lg font-normal text-muted-foreground">
                        {avgRating.averageRating.toFixed(1)} average
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
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
                        {review.reviewText && (
                          <p className="text-sm text-muted-foreground">{review.reviewText}</p>
                        )}
                        
                        {review.artistResponse && (
                          <div className="mt-3 pl-4 border-l-2 border-primary/30">
                            <p className="text-xs font-medium text-primary mb-1">Artist Response:</p>
                            <p className="text-sm text-muted-foreground">{review.artistResponse}</p>
                            {review.respondedAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(review.respondedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Venue Reviews of Artist */}
            {artistReviews && artistReviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-purple-400 text-purple-400" />
                    Venue Reviews ({artistReviews.length})
                    {artistAvgRating && artistAvgRating.averageRating > 0 && (
                      <span className="text-lg font-normal text-muted-foreground">
                        {artistAvgRating.averageRating.toFixed(1)} average
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Category breakdown */}
                  {artistAvgRating && artistAvgRating.reviewCount > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Reliability</p>
                        <p className="font-semibold">{artistAvgRating.reliability > 0 ? artistAvgRating.reliability.toFixed(1) : 'N/A'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Stage Presence</p>
                        <p className="font-semibold">{artistAvgRating.stagePresence > 0 ? artistAvgRating.stagePresence.toFixed(1) : 'N/A'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Crowd Engagement</p>
                        <p className="font-semibold">{artistAvgRating.crowdEngagement > 0 ? artistAvgRating.crowdEngagement.toFixed(1) : 'N/A'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Professionalism</p>
                        <p className="font-semibold">{artistAvgRating.professionalism > 0 ? artistAvgRating.professionalism.toFixed(1) : 'N/A'}</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {artistReviews.map((review) => (
                      <div key={review.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? "fill-purple-400 text-purple-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                          <span className="text-sm text-muted-foreground ml-2">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground">{review.comment}</p>
                        )}
                        {review.artistResponse && (
                          <div className="mt-3 pl-4 border-l-2 border-purple-300">
                            <p className="text-xs font-medium text-purple-600 mb-1">Artist Response:</p>
                            <p className="text-sm text-muted-foreground">{review.artistResponse}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Availability Calendar */}
            <div>
              <AvailabilityCalendar
                availability={availability?.map(a => ({
                  date: typeof a.date === 'string' ? a.date : new Date(a.date).toISOString().split('T')[0],
                  status: a.status as 'available' | 'booked' | 'unavailable'
                })) || []}
                readOnly
              />
            </div>

            {/* Events and Portfolio in a two-column grid on tablet+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Events Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Events
                  </CardTitle>
                  {upcomingEvents.length > 0 && (
                    <CardDescription>{upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? 's' : ''}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingEvents.slice(0, 4).map((event: any) => (
                        <div
                          key={event.id}
                          className="flex gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg p-2 -mx-2 transition"
                          onClick={() => navigate(`/events/${event.id}`)}
                        >
                          {event.coverImageUrl ? (
                            <img
                              src={event.coverImageUrl}
                              alt={event.eventTitle}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{event.eventTitle}</h4>
                            <p className="text-xs text-slate-500 dark:text-gray-400">
                              {new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                              {event.eventTime && ` at ${event.eventTime}`}
                            </p>
                            {event.location && (
                              <p className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </p>
                            )}
                            {event.ticketLink && (
                              <a
                                href={event.ticketLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 mt-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Ticket className="h-3 w-3" />
                                Get Tickets
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                      {upcomingEvents.length > 4 && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => navigate(`/events?artistId=${artistId}`)}
                        >
                          View All {upcomingEvents.length} Events
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-gray-400">
                      No upcoming events posted yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Event History/Portfolio */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Portfolio</CardTitle>
                  <CardDescription>
                    {portfolioStats
                      ? `${portfolioStats.historyCount} performances · ${portfolioStats.photoCount} photos`
                      : 'Past events and performance photos'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Recent photo thumbnails */}
                  {recentPhotos.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {recentPhotos.map((photo: any) => (
                        <div key={photo.id} className="aspect-square rounded-md overflow-hidden bg-muted">
                          <img
                            src={photo.photoUrl}
                            alt={photo.caption || 'Performance photo'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
                      See details from previous events this artist has performed at.
                    </p>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/artists/${artistId}/history`)}
                  >
                    View Full Portfolio
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Reviews & Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <ReviewSystem
                  targetId={artistId}
                  targetType="artist"
                  onReviewSubmitted={() => {
                    // Reviews are now persisted via tRPC
                  }}
                />
              </CardContent>
            </Card>
        </div>
      </div>

      {/* Sticky Booking Bar for Mobile */}
      {artist && (
        <StickyBookingBar
          artistName={artist.artistName}
          feeRangeMin={artist.feeRangeMin}
          feeRangeMax={artist.feeRangeMax}
          onBookClick={() => {
            if (!isAuthenticated) {
              setShowAuthModal(true);
              return;
            }
            if (user?.role === 'venue') {
              setBookingDialogOpen(true);
            } else {
              navigate(`/book/${artistId}`);
            }
          }}
          heroRef={heroRef}
        />
      )}

      {/* Share Profile Modal */}
      {artist && (
        <ShareProfileModal
          isOpen={shareProfileOpen}
          onClose={() => setShareProfileOpen(false)}
          artistId={artistId}
          artistName={artist.artistName}
          artistBio={artist.bio || ''}
          artistProfileImage={artist.profilePhotoUrl || ''}
        />
      )}
      {/* Auth Modal */}
      <QuickSignupModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultTab="signup"
        actionType="general"
      />

    </div>
  );
}

// Simple helper to display follower count
function FollowerCount({ artistUserId }: { artistUserId: number }) {
  const { data: stats } = trpc.follows.getStats.useQuery(
    { userId: artistUserId },
    { enabled: !!artistUserId }
  );
  const count = stats?.followersCount ?? 0;
  return <>{count} {count === 1 ? 'follower' : 'followers'}</>;
}
