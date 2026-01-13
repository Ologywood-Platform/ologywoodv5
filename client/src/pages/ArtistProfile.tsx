import { useRoute, Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Music, MapPin, DollarSign, Users, Globe, Instagram, Facebook, Youtube, Music2 } from "lucide-react";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import { useState } from "react";
import { toast } from "sonner";

export default function ArtistProfile() {
  const [, params] = useRoute("/artist/:id");
  const artistId = params?.id ? parseInt(params.id) : 0;
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: artist, isLoading } = trpc.artist.getProfile.useQuery({ id: artistId });
  const { data: availability } = trpc.availability.getForArtist.useQuery({ artistId });
  
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [eventDetails, setEventDetails] = useState("");
  const [totalFee, setTotalFee] = useState("");
  
  const createBooking = trpc.booking.create.useMutation({
    onSuccess: () => {
      toast.success("Booking request sent successfully!");
      setBookingDialogOpen(false);
      navigate("/dashboard");
    },
    onError: (error) => {
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
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading artist profile...</p>
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
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Music className="h-8 w-8" />
            Ologywood
          </Link>
          
          <div className="flex items-center gap-4">
            <Link href="/browse">
              <Button variant="ghost">Browse Artists</Button>
            </Link>
            {isAuthenticated && (
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8">
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
              <h1 className="text-4xl font-bold mb-2">{artist.artistName}</h1>
              <p className="text-xl text-muted-foreground mb-4">
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
            
            <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="md:min-w-[200px]">
                  Request Booking
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Request Booking with {artist.artistName}</DialogTitle>
                  <DialogDescription>
                    Fill out the details below to send a booking request.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eventDate">Event Date *</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventTime">Event Time</Label>
                      <Input
                        id="eventTime"
                        type="time"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="venueName">Venue Name *</Label>
                    <Input
                      id="venueName"
                      value={venueName}
                      onChange={(e) => setVenueName(e.target.value)}
                      placeholder="Enter venue name"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="venueAddress">Venue Address</Label>
                    <Input
                      id="venueAddress"
                      value={venueAddress}
                      onChange={(e) => setVenueAddress(e.target.value)}
                      placeholder="Enter venue address"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="totalFee">Offered Fee ($)</Label>
                    <Input
                      id="totalFee"
                      type="number"
                      value={totalFee}
                      onChange={(e) => setTotalFee(e.target.value)}
                      placeholder="Enter your offer"
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
                  
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setBookingDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createBooking.isPending}>
                      {createBooking.isPending ? "Sending..." : "Send Request"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
          </div>
        </div>
      </div>
    </div>
  );
}
