import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Search, Settings, Calendar, MapPin, Users } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
// import { VenueAccountSettings } from '@/components/VenueAccountSettings';

export function VenueDashboard() {
  const [, navigate] = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();

  const { data: venueProfile } = ((trpc.venue as any)?.getMyProfile?.useQuery?.() || { data: null });
  const { data: bookings } = ((trpc.booking as any)?.getMyVenueBookings?.useQuery?.() || { data: [] });
  // Messages are accessed from the Messages page, not dashboard

  // Verify user is a venue
  if (user?.role !== 'venue') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This dashboard is only for venues.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingBookings = bookings?.filter(b => b.status === 'pending') || [];
  const upcomingBookings = bookings?.filter(b => new Date(b.eventDate) > new Date()) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
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
              <h1 className="text-2xl font-bold text-gray-900">Venue Dashboard</h1>
              <p className="text-sm text-gray-600">{venueProfile?.organizationName || 'Welcome'}</p>
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
          <div>Settings component disabled</div>
          // <VenueAccountSettings />
        ) : (
          <div className="space-y-6">
            {/* Venue Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {venueProfile?.profilePhotoUrl && (
                      <img
                        src={venueProfile.profilePhotoUrl}
                        alt={venueProfile.organizationName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-2xl">{venueProfile?.organizationName || 'Venue'}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        {venueProfile?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {venueProfile.city}
                          </span>
                        )}
                        {venueProfile?.capacity && (
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {venueProfile.capacity} capacity
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/browse')}
                  >
                    <Search className="h-5 w-5" />
                    <span className="text-xs">Browse Artists</span>
                  </Button>
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
                    onClick={() => navigate('/messages')}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-xs">Messages</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/account')}
                  >
                    <Settings className="h-5 w-5" />
                    <span className="text-xs">Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pending Booking Requests */}
            {pendingBookings.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-900">Pending Requests</CardTitle>
                  <CardDescription className="text-orange-800">
                    {pendingBookings.length} booking request(s) awaiting your response
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                      >
                        <div>
                          <p className="font-semibold text-sm">{booking.artistName}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(booking.eventDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => navigate(`/bookings/${booking.id}`)}
                        >
                          Review
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Events */}
            {upcomingBookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Events</CardTitle>
                  <CardDescription>{upcomingBookings.length} event(s) confirmed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div>
                          <p className="font-semibold text-sm">{booking.artistName}</p>
                          <p className="text-xs text-slate-600">
                            {new Date(booking.eventDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/bookings/${booking.id}`)}
                        >
                          Details
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Messages are accessed from the Messages page */}

            {/* Empty State */}
            {pendingBookings.length === 0 && upcomingBookings.length === 0 && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-gray-600 mb-4">No bookings yet. Start by browsing artists!</p>
                  <Button onClick={() => navigate('/browse')}>
                    Browse Artists
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default VenueDashboard;
