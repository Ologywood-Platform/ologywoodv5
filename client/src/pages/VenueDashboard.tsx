import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../_core/hooks/useAuth';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertCircle, CheckCircle, Settings, Calendar, Users } from 'lucide-react';

export function VenueDashboard() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch venue profile
  const { data: profile, isLoading: profileLoading, error: profileError } = trpc.venue.getMyProfile.useQuery(
    undefined,
    { enabled: !!user && (user.role === 'venue' || user.role === 'admin') }
  );

  // Fetch venue bookings
  const { data: bookings, isLoading: bookingsLoading } = trpc.booking.getMyVenueBookings.useQuery(
    undefined,
    { enabled: !!user && (user.role === 'venue' || user.role === 'admin') }
  );

  // Role check
  useEffect(() => {
    if (!isLoading && user && user.role !== 'venue' && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  if (isLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading venue dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'venue' && user.role !== 'admin')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Access Denied
            </CardTitle>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Venue Dashboard</h1>
          <p className="text-gray-600">Manage your venue, bookings, and artist connections</p>
        </div>

        {/* Profile Status Card */}
        {!profile && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Complete Your Profile
              </CardTitle>
              <CardDescription>Set up your venue profile to start receiving booking requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setActiveTab('profile')} className="bg-blue-600 hover:bg-blue-700">
                Create Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Profile
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Bookings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {bookings?.filter(b => b.status === 'confirmed').length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">
                    {bookings?.filter(b => b.status === 'pending').length || 0}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Profile Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    {profile ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="text-sm font-medium text-green-600">Complete</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-yellow-500" />
                        <span className="text-sm font-medium text-yellow-600">Incomplete</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Venue Info Card */}
            {profile && (
              <Card>
                <CardHeader>
                  <CardTitle>{profile.organizationName}</CardTitle>
                  <CardDescription>{profile.location || 'Location not set'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Contact Name</p>
                      <p className="font-medium">{profile.contactName || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{profile.contactPhone || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">About</p>
                      <p className="font-medium">{profile.bio || 'No description yet'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            {bookingsLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">Loading bookings...</p>
                </CardContent>
              </Card>
            ) : bookings && bookings.length > 0 ? (
              <div className="space-y-4">
                {bookings.map(booking => (
                  <Card key={booking.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{booking.artistName || 'Artist'}</CardTitle>
                      <CardDescription>
                        {new Date(booking.eventDate).toLocaleDateString()} • {booking.status}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm"><span className="font-medium">Event:</span> {booking.eventName}</p>
                        <p className="text-sm"><span className="font-medium">Rate:</span> ${booking.rate}</p>
                        <p className="text-sm"><span className="font-medium">Notes:</span> {booking.notes || 'None'}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">No bookings yet. Browse artists to get started!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {profile ? (
              <Card>
                <CardHeader>
                  <CardTitle>Venue Profile</CardTitle>
                  <CardDescription>Manage your venue information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Organization Name</label>
                      <p className="text-gray-700 mt-1">{profile.organizationName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <p className="text-gray-700 mt-1">{profile.location || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Name</label>
                      <p className="text-gray-700 mt-1">{profile.contactName || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Contact Phone</label>
                      <p className="text-gray-700 mt-1">{profile.contactPhone || 'Not set'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">About</label>
                      <p className="text-gray-700 mt-1">{profile.bio || 'Not set'}</p>
                    </div>
                    <Button className="w-full mt-4">Edit Profile</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Create Venue Profile</CardTitle>
                  <CardDescription>Set up your venue to start receiving bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full">Create Profile</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
