import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Music, MapPin, DollarSign, Users, Globe, Instagram, Facebook, Youtube, Music2, FileText, ChevronDown, Star, Heart } from "lucide-react";
import { FollowButton } from "@/components/FollowButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { ShareProfileModal } from "@/components/ShareProfileModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { RiderComparisonTool } from "../components/RiderComparisonTool";
import { JsonLd, buildArtistJsonLd, buildBreadcrumbJsonLd } from "../components/JsonLd";
import { ReviewSystem } from "@/components/ReviewSystem";
import { useState, useEffect, useRef } from "react";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { useParams, useLocation } from "wouter";
import { ProfileHeaderSkeleton, ProfileSectionSkeleton, PhotoGridSkeleton } from "@/components/SkeletonLoader";
import { setMetaTags, pageMetaTags } from "@/utils/seoMeta";
import { getDashboardUrl } from "@/utils/dashboardUrl";
import SiteHeader from "@/components/SiteHeader";
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
  const [showRiderComparison, setShowRiderComparison] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<number | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
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
      setVenueAddress((template as any).templateData?.venueAddress || "");
      
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
      toast.success("Booking request sent successfully!");
      setBookingDialogOpen(false);
      setSelectedRiderId(null);
      setShowRiderComparison(false);
      navigate("/dashboard");
    },
      onError: (error: any) => {
      toast.error(error.message || "Failed to create booking");
    },
  });


  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    
    if (user?.role !== 'venue') {
      toast.error("Only venues can create booking requests");
      return;
    }
    
    createBooking.mutate({
      artistId,
      eventDate,
      eventTime,
      venueName,
      venueAddress,
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

  const socialLinks = artist.socialLinks as { instagram?: string; facebook?: string; youtube?: string; spotify?: string } | null;
  const mediaGallery = artist.mediaGallery as { photos: string[]; videos: string[] } | null;

  return (
    <div className="min-h-screen bg-background">
      {artist && <JsonLd data={[buildArtistJsonLd(artist), buildBreadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: 'Browse Artists', url: '/browse' }, { name: artist.artistName, url: `/artist/${artistId}` }])]} id={`artist-${artistId}`} />}
      {/* Shared Header with Following link */}
      <SiteHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-6 sm:mb-8" ref={heroRef}>
          {artist.profilePhotoUrl ? (
            <div className="w-full h-64 md:h-96 rounded-lg overflow-hidden mb-6">
              <img 
                src={artist.profilePhotoUrl} 
                alt={artist.artistName}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-64 md:h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center mb-6">
              <Music className="h-32 w-32 text-primary/40" />
            </div>
          )}
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{artist.artistName}</h1>
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
                      <Input
                        id="eventDate"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                        className="h-11 sm:h-10 text-base sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventTime" className="text-sm font-medium">Event Time</Label>
                      <Input
                        id="eventTime"
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        className="h-11 sm:h-10 text-base sm:text-sm"
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
                  
                  <div>
                    <Label htmlFor="venueAddress" className="text-sm font-medium">Venue Address</Label>
                    <Input
                      id="venueAddress"
                      value={venueAddress}
                      onChange={(e) => setVenueAddress(e.target.value)}
                      placeholder="Enter venue address"
                      className="h-11 sm:h-10 text-base sm:text-sm"
                    />
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

              {/* Secondary actions row */}
              <div className="flex items-center gap-2 flex-wrap">
                <FollowButton artistUserId={artist.userId || artistId} artistName={artist.artistName} showCount={false} />
                <FavoriteButton artistId={artistId} size="lg" showText={false} />
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

        <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 md:p-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
            
            {/* Media Gallery */}
            {mediaGallery && (mediaGallery.photos.length > 0 || mediaGallery.videos.length > 0) && (
              <Card>
                <CardHeader>
                  <CardTitle>Media Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Links */}
            {(socialLinks || artist.websiteUrl) && (
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
                      <Music2 className="h-4 w-4" />
                      <span>Spotify</span>
                    </a>
                  )}
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
                <CardContent className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b pb-4 last:border-0">
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

            {/* Review System */}
            {/* Events Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events & Gigs</CardTitle>
                <CardDescription>Events this artist has posted</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  Upcoming events and gigs from this artist. Click an event to view details or inquire about booking.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/events?artistId=${artistId}`)}
                >
                  View All Events
                </Button>
              </CardContent>
            </Card>

            {/* Event History/Portfolio */}
            <Card>
              <CardHeader>
                <CardTitle>Event History & Portfolio</CardTitle>
                <CardDescription>Past events and performance photos</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  See photos and details from previous events this artist has performed at.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(`/artists/${artistId}/history`)}
                >
                  View Portfolio
                </Button>
              </CardContent>
            </Card>

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
      </div>

      {/* Sticky Booking Bar for Mobile */}
      {artist && (
        <StickyBookingBar
          artistName={artist.artistName}
          feeRangeMin={artist.feeRangeMin}
          feeRangeMax={artist.feeRangeMax}
          onBookClick={() => setBookingDialogOpen(true)}
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
