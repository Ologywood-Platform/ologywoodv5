import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Music, Calendar, MessageSquare, Settings, ArrowLeft, FileText, Star, Heart, TrendingUp, Bell, HelpCircle, Headphones } from "lucide-react";
import AvailabilityCalendar from "@/components/AvailabilityCalendar";
import ReviewsTabContent from "@/components/ReviewsTabContent";
import UnreadBadge from "@/components/UnreadBadge";
import { PhotoGalleryManager } from "@/components/PhotoGalleryManager";
import SavedArtistsTab from "@/components/SavedArtistsTab";
import BookingTemplatesTab from "@/components/BookingTemplatesTab";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import VenueCalendar from "@/components/VenueCalendar";
import { ArtistProfileEditor } from "@/components/ArtistProfileEditor";
import { VenueProfileEditor } from "@/components/VenueProfileEditor";
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload";
import { RiderTemplateBuilder } from "@/components/RiderTemplateBuilder";
import { Messaging } from "@/components/Messaging";
import { CalendarSync } from "@/components/CalendarSync";
import { NotificationCenter } from "@/components/NotificationCenter";
import { AdminDashboard } from "@/components/AdminDashboard";
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

  const uploadArtistPhotoMutation = trpc.artist.uploadProfilePhoto.useMutation();
  const uploadVenuePhotoMutation = trpc.venue.uploadProfilePhoto.useMutation();
  
  const { data: artistBookings, refetch: refetchArtistBookings } = trpc.booking.getMyArtistBookings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });
  
  const { data: venueBookings, refetch: refetchVenueBookings } = trpc.booking.getMyVenueBookings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'venue',
  });
  
  const { data: unreadCount } = trpc.message.getTotalUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
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
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Music className="h-8 w-8" />
            Ologywood
          </Link>
          
          <div className="flex items-center gap-4">
            {unreadCount && unreadCount.count > 0 && (
              <div className="relative">
                <MessageSquare className="h-5 w-5 text-muted-foreground" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                >
                  {unreadCount.count}
                </Badge>
              </div>
            )}
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
          <a href="/" className="no-underline">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </a>
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
          <TabsList className="flex w-full overflow-x-auto gap-2 bg-transparent border-b border-border">
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
            {isArtist && (
              <TabsTrigger value="riders">
                <FileText className="h-4 w-4 mr-2" />
                Riders
              </TabsTrigger>
            )}
            {isArtist && (
              <TabsTrigger value="subscription">
                <Settings className="h-4 w-4 mr-2" />
                Subscription
              </TabsTrigger>
            )}
            {isArtist && (
              <>
                <TabsTrigger value="analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="reviews">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Reviews
                </TabsTrigger>
                <TabsTrigger value="photos">
                  <Music className="h-4 w-4 mr-2" />
                  Photos
                </TabsTrigger>
              </>
            )}
            {isVenue && (
              <>
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="saved">
                  <Heart className="h-4 w-4 mr-2" />
                  Saved Artists
                </TabsTrigger>
                <TabsTrigger value="templates">
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </TabsTrigger>
                <TabsTrigger value="photos">
                  <Music className="h-4 w-4 mr-2" />
                  Photos
                </TabsTrigger>
              </>
            )}
            
            {/* Messaging Tab (Both roles) */}
            <TabsTrigger value="messaging">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
            </TabsTrigger>
            
            {/* Notifications Tab (Both roles) */}
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            
            {/* Support Tab (Both roles) */}
            <TabsTrigger value="support">
              <Headphones className="h-4 w-4 mr-2" />
              Support
            </TabsTrigger>
            
            {/* Help Tab (Both roles) */}
            <TabsTrigger value="help">
              <HelpCircle className="h-4 w-4 mr-2" />
              Help
            </TabsTrigger>
            
            {/* Calendar Sync Tab (Artists only) */}
            {isArtist && (
              <TabsTrigger value="calendar-sync">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar Sync
              </TabsTrigger>
            )}
            
            {/* Admin Testing Tab (Admin only) */}
            {user?.role === 'admin' && (
              <TabsTrigger value="admin-testing">
                <TrendingUp className="h-4 w-4 mr-2" />
                Admin Testing
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
                      <Card 
                        key={booking.id} 
                        className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => navigate(`/booking/${booking.id}`)}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{booking.venueName}</CardTitle>
                              <CardDescription>
                                {formatDate(booking.eventDate)}
                                {booking.eventTime && ` at ${booking.eventTime}`}
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(booking.status)}>
                                {booking.status}
                              </Badge>
                              <UnreadBadge bookingId={booking.id} />
                            </div>
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
                      <a href="/browse" className="no-underline">
                        <Button>
                          Browse Artists
                        </Button>
                      </a>
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
                <div className="flex items-start gap-4">
                  {isArtist && artistProfile?.profilePhotoUrl ? (
                    <img 
                      src={artistProfile.profilePhotoUrl} 
                      alt={artistProfile.artistName}
                      className="h-20 w-20 rounded-full object-cover border-2 border-primary"
                    />
                  ) : isArtist ? (
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <Music className="h-10 w-10 text-primary" />
                    </div>
                  ) : null}
                  <div className="flex-1">
                    <CardTitle>Profile Settings</CardTitle>
                    <CardDescription>
                      {hasProfile 
                        ? "Update your profile information"
                        : "Create your profile to get started"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {isArtist && artistProfile ? (
                    <>
                      <ProfilePhotoUpload
                        currentPhotoUrl={artistProfile.profilePhotoUrl || undefined}
                        onUpload={async (fileData, fileName, mimeType) => {
                          try {
                            const result = await uploadArtistPhotoMutation.mutateAsync({
                              fileData,
                              fileName,
                              mimeType,
                            });
                            return result;
                          } catch (error: any) {
                            throw new Error(error.message || 'Failed to upload photo');
                          }
                        }}
                        onSuccess={() => {
                          toast.success('Profile photo updated successfully');
                        }}
                        onError={(error) => {
                          toast.error(error);
                        }}
                      />
                      <ArtistProfileEditor onSave={() => {
                        toast.success('Profile updated successfully');
                      }} />
                    </>
                  ) : isVenue && venueProfile ? (
                    <>
                      <ProfilePhotoUpload
                        currentPhotoUrl={venueProfile.profilePhotoUrl || undefined}
                        onUpload={async (fileData, fileName, mimeType) => {
                          try {
                            const result = await uploadVenuePhotoMutation.mutateAsync({
                              fileData,
                              fileName,
                              mimeType,
                            });
                            return result;
                          } catch (error: any) {
                            throw new Error(error.message || 'Failed to upload photo');
                          }
                        }}
                        onSuccess={() => {
                          toast.success('Profile photo updated successfully');
                        }}
                        onError={(error) => {
                          toast.error(error);
                        }}
                      />
                      <VenueProfileEditor onSave={() => {
                        toast.success('Profile updated successfully');
                      }} />
                    </>
                  ) : (
                    <p className="text-muted-foreground">Loading your profile...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Availability Tab (Artists only) */}
          {isArtist && (
            <TabsContent value="availability">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Manage Availability</h2>
                    <p className="text-muted-foreground">Click dates to mark your availability</p>
                  </div>
                  <Link href="/availability">
                    <a>
                      <Button asChild>
                        <span>Full Calendar View</span>
                      </Button>
                    </a>
                  </Link>
                </div>
                <AvailabilityCalendar
                  availability={artistBookings?.map(b => ({
                    date: typeof b.eventDate === 'string' ? b.eventDate : new Date(b.eventDate).toISOString().split('T')[0],
                    status: 'booked' as const
                  })) || []}
                  readOnly
                />
              </div>
            </TabsContent>
          )}

          {/* Riders Tab (Artists only) */}
          {isArtist && (
            <TabsContent value="riders">
              <RiderTemplateBuilder />
            </TabsContent>
          )}

          {/* Subscription Tab (Artists only) */}
          {isArtist && (
            <TabsContent value="subscription">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Subscription</h2>
                    <p className="text-muted-foreground">Manage your Ologywood subscription</p>
                  </div>
                  <Link href="/subscription">
                    <a>
                      <Button asChild>
                        <span>View Details</span>
                      </Button>
                    </a>
                  </Link>
                </div>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">
                      Subscribe to Ologywood to access all features and start receiving bookings.
                      Click "View Details" to manage your subscription.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* Analytics Tab (Artists only) */}
          {isArtist && (
            <>
              <TabsContent value="analytics">
                <AnalyticsDashboard />
              </TabsContent>
              <TabsContent value="reviews">
                <ReviewsTabContent artistId={artistProfile?.id} />
              </TabsContent>
              <TabsContent value="photos">
                <PhotoGalleryManager role="artist" />
              </TabsContent>
            </>
          )}
          
          {/* Calendar Tab (Venues) */}
          {isVenue && (
            <TabsContent value="calendar">
              <VenueCalendar />
            </TabsContent>
          )}
          
          {/* Saved Artists Tab (Venues) */}
          {isVenue && (
            <TabsContent value="saved">
              <SavedArtistsTab />
            </TabsContent>
          )}
          
          {/* Templates Tab (Venues) */}
          {isVenue && (
            <TabsContent value="templates">
              <BookingTemplatesTab />
            </TabsContent>
          )}
          
          {/* Photos Tab (Venues) */}
          {isVenue && (
            <TabsContent value="photos">
              <PhotoGalleryManager role="venue" />
            </TabsContent>
          )}
          
          {/* Messaging Tab Content */}
          <TabsContent value="messaging">
            <Messaging />
          </TabsContent>
          
          {/* Notifications Tab Content */}
          <TabsContent value="notifications">
            <NotificationCenter />
          </TabsContent>
          
          {/* Calendar Sync Tab Content (Artists only) */}
          {isArtist && (
            <TabsContent value="calendar-sync">
              <CalendarSync />
            </TabsContent>
          )}
          
          {/* Support Tab Content */}
          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Manage your support requests and get help from our team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-4">
                    Need help? Create a support ticket and our team will assist you as soon as possible.
                  </p>
                  <div className="flex gap-2">
                    <Link href="/support">
                      <a className="inline-flex">
                        <Button>View My Tickets</Button>
                      </a>
                    </Link>
                    <Link href="/support/create">
                      <a className="inline-flex">
                        <Button variant="outline">Create New Ticket</Button>
                      </a>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Help Tab Content */}
          <TabsContent value="help">
            <Card>
              <CardHeader>
                <CardTitle>Help Center</CardTitle>
                <CardDescription>Find answers to common questions and learn how to use Ologywood</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground mb-4">
                    Browse our knowledge base, FAQs, and tutorials to find the information you need.
                  </p>
                  <Link href="/help">
                    <a className="inline-flex">
                      <Button>Go to Help Center</Button>
                    </a>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Admin Testing Tab Content */}
          {user?.role === 'admin' && (
            <TabsContent value="admin-testing">
              <AdminDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
