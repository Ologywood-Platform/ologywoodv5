import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Heart, Settings, Calendar, FileText, TrendingUp, MessageSquare, Bell, AlertCircle, LogOut, Music, MapPin, DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { RiderTemplateBuilder } from "@/components/RiderTemplateBuilder";
import { RiderAnalyticsDashboard } from "@/components/RiderAnalyticsDashboard";
import { Messaging } from "@/components/Messaging";
import { CalendarSync } from "@/components/CalendarSync";
import { NotificationCenter } from "@/components/NotificationCenter";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { FavoritesTab } from "@/components/FavoritesTab";
import { AdminDashboard } from "@/components/AdminDashboard";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("bookings");
  
  const isArtist = user?.role === 'artist';
  const isVenue = user?.role === 'venue';

  const { data: artistProfile } = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && isArtist,
  });
  
  const { data: venueProfile } = trpc.venue.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && isVenue,
  });

  const uploadArtistPhotoMutation = trpc.artist.uploadProfilePhoto.useMutation();
  const uploadVenuePhotoMutation = trpc.venue.uploadProfilePhoto.useMutation();
  
  const { data: artistBookings, refetch: refetchArtistBookings } = trpc.booking.getMyArtistBookings.useQuery(undefined, {
    enabled: isAuthenticated && isArtist,
  });
  
  const { data: venueBookings, refetch: refetchVenueBookings } = trpc.booking.getMyVenueBookings.useQuery(undefined, {
    enabled: isAuthenticated && isVenue,
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
    
    // Redirect to onboarding if user doesn't have a profile
    if (!loading && isAuthenticated && user) {
      const hasProfile = (isArtist && artistProfile) || (isVenue && venueProfile);
      if (!hasProfile) {
        navigate('/onboarding');
      }
    }
  }, [isAuthenticated, loading, user, artistProfile, venueProfile, navigate]);

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
  
  // Check if user has a profile
  const hasProfile = (isArtist && artistProfile) || (isVenue && venueProfile);
  
  // If no profile, show loading while redirecting to onboarding
  if (!hasProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Redirecting to setup...</p>
      </div>
    );
  }
  const bookings = isArtist ? artistBookings : venueBookings;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const logoutMutation = trpc.auth.logout.useMutation();
  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <img src="/logo-icon.png" alt="Ologywood" className="h-8 w-8 rounded" />
            Ologywood
          </Link>
          
          <nav className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.name || user?.email}
            </span>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:text-red-700"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex gap-2 border-b overflow-x-auto mb-6">
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
              <TabsTrigger value="riderAnalytics">
                <TrendingUp className="h-4 w-4 mr-2" />
                Rider Analytics
              </TabsTrigger>
            )}
            {isArtist && (
              <TabsTrigger value="favorites">
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </TabsTrigger>
            )}
            {isVenue && (
              <TabsTrigger value="favorites">
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </TabsTrigger>
            )}
            {isArtist && (
              <TabsTrigger value="subscription">
                <Settings className="h-4 w-4 mr-2" />
                Subscription
              </TabsTrigger>
            )}
            <TabsTrigger value="bookings">
              <Calendar className="h-4 w-4 mr-2" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="messages">
              <MessageSquare className="h-4 w-4 mr-2" />
              Messages
              {unreadCount && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="support">
              <AlertCircle className="h-4 w-4 mr-2" />
              Support
            </TabsTrigger>
            {user?.role === 'admin' && (
              <TabsTrigger value="admin">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </TabsTrigger>
            )}
          </div>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Profile</h2>
                <p className="text-muted-foreground">Manage your profile information</p>
              </div>
              {isArtist && artistProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Artist Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Artist Name</label>
                      <p className="text-foreground">{artistProfile.artistName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Bio</label>
                      <p className="text-foreground">{artistProfile.bio || 'No bio added'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <p className="text-foreground">{artistProfile.location || 'No location'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              {isVenue && venueProfile && (
                <Card>
                  <CardHeader>
                    <CardTitle>Venue Profile</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Venue Name</label>
                      <p className="text-foreground">{venueProfile.venueName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-foreground">{venueProfile.description || 'No description'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <p className="text-foreground">{venueProfile.location || 'No location'}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Availability Tab (Artists only) */}
          {isArtist && (
            <TabsContent value="availability">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Availability</h2>
                  <p className="text-muted-foreground">Manage your performance availability</p>
                </div>
              </div>
            </TabsContent>
          )}

          {/* Riders Tab (Artists only) */}
          {isArtist && (
            <TabsContent value="riders">
              <RiderTemplateBuilder />
            </TabsContent>
          )}

          {/* Rider Analytics Tab (Artists only) */}
          {isArtist && (
            <TabsContent value="riderAnalytics">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Rider Analytics</h2>
                  <p className="text-muted-foreground mb-6">Track your rider performance, acceptance rates, and negotiation metrics</p>
                </div>
                <RiderAnalyticsDashboard artistId={user?.id || 0} />
              </div>
            </TabsContent>
          )}

          {/* Favorites Tab (Both roles) */}
          {(isArtist || isVenue) && (
            <TabsContent value="favorites">
              <FavoritesTab />
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
                    <Button asChild>
                      <span>View Details</span>
                    </Button>
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

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">My Bookings</h2>
                <p className="text-muted-foreground mb-6">Manage your upcoming and past performances</p>
              </div>
              
              {bookings && bookings.length > 0 ? (
                <div className="grid gap-4">
                  {bookings.map((booking: any) => (
                    <Card key={booking.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>{isArtist ? booking.venueName : booking.artistName}</CardTitle>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <CardDescription>
                          {new Date(booking.eventDate).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            Fee: ${booking.fee}
                          </p>
                          <Link href={`/booking/${booking.id}`}>
                            <Button variant="outline" size="sm">View Details</Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No bookings yet
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Messaging />
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Notifications</h2>
                <p className="text-muted-foreground mb-6">Manage your notification preferences</p>
              </div>
              <NotificationPreferences />
              <NotificationCenter />
            </div>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold mb-2">Support</h2>
                <p className="text-muted-foreground mb-6">Get help and report issues</p>
              </div>
              <Link href="/support">
                <Button>View Support Tickets</Button>
              </Link>
            </div>
          </TabsContent>

          {/* Admin Tab */}
          {user?.role === 'admin' && (
            <TabsContent value="admin">
              <AdminDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
