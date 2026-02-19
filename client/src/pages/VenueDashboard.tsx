import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare, Search, Settings, Calendar, MapPin, Users, Loader } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';

export function VenueDashboard() {
  const [, navigate] = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();

  // Proper TRPC calls with correct types
  const { data: venueProfile, isLoading: profileLoading } = trpc.venue.getMyProfile.useQuery();
  const { data: bookings = [], isLoading: bookingsLoading } = trpc.booking.getMyVenueBookings.useQuery();

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

  const pendingBookings = bookings?.filter((b: any) => b.status === 'pending') || [];
  const upcomingBookings = bookings?.filter((b: any) => new Date(b.eventDate) > new Date()) || [];

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
              <p className="text-sm text-gray-600">
                {profileLoading ? 'Loading...' : venueProfile?.organizationName || 'Welcome'}
              </p>
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
          // Settings View
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Venue Settings</CardTitle>
                <CardDescription>Manage your venue profile and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name
                      </label>
                      <p className="text-gray-900 font-medium">
                        {venueProfile?.organizationName || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name
                      </label>
                      <p className="text-gray-900">
                        {venueProfile?.contactName || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <p className="text-gray-900">
                        {venueProfile?.contactPhone || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <p className="text-gray-900">
                        {venueProfile?.location || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <p className="text-gray-900">
                        {venueProfile?.city || 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Capacity
                      </label>
                      <p className="text-gray-900">
                        {venueProfile?.capacity ? `${venueProfile.capacity} people` : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <p className="text-gray-900">
                        {venueProfile?.bio || 'Not set'}
                      </p>
                    </div>
                    <Button onClick={() => navigate('/venue-profile')} className="w-full">
                      Edit Profile
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Main Dashboard View
          <div className="space-y-6">
            {/* Venue Info Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {profileLoading ? (
                      <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
                    ) : venueProfile?.profilePhotoUrl ? (
                      <img
                        src={venueProfile.profilePhotoUrl}
                        alt={venueProfile.organizationName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-blue-200 rounded-lg flex items-center justify-center">
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-2xl">
                        {profileLoading ? 'Loading...' : venueProfile?.organizationName || 'Venue'}
                      </CardTitle>
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

            {/* Loading State */}
            {bookingsLoading && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Loader className="h-8 w-8 mx-auto mb-4 animate-spin text-gray-400" />
                  <p className="text-gray-600">Loading bookings...</p>
                </CardContent>
              </Card>
            )}

            {/* Pending Booking Requests */}
            {!bookingsLoading && pendingBookings.length > 0 && (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg text-orange-900">Pending Requests</CardTitle>
                  <CardDescription className="text-orange-800">
                    {pendingBookings.length} booking request(s) awaiting your response
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingBookings.slice(0, 3).map((booking: any) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                      >
                        <div>
                          <p className="font-semibold text-sm">{booking.artistName || 'Artist'}</p>
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
            {!bookingsLoading && upcomingBookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Events</CardTitle>
                  <CardDescription>{upcomingBookings.length} event(s) confirmed</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingBookings.slice(0, 3).map((booking: any) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div>
                          <p className="font-semibold text-sm">{booking.artistName || 'Artist'}</p>
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

            {/* Empty State */}
            {!bookingsLoading && pendingBookings.length === 0 && upcomingBookings.length === 0 && (
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
