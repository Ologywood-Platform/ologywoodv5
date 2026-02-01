import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation, Link } from 'wouter';
import { getLoginUrl } from '@/const';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { 
  Calendar, 
  MessageSquare, 
  Settings, 
  BarChart3, 
  Heart, 
  Music, 
  FileText,
  Plus,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardV2() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: artistProfile } = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });
  
  const { data: venueProfile } = trpc.venue.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'venue',
  });

  const { data: artistBookings } = trpc.booking.getMyArtistBookings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });
  
  const { data: venueBookings } = trpc.booking.getMyVenueBookings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'venue',
  });

  const { data: unreadCount } = trpc.message.getTotalUnreadCount.useQuery(undefined, {
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const isArtist = user.role === 'artist';
      const hasProfile = isArtist ? artistProfile : venueProfile;
      if (hasProfile === null) {
        navigate('/onboarding');
      }
    }
  }, [loading, isAuthenticated, user, artistProfile, venueProfile, navigate]);

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

  const upcomingBookings = bookings?.filter(b => new Date(b.eventDate) > new Date()).slice(0, 3) || [];
  const pendingBookings = bookings?.filter(b => b.status === 'pending').length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
                <Music className="h-8 w-8" />
                <span className="hidden sm:inline">Ologywood</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-4">
              {unreadCount && unreadCount.count > 0 && (
                <Link href="/messages">
                  <Button variant="ghost" size="sm" className="relative">
                    <MessageSquare className="h-5 w-5" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount.count}
                    </Badge>
                  </Button>
                </Link>
              )}
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">{user.name || user.email}</span>
                <Badge variant="secondary" className="hidden sm:inline">
                  {isArtist ? 'Artist' : isVenue ? 'Venue' : user.role}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user.name?.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">
            {isArtist 
              ? 'Manage your bookings, availability, and riders' 
              : 'Manage your venues, bookings, and artist connections'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Upcoming Events</p>
                  <p className="text-3xl font-bold">{upcomingBookings.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-3xl font-bold">{pendingBookings}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Messages</p>
                  <p className="text-3xl font-bold">{unreadCount?.count || 0}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profile</p>
                  <p className="text-3xl font-bold">{hasProfile ? '100%' : '0%'}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 gap-2 mb-8 h-auto p-2">
            <TabsTrigger value="overview" className="flex flex-col items-center gap-1 py-3">
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex flex-col items-center gap-1 py-3">
              <Calendar className="h-4 w-4" />
              <span className="text-xs">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="messages" className="flex flex-col items-center gap-1 py-3">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs">Messages</span>
            </TabsTrigger>
            {isArtist && (
              <TabsTrigger value="availability" className="flex flex-col items-center gap-1 py-3">
                <Clock className="h-4 w-4" />
                <span className="text-xs">Availability</span>
              </TabsTrigger>
            )}
            {isArtist && (
              <TabsTrigger value="riders" className="flex flex-col items-center gap-1 py-3">
                <FileText className="h-4 w-4" />
                <span className="text-xs">Riders</span>
              </TabsTrigger>
            )}
            {isVenue && (
              <TabsTrigger value="artists" className="flex flex-col items-center gap-1 py-3">
                <Heart className="h-4 w-4" />
                <span className="text-xs">Favorites</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isArtist ? (
                    <>
                      <Link href="/availability">
                        <Button className="w-full justify-start" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Set Availability
                        </Button>
                      </Link>
                      <Link href="/saved-riders">
                        <Button className="w-full justify-start" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Manage Riders
                        </Button>
                      </Link>
                      <Link href="/messages">
                        <Button className="w-full justify-start" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Messages
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link href="/browse">
                        <Button className="w-full justify-start" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Browse Artists
                        </Button>
                      </Link>
                      <Link href="/bookings">
                        <Button className="w-full justify-start" variant="outline">
                          <Calendar className="h-4 w-4 mr-2" />
                          New Booking
                        </Button>
                      </Link>
                      <Link href="/messages">
                        <Button className="w-full justify-start" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-2" />
                          View Messages
                        </Button>
                      </Link>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Events</CardTitle>
                  <CardDescription>Your next scheduled bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingBookings.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingBookings.map((booking: any) => (
                        <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted transition">
                          <div className="flex-1">
                            <p className="font-medium">{isArtist ? booking.venueName : booking.artistName}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(booking.eventDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <p className="text-muted-foreground">No upcoming events</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/bookings">
                  <Button>View All Bookings <ArrowRight className="h-4 w-4 ml-2" /></Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/messages">
                  <Button>Open Messages <ArrowRight className="h-4 w-4 ml-2" /></Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Artist-specific tabs */}
          {isArtist && (
            <>
              <TabsContent value="availability">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href="/availability">
                      <Button>Set Your Availability <ArrowRight className="h-4 w-4 ml-2" /></Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="riders">
                <Card>
                  <CardHeader>
                    <CardTitle>Rider Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link href="/saved-riders">
                      <Button>Manage Riders <ArrowRight className="h-4 w-4 ml-2" /></Button>
                    </Link>
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          {/* Venue-specific tabs */}
          {isVenue && (
            <TabsContent value="artists">
              <Card>
                <CardHeader>
                  <CardTitle>Favorite Artists</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href="/browse">
                    <Button>Browse Artists <ArrowRight className="h-4 w-4 ml-2" /></Button>
                  </Link>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
