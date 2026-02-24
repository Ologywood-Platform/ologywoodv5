import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../_core/hooks/useAuth';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertCircle, CheckCircle, Settings, Calendar, Users, Plus, Edit2, Eye } from 'lucide-react';

export function VenueDashboard() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    organizationName: '',
    location: '',
    contactName: '',
    contactPhone: '',
    bio: '',
  });

  // Fetch venue profile
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = trpc.venue.getMyProfile.useQuery(
    undefined,
    { enabled: !!user && (user.role === 'venue' || user.role === 'admin') }
  );

  // Fetch venue bookings
  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = trpc.booking.getMyVenueBookings.useQuery(
    undefined,
    { enabled: !!user && (user.role === 'venue' || user.role === 'admin') }
  );

  // Fetch artists for discovery
  const { data: artists, isLoading: artistsLoading } = trpc.artist.getAll.useQuery(
    undefined,
    { enabled: !!user && (user.role === 'venue' || user.role === 'admin') }
  );

  // Update profile form when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        organizationName: profile.organizationName || '',
        location: profile.location || '',
        contactName: profile.contactName || '',
        contactPhone: profile.contactPhone || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  // Role check
  useEffect(() => {
    if (!loading && user && user.role !== 'venue' && user.role !== 'admin') {
      navigate('/');
    }
  }, [user, loading]);

  const validatePhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's a valid length (10-15 digits for international)
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const handleProfileUpdate = async () => {
    try {
      // Validate phone number
      if (profileForm.contactPhone && !validatePhoneNumber(profileForm.contactPhone)) {
        alert('Please enter a valid phone number (10-15 digits)');
        return;
      }
      // TODO: Implement profile update mutation
      setEditingProfile(false);
      refetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleViewArtist = (artistId: number) => {
    navigate(`/artist/${artistId}`);
  };

  if (loading || profileLoading) {
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="artists" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Artists
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
                      <CardTitle className="text-lg">Artist #{booking.artistId}</CardTitle>
                      <CardDescription>
                        {new Date(booking.eventDate).toLocaleDateString()} at {booking.eventTime || 'TBA'} • {booking.status}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {booking.eventDetails && (
                          <div>
                            <p className="text-sm text-gray-600">Event Details</p>
                            <p className="font-medium">{booking.eventDetails}</p>
                          </div>
                        )}
                        {booking.totalFee && (
                          <div>
                            <p className="text-sm text-gray-600">Total Fee</p>
                            <p className="font-medium">${booking.totalFee}</p>
                          </div>
                        )}
                        {booking.depositAmount && (
                          <div>
                            <p className="text-sm text-gray-600">Deposit</p>
                            <p className="font-medium">${booking.depositAmount}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">Payment Status</p>
                          <p className="font-medium capitalize">{booking.paymentStatus}</p>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          {booking.status === 'pending' && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                Accept
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600">
                                Decline
                              </Button>
                            </>
                          )}
                        </div>
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

          {/* Artists Tab */}
          <TabsContent value="artists" className="space-y-4">
            {artistsLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">Loading artists...</p>
                </CardContent>
              </Card>
            ) : artists && artists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artists.map(artist => {
                  if (!artist) return null;
                  return (
                  <Card key={artist.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{artist.artistName || 'Artist'}</CardTitle>
                      <CardDescription>
                        {artist.genre || 'Genre not specified'} • {artist.location || 'Location not specified'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {artist.bio && (
                          <p className="text-sm text-gray-600">{artist.bio}</p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewArtist(artist.id)}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Book Artist
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-600">No artists available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            {editingProfile ? (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Venue Profile</CardTitle>
                  <CardDescription>Update your venue information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Organization Name</label>
                      <input
                        type="text"
                        value={profileForm.organizationName}
                        onChange={(e) => setProfileForm({ ...profileForm, organizationName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Location</label>
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={profileForm.contactName}
                        onChange={(e) => setProfileForm({ ...profileForm, contactName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={profileForm.contactPhone}
                        onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">About</label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleProfileUpdate} className="flex-1 bg-purple-600 hover:bg-purple-700">
                        Save Changes
                      </Button>
                      <Button onClick={() => setEditingProfile(false)} variant="outline" className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : profile ? (
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
                    <Button
                      onClick={() => setEditingProfile(true)}
                      className="w-full mt-4 bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Profile
                    </Button>
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
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Organization Name</label>
                      <input
                        type="text"
                        value={profileForm.organizationName}
                        onChange={(e) => setProfileForm({ ...profileForm, organizationName: e.target.value })}
                        placeholder="Enter your venue name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Location</label>
                      <input
                        type="text"
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                        placeholder="City, State"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Name</label>
                      <input
                        type="text"
                        value={profileForm.contactName}
                        onChange={(e) => setProfileForm({ ...profileForm, contactName: e.target.value })}
                        placeholder="Your name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        value={profileForm.contactPhone}
                        onChange={(e) => setProfileForm({ ...profileForm, contactPhone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">About Your Venue</label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        placeholder="Describe your venue, capacity, amenities, etc."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <Button onClick={handleProfileUpdate} className="w-full bg-purple-600 hover:bg-purple-700">
                      Create Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
