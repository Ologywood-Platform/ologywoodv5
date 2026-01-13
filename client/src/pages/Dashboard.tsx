import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Music, Calendar, MessageSquare, Settings, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("bookings");

  const { data: artistProfile } = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });
  
  const { data: venueProfile } = trpc.venue.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'venue',
  });
  
  const { data: artistBookings, refetch: refetchArtistBookings } = trpc.booking.getMyArtistBookings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });
  
  const { data: venueBookings, refetch: refetchVenueBookings } = trpc.booking.getMyVenueBookings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'venue',
  });

  const updateBookingStatus = trpc.booking.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Booking status updated");
      refetchArtistBookings();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update booking");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isArtist = user.role === 'artist';
  const isVenue = user.role === 'venue';
  const bookings = isArtist ? artistBookings : venueBookings;
  const hasProfile = isArtist ? artistProfile : venueProfile;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Music className="h-8 w-8" />
              Ologywood
            </a>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.name || user.email}
            </span>
            <Badge variant="secondary">
              {isArtist ? 'Artist' : isVenue ? 'Venue' : user.role}
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <a>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </a>
          </Link>
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </div>

        {/* Profile Setup Warning */}
        {!hasProfile && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle>Complete Your Profile</CardTitle>
              <CardDescription>
                {isArtist 
                  ? "Create your artist profile to start receiving booking requests."
                  : "Create your venue profile to start booking artists."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setActiveTab("profile")}>
                Set Up Profile
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="profile">
              <Settings className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            {isArtist && (
              <TabsTrigger value="availability">
                <Calendar className="h-4 w-4 mr-2" />
                Availability
              </TabsTrigger>
            )}
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isArtist ? "My Bookings" : "Booking Requests"}
                </CardTitle>
                <CardDescription>
                  {isArtist 
                    ? "Manage your upcoming and past performances"
                    : "View your booking requests and confirmations"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookings && bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{booking.venueName}</CardTitle>
                              <CardDescription>
                                {formatDate(booking.eventDate)}
                                {booking.eventTime && ` at ${booking.eventTime}`}
                              </CardDescription>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {booking.venueAddress && (
                            <p className="text-sm text-muted-foreground mb-2">
                              📍 {booking.venueAddress}
                            </p>
                          )}
                          {booking.totalFee && (
                            <p className="text-sm text-muted-foreground mb-2">
                              💰 ${booking.totalFee}
                            </p>
                          )}
                          {booking.eventDetails && (
                            <p className="text-sm text-muted-foreground mb-4">
                              {booking.eventDetails}
                            </p>
                          )}
                          
                          {isArtist && booking.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm"
                                onClick={() => updateBookingStatus.mutate({ id: booking.id, status: 'confirmed' })}
                                disabled={updateBookingStatus.isPending}
                              >
                                Accept
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateBookingStatus.mutate({ id: booking.id, status: 'cancelled' })}
                                disabled={updateBookingStatus.isPending}
                              >
                                Decline
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="mb-4">No bookings yet</p>
                    {isVenue && (
                      <Link href="/browse">
                        <a>
                          <Button>Browse Artists</Button>
                        </a>
                      </Link>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  {hasProfile 
                    ? "Update your profile information"
                    : "Create your profile to get started"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Profile management coming soon. For now, please contact support to update your profile.
                </p>
                {isArtist && artistProfile && (
                  <div className="space-y-2 text-sm">
                    <p><strong>Artist Name:</strong> {artistProfile.artistName}</p>
                    {artistProfile.location && <p><strong>Location:</strong> {artistProfile.location}</p>}
                    {artistProfile.genre && Array.isArray(artistProfile.genre) && artistProfile.genre.length > 0 && (
                      <p><strong>Genres:</strong> {artistProfile.genre.join(", ")}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab (Artists only) */}
          {isArtist && (
            <TabsContent value="availability">
              <Card>
                <CardHeader>
                  <CardTitle>Manage Availability</CardTitle>
                  <CardDescription>
                    Set your available dates for bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Calendar integration coming soon. Bookings will automatically update your availability.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
