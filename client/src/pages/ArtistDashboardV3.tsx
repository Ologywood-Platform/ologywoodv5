import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MessageSquare, Music, Settings, Star, Clock, DollarSign, Heart, Users, Lock, Download, Crown, Camera, FileText } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { AccountSettings } from '@/components/AccountSettings';
import { EventStatusManager } from '@/components/EventStatusManager';
import { FansSection } from '@/components/FansSection';
import { SubscriptionManagement } from '@/components/SubscriptionManagement';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CalendarSync } from '@/components/CalendarSync';
import ProfileCompletenessCard from '@/components/ProfileCompletenessCard';
import { PerformanceVideoUpload } from '@/components/PerformanceVideoUpload';

export function ArtistDashboardV3() {
  const [, navigate] = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();

  const isArtist = user?.role === 'artist';

  // Redirect non-artist users to appropriate destination
  useEffect(() => {
    if (user) {
      if (user.role === 'venue') {
        navigate('/venue-dashboard');
      } else if (user.role === 'fan') {
        navigate('/');
      } else if (!user.role || user.role === 'user') {
        // No role selected yet — send to role selection
        window.location.href = '/get-started';
      }
    }
  }, [user, navigate]);

  const { data: artistProfile } = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: isArtist,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  const { data: bookings } = trpc.booking.getMyArtistBookings.useQuery(undefined, {
    enabled: isArtist,
    staleTime: 60 * 1000, // 1 minute
  });
  const { data: myEvents = [] } = trpc.events.search.useQuery({ artistId: user?.id || 0 }, {
    enabled: isArtist && !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  const updateEventStatus = trpc.events.update.useMutation();
  // Messages are accessed from the Messages page, not dashboard

  // Verify user is an artist — show skeleton while redirect happens
  if (!isArtist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {/* Quick actions skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <Card key={i}><CardContent className="pt-6 space-y-2"><Skeleton className="h-8 w-8 rounded-md" /><Skeleton className="h-4 w-20" /></CardContent></Card>
            ))}
          </div>
          {/* Content skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card><CardContent className="pt-6 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
            <Card><CardContent className="pt-6 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-2/3" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  // Check if profile is complete
  if (!artistProfile || !artistProfile.artistName || !artistProfile.genre) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>You need to complete your artist profile before accessing the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/onboarding/artist')} className="w-full">
              Complete Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const upcomingBookings = bookings?.filter(b => new Date(b.eventDate) > new Date()) || [];
  const completionScore = (artistProfile as any)?.profileCompletionScore || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white dark:bg-gray-900 dark:border-gray-800 shadow-sm transition-colors duration-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">Artist Dashboard</h1>
              <p className="text-sm text-slate-600 dark:text-gray-400">{artistProfile?.artistName || (artistProfile as any)?.stageName || 'Welcome'}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {showSettings ? (
          <AccountSettings />
        ) : (
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {artistProfile?.profilePhotoUrl && (
                      <img
                        src={artistProfile.profilePhotoUrl}
                        alt={artistProfile.artistName || 'Artist'}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-2xl">{artistProfile?.artistName || 'Artist'}</CardTitle>
                      <CardDescription>{artistProfile?.genre || 'Genre not specified'}</CardDescription>
                      {artistProfile && (artistProfile as any)?.averageRating && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">{((artistProfile as any).averageRating || 0).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/profile/edit')}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Profile Completion</span>
                    <span className="text-sm font-bold">{completionScore}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${completionScore}%` }}
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    {completionScore < 100 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/onboarding/artist')}
                        className="flex-1"
                      >
                        Complete Your Profile
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => navigate(`/artist/${artistProfile?.id || ''}`)}
                      className="flex-1"
                    >
                      View Public Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profile Completeness */}
            {artistProfile && (
              <ProfileCompletenessCard
                profile={artistProfile}
                type="artist"
                onEditProfile={() => navigate('/rider-builder')}
              />
            )}

            {/* Quick Actions */}
            <Card id="quick-actions">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/bookings')}
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">Bookings</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/availability')}
                  >
                    <Clock className="h-5 w-5" />
                    <span className="text-xs">Availability</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/riders')}
                  >
                    <Music className="h-5 w-5" />
                    <span className="text-xs">Riders</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/messages')}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-xs">Messages</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/earnings')}
                  >
                    <DollarSign className="h-5 w-5" />
                    <span className="text-xs">Earnings</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/releases')}
                  >
                    <Download className="h-5 w-5" />
                    <span className="text-xs">Releases</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/events')}
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">Events</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/favorites')}
                  >
                    <Heart className="h-5 w-5" />
                    <span className="text-xs">Favorites</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate(`/artists/${artistProfile?.id || ''}/history`)}
                  >
                    <Camera className="h-5 w-5" />
                    <span className="text-xs">Portfolio</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/contracts')}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">Contracts</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
                  <CardDescription>{upcomingBookings.length} event(s) scheduled</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div>
                          <p className="font-semibold text-sm">Booking #{booking.id}</p>
                          <p className="text-xs text-slate-600">
                            {new Date(booking.eventDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/booking/${booking.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calendar Sync */}
            <CalendarSync />

            {/* Events Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Your Events</CardTitle>
                    <CardDescription>Manage your posted events and gigs</CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => navigate('/events/create')}
                  >
                    Create Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {myEvents && myEvents.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      You have {myEvents.length} posted event{myEvents.length !== 1 ? 's' : ''}. Update their status below.
                    </p>
                    {myEvents.slice(0, 3).map((event: any) => (
                      <EventStatusManager
                        key={event.id}
                        eventId={event.id}
                        eventTitle={event.eventTitle}
                        currentStatus={event.status as 'available' | 'booked' | 'completed' | 'cancelled'}
                        onStatusChange={async (eventId, newStatus) => {
                          try {
                            await updateEventStatus.mutateAsync({
                              id: eventId,
                              status: newStatus as 'available' | 'booked' | 'completed' | 'cancelled',
                            });
                          } catch (error) {
                            // Error handled by tRPC mutation
                          }
                        }}
                      />
                    ))}
                    {myEvents.length > 3 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/events')}
                      >
                        View All Events
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-600 mb-4">
                      You haven't posted any events yet. Create your first event to attract venues!
                    </p>
                    <Button
                      onClick={() => navigate('/events/create')}
                      className="w-full"
                    >
                      Create Your First Event
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Video (Pro Feature) */}
            <PerformanceVideoUpload
              subscriptionTier={(artistProfile as any)?.subscriptionTier || 'free'}
              onUpgradeClick={() => {
                const subSection = document.getElementById('subscription-management');
                if (subSection) subSection.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Subscription Management */}
            <div id="subscription-management">
              <SubscriptionManagement />
            </div>

            {/* Fans Section */}
            <FansSection artistUserId={user?.id} />

            {/* Messages are accessed from the Messages page */}

            {/* Empty State */}
            {upcomingBookings.length === 0 && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-slate-600 mb-4">No upcoming bookings yet</p>
                  <Button onClick={() => navigate('/venues')}>
                    Browse Venues
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav mode="dashboard" />
    </div>
  );
}

export default ArtistDashboardV3;
