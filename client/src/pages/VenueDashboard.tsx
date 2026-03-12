import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../_core/hooks/useAuth';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import ProfileCompletenessCard from '../components/ProfileCompletenessCard';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertCircle, CheckCircle, Settings, Calendar, Users, Plus, Edit2, Eye, ClipboardList, X, DollarSign, FileText, Camera, Upload, Loader2, ImageIcon, Trash2, GripVertical, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { MobileBottomNav } from '../components/MobileBottomNav';

export function VenueDashboard() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProfile, setEditingProfile] = useState(false);
  const [viewingRiderBookingId, setViewingRiderBookingId] = useState<number | null>(null);
  const [profileForm, setProfileForm] = useState({
    organizationName: '',
    location: '',
    contactName: '',
    contactPhone: '',
    bio: '',
    venueType: '',
    capacity: '' as string | number,
    email: '',
    amenities: {} as Record<string, boolean>,
    operatingHours: '',
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null);

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
        venueType: (profile as any).venueType || '',
        capacity: (profile as any).capacity || '',
        email: (profile as any).email || '',
        amenities: (profile as any).amenities || {},
        operatingHours: (profile as any).operatingHours || '',
      });
    }
  }, [profile]);

  // Role check — redirect users without proper role to role selection
  useEffect(() => {
    if (!loading && user) {
      if (!user.role || user.role === 'user') {
        window.location.href = '/get-started';
      } else if (user.role === 'fan') {
        navigate('/');
      } else if (user.role === 'artist') {
        navigate('/dashboard');
      }
    }
  }, [user, loading]);

  const validatePhoneNumber = (phone: string) => {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's a valid length (10-15 digits for international)
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  const createProfileMutation = trpc.venue.createProfile.useMutation({
    onSuccess: () => {
      refetchProfile();
      setEditingProfile(false);
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to create profile');
    },
  });

  const updateProfileMutation = trpc.venue.updateProfile.useMutation({
    onSuccess: () => {
      refetchProfile();
      setEditingProfile(false);
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to update profile');
    },
  });

  // Gallery mutations
  const uploadGalleryPhoto = trpc.venue.uploadGalleryPhoto.useMutation();
  const deleteGalleryPhoto = trpc.venue.deleteGalleryPhoto.useMutation();
  const updateGalleryCaption = trpc.venue.updateGalleryCaption.useMutation();

  const uploadPhotoMutation = trpc.venue.uploadProfilePhoto.useMutation({
    onSuccess: () => {
      refetchProfile();
      toast.success('Profile photo updated successfully');
      setUploadingPhoto(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload photo');
      setUploadingPhoto(false);
    },
  });

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be smaller than 5MB');
      return;
    }

    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      uploadPhotoMutation.mutate({
        fileData: base64,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async () => {
    try {
      // Validate phone number
      if (profileForm.contactPhone && !validatePhoneNumber(profileForm.contactPhone)) {
        alert('Please enter a valid phone number (10-15 digits)');
        return;
      }
      if (!profileForm.organizationName.trim()) {
        alert('Organization name is required');
        return;
      }
      const formData = {
        ...profileForm,
        capacity: profileForm.capacity ? Number(profileForm.capacity) : undefined,
        venueType: profileForm.venueType || undefined,
        email: profileForm.email || undefined,
        amenities: Object.keys(profileForm.amenities || {}).length > 0 ? profileForm.amenities : undefined,
        operatingHours: profileForm.operatingHours || undefined,
      };
      if (profile) {
        // Update existing profile
        await updateProfileMutation.mutateAsync(formData);
      } else {
        // Create new profile
        await createProfileMutation.mutateAsync(formData);
      }
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const venueRespondMutation = trpc.booking.venueRespond.useMutation({
    onSuccess: () => {
      refetchBookings();
    },
    onError: (error: any) => {
      alert(error.message || 'Failed to update booking');
    },
  });

  const handleBookingRespond = async (bookingId: number, status: 'confirmed' | 'cancelled') => {
    const action = status === 'confirmed' ? 'accept' : 'decline';
    if (!confirm(`Are you sure you want to ${action} this booking?`)) return;
    await venueRespondMutation.mutateAsync({ id: bookingId, status });
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 px-3 py-4 sm:p-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Venue Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your venue, bookings, and artist connections</p>
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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="artists" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Artists</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Profile</span>
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

            {/* Profile Completeness */}
            {profile && (
              <ProfileCompletenessCard
                profile={profile}
                type="venue"
                onEditProfile={() => {
                  const el = document.getElementById('venue-profile-tab');
                  if (el) el.click();
                }}
              />
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/venue-invoices')}>
                <CardContent className="py-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Invoices</h3>
                    <p className="text-sm text-muted-foreground">View payment history and outstanding balances</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/contracts')}>
                <CardContent className="py-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <ClipboardList className="h-6 w-6 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Contracts</h3>
                    <p className="text-sm text-muted-foreground">View and download signed rider contracts</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/messages')}>
                <CardContent className="py-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">Messages</h3>
                    <p className="text-sm text-muted-foreground">Chat with artists about bookings and riders</p>
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
                      <div className="flex items-center gap-3">
                        {(booking as any).artistPhoto ? (
                          <img
                            src={(booking as any).artistPhoto}
                            alt={(booking as any).artistName}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                            <Users className="h-5 w-5 text-purple-600" />
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{(booking as any).artistName || `Artist #${booking.artistId}`}</CardTitle>
                          <CardDescription>
                            {new Date(booking.eventDate).toLocaleDateString()} at {booking.eventTime || 'TBA'} • <span className={`capitalize ${booking.status === 'confirmed' ? 'text-green-600' : booking.status === 'pending' ? 'text-yellow-600' : booking.status === 'cancelled' ? 'text-red-600' : ''}`}>{booking.status}</span>
                          </CardDescription>
                        </div>
                      </div>
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
                        <div className="flex flex-wrap gap-2 mt-4">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/booking/${booking.id}`)}>
                            View Details
                          </Button>
                          {(booking as any).hasRiderMessage && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-purple-600 border-purple-200 hover:bg-purple-50"
                              onClick={() => setViewingRiderBookingId(booking.id)}
                            >
                              <ClipboardList className="h-4 w-4 mr-1" />
                              View Rider
                            </Button>
                          )}
                          {booking.status === 'pending' && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleBookingRespond(booking.id, 'confirmed')}>
                                Accept
                              </Button>
                              <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleBookingRespond(booking.id, 'cancelled')}>
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
                            onClick={() => navigate(`/booking/create?artistId=${artist.id}`)}
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

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5 text-purple-600" />
                      Venue Gallery
                    </CardTitle>
                    <CardDescription>
                      Showcase your space with up to 20 photos. Artists will see these when considering your venue.
                    </CardDescription>
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors text-sm font-medium">
                    <Upload className="h-4 w-4" />
                    {uploadingGallery ? 'Uploading...' : 'Add Photos'}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={async (e) => {
                        const files = e.target.files;
                        if (!files || files.length === 0) return;
                        setUploadingGallery(true);
                        let successCount = 0;
                        for (const file of Array.from(files)) {
                          if (file.size > 10 * 1024 * 1024) {
                            toast.error(`${file.name} is too large (max 10MB)`);
                            continue;
                          }
                          try {
                            const reader = new FileReader();
                            const fileData = await new Promise<string>((resolve) => {
                              reader.onload = () => resolve(reader.result as string);
                              reader.readAsDataURL(file);
                            });
                            await uploadGalleryPhoto.mutateAsync({
                              fileData,
                              fileName: file.name,
                              mimeType: file.type,
                            });
                            successCount++;
                          } catch (err: any) {
                            toast.error(err?.message || `Failed to upload ${file.name}`);
                          }
                        }
                        if (successCount > 0) {
                          toast.success(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded`);
                          refetchProfile();
                        }
                        setUploadingGallery(false);
                        e.target.value = '';
                      }}
                      className="hidden"
                      disabled={uploadingGallery}
                    />
                  </label>
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                  const photos = (profile?.mediaGallery as any)?.photos || [];
                  if (photos.length === 0) {
                    return (
                      <div className="text-center py-16 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">No photos yet</h3>
                        <p className="text-sm text-gray-500 mb-4">Upload photos of your venue to attract artists</p>
                        <label className="inline-flex items-center gap-2 px-6 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium">
                          <Upload className="h-4 w-4" />
                          Upload Your First Photo
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={async (e) => {
                              const files = e.target.files;
                              if (!files || files.length === 0) return;
                              setUploadingGallery(true);
                              let successCount = 0;
                              for (const file of Array.from(files)) {
                                if (file.size > 10 * 1024 * 1024) {
                                  toast.error(`${file.name} is too large (max 10MB)`);
                                  continue;
                                }
                                try {
                                  const reader = new FileReader();
                                  const fileData = await new Promise<string>((resolve) => {
                                    reader.onload = () => resolve(reader.result as string);
                                    reader.readAsDataURL(file);
                                  });
                                  await uploadGalleryPhoto.mutateAsync({
                                    fileData,
                                    fileName: file.name,
                                    mimeType: file.type,
                                  });
                                  successCount++;
                                } catch (err: any) {
                                  toast.error(err?.message || `Failed to upload ${file.name}`);
                                }
                              }
                              if (successCount > 0) {
                                toast.success(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded`);
                                refetchProfile();
                              }
                              setUploadingGallery(false);
                              e.target.value = '';
                            }}
                            className="hidden"
                            disabled={uploadingGallery}
                          />
                        </label>
                      </div>
                    );
                  }
                  return (
                    <div>
                      <p className="text-sm text-gray-500 mb-4">{photos.length} of 20 photos used</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {photos.map((photo: any) => (
                          <div key={photo.id} className="group relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square">
                            <img
                              src={photo.url}
                              alt={photo.caption || 'Venue photo'}
                              className="w-full h-full object-cover cursor-pointer"
                              onClick={() => setLightboxPhoto(photo)}
                            />
                            {/* Hover overlay with actions */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                              <div className="w-full p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingCaption(photo.id);
                                    setCaptionText(photo.caption || '');
                                  }}
                                  className="p-1.5 bg-white/90 rounded-md hover:bg-white text-gray-700 transition-colors"
                                  title="Edit caption"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingPhotoId(photo.id);
                                  }}
                                  className="p-1.5 bg-red-500/90 rounded-md hover:bg-red-600 text-white transition-colors"
                                  title="Delete photo"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                            {/* Caption display */}
                            {photo.caption && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 group-hover:opacity-0 transition-opacity">
                                <p className="text-white text-xs truncate">{photo.caption}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Caption Edit Modal */}
          {editingCaption && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingCaption(null)}>
              <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-semibold mb-3">Edit Caption</h3>
                <input
                  type="text"
                  value={captionText}
                  onChange={(e) => setCaptionText(e.target.value)}
                  placeholder="Add a caption for this photo..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
                  maxLength={200}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingCaption(null)}>Cancel</Button>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={async () => {
                      try {
                        await updateGalleryCaption.mutateAsync({ photoId: editingCaption, caption: captionText });
                        toast.success('Caption updated');
                        refetchProfile();
                        setEditingCaption(null);
                      } catch (err: any) {
                        toast.error(err?.message || 'Failed to update caption');
                      }
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {deletingPhotoId && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeletingPhotoId(null)}>
              <div className="bg-white dark:bg-gray-900 rounded-xl max-w-sm w-full shadow-xl p-6" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold">Delete Photo</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Are you sure you want to delete this photo? This action cannot be undone.</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setDeletingPhotoId(null)}>Cancel</Button>
                  <Button
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={async () => {
                      try {
                        await deleteGalleryPhoto.mutateAsync({ photoId: deletingPhotoId });
                        toast.success('Photo deleted');
                        refetchProfile();
                        setDeletingPhotoId(null);
                      } catch (err: any) {
                        toast.error(err?.message || 'Failed to delete photo');
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lightbox Modal */}
          {lightboxPhoto && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxPhoto(null)}>
              <button
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 text-white"
              >
                <X className="h-6 w-6" />
              </button>
              <div className="max-w-4xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
                <img
                  src={lightboxPhoto.url}
                  alt={lightboxPhoto.caption || 'Venue photo'}
                  className="w-full h-full object-contain rounded-lg"
                />
                {lightboxPhoto.caption && (
                  <p className="text-white text-center mt-3 text-sm">{lightboxPhoto.caption}</p>
                )}
              </div>
            </div>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4" id="venue-profile-section">
            {editingProfile ? (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Venue Profile</CardTitle>
                  <CardDescription>Update your venue information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Profile Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="relative group">
                          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                            {profile?.profilePhotoUrl ? (
                              <img src={profile.profilePhotoUrl} alt="Venue" className="w-full h-full object-cover" />
                            ) : (
                              <Camera className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            {uploadingPhoto ? (
                              <Loader2 className="h-6 w-6 text-white animate-spin" />
                            ) : (
                              <Camera className="h-6 w-6 text-white" />
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                              disabled={uploadingPhoto}
                            />
                          </label>
                        </div>
                        <div className="flex-1">
                          <label className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium">
                            <Upload className="h-4 w-4" />
                            {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                              disabled={uploadingPhoto}
                            />
                          </label>
                          <p className="text-xs text-gray-500 mt-1">JPG, PNG or WebP. Max 5MB.</p>
                        </div>
                      </div>
                    </div>

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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Venue Type</label>
                        <select
                          value={profileForm.venueType}
                          onChange={(e) => setProfileForm({ ...profileForm, venueType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                          <option value="">Select venue type...</option>
                          <option value="Concert Hall">Concert Hall</option>
                          <option value="Nightclub">Nightclub</option>
                          <option value="Bar / Lounge">Bar / Lounge</option>
                          <option value="Restaurant">Restaurant</option>
                          <option value="Theater">Theater</option>
                          <option value="Outdoor Amphitheater">Outdoor Amphitheater</option>
                          <option value="Arena / Stadium">Arena / Stadium</option>
                          <option value="Rooftop">Rooftop</option>
                          <option value="Event Space">Event Space</option>
                          <option value="Banquet Hall">Banquet Hall</option>
                          <option value="Community Center">Community Center</option>
                          <option value="Hotel Ballroom">Hotel Ballroom</option>
                          <option value="Private Estate">Private Estate</option>
                          <option value="Warehouse">Warehouse</option>
                          <option value="Church / Place of Worship">Church / Place of Worship</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Capacity</label>
                        <input
                          type="number"
                          min="1"
                          value={profileForm.capacity}
                          onChange={(e) => setProfileForm({ ...profileForm, capacity: e.target.value })}
                          placeholder="e.g. 500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">About</label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows={4}
                        placeholder="Describe your venue in at least 50 characters..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {profileForm.bio && profileForm.bio.length < 50 && (
                        <p className="text-xs text-amber-600 mt-1">{50 - profileForm.bio.length} more characters needed for profile completeness</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="booking@yourvenue.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Operating Hours</label>
                      <input
                        type="text"
                        value={profileForm.operatingHours}
                        onChange={(e) => setProfileForm({ ...profileForm, operatingHours: e.target.value })}
                        placeholder="e.g. Mon-Fri 6PM-2AM, Sat-Sun 4PM-2AM"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Amenities</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['Stage', 'Sound System', 'Lighting', 'Parking', 'Green Room', 'Wi-Fi', 'Bar', 'Kitchen', 'Outdoor Space', 'Wheelchair Accessible', 'Dressing Room', 'Loading Dock'].map((amenity) => (
                          <label key={amenity} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!(profileForm.amenities && (profileForm.amenities as Record<string, boolean>)[amenity])}
                              onChange={(e) => {
                                const updated = { ...(profileForm.amenities || {}) } as Record<string, boolean>;
                                if (e.target.checked) {
                                  updated[amenity] = true;
                                } else {
                                  delete updated[amenity];
                                }
                                setProfileForm({ ...profileForm, amenities: updated });
                              }}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            {amenity}
                          </label>
                        ))}
                      </div>
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
                    {/* Profile Photo */}
                    <div className="flex items-center gap-4">
                      <div className="relative group">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                          {profile.profilePhotoUrl ? (
                            <img src={profile.profilePhotoUrl} alt="Venue" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                          {uploadingPhoto ? (
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                          ) : (
                            <Camera className="h-5 w-5 text-white" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            disabled={uploadingPhoto}
                          />
                        </label>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{profile.organizationName}</p>
                        <label className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 cursor-pointer hover:text-purple-800 dark:hover:text-purple-300 mt-1">
                          <Camera className="h-3 w-3" />
                          {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            disabled={uploadingPhoto}
                          />
                        </label>
                      </div>
                    </div>

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
                    {/* Profile Photo Upload */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">You can add a photo after creating your profile.</p>
                        </div>
                      </div>
                    </div>

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
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Venue Type</label>
                        <select
                          value={profileForm.venueType}
                          onChange={(e) => setProfileForm({ ...profileForm, venueType: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                        >
                          <option value="">Select venue type...</option>
                          <option value="Concert Hall">Concert Hall</option>
                          <option value="Nightclub">Nightclub</option>
                          <option value="Bar / Lounge">Bar / Lounge</option>
                          <option value="Restaurant">Restaurant</option>
                          <option value="Theater">Theater</option>
                          <option value="Outdoor Amphitheater">Outdoor Amphitheater</option>
                          <option value="Arena / Stadium">Arena / Stadium</option>
                          <option value="Rooftop">Rooftop</option>
                          <option value="Event Space">Event Space</option>
                          <option value="Banquet Hall">Banquet Hall</option>
                          <option value="Community Center">Community Center</option>
                          <option value="Hotel Ballroom">Hotel Ballroom</option>
                          <option value="Private Estate">Private Estate</option>
                          <option value="Warehouse">Warehouse</option>
                          <option value="Church / Place of Worship">Church / Place of Worship</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Capacity</label>
                        <input
                          type="number"
                          min="1"
                          value={profileForm.capacity}
                          onChange={(e) => setProfileForm({ ...profileForm, capacity: e.target.value })}
                          placeholder="e.g. 500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">About Your Venue</label>
                      <textarea
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        placeholder="Describe your venue in at least 50 characters..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      {profileForm.bio && profileForm.bio.length < 50 && (
                        <p className="text-xs text-amber-600 mt-1">{50 - profileForm.bio.length} more characters needed for profile completeness</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Email</label>
                      <input
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        placeholder="booking@yourvenue.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Operating Hours</label>
                      <input
                        type="text"
                        value={profileForm.operatingHours}
                        onChange={(e) => setProfileForm({ ...profileForm, operatingHours: e.target.value })}
                        placeholder="e.g. Mon-Fri 6PM-2AM, Sat-Sun 4PM-2AM"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Amenities</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {['Stage', 'Sound System', 'Lighting', 'Parking', 'Green Room', 'Wi-Fi', 'Bar', 'Kitchen', 'Outdoor Space', 'Wheelchair Accessible', 'Dressing Room', 'Loading Dock'].map((amenity) => (
                          <label key={amenity} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!(profileForm.amenities && (profileForm.amenities as Record<string, boolean>)[amenity])}
                              onChange={(e) => {
                                const updated = { ...(profileForm.amenities || {}) } as Record<string, boolean>;
                                if (e.target.checked) {
                                  updated[amenity] = true;
                                } else {
                                  delete updated[amenity];
                                }
                                setProfileForm({ ...profileForm, amenities: updated });
                              }}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            {amenity}
                          </label>
                        ))}
                      </div>
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav mode="venue-dashboard" />

      {/* Rider Viewer Modal */}
      {viewingRiderBookingId && (
        <RiderViewerModal
          bookingId={viewingRiderBookingId}
          onClose={() => setViewingRiderBookingId(null)}
        />
      )}
    </div>
  );
}

/** Inline modal component that fetches rider messages for a booking and displays the rider details */
function RiderViewerModal({ bookingId, onClose }: { bookingId: number; onClose: () => void }) {
  const { data: messages, isLoading } = trpc.message.getForBooking.useQuery({ bookingId });

  // Find the rider message
  const riderMessage = messages?.find((m: any) => m.messageType === 'rider');
  let riderData: any = null;
  let riderName = 'Rider';

  if (riderMessage) {
    const parsed = typeof riderMessage.metadata === 'string'
      ? JSON.parse(riderMessage.metadata)
      : riderMessage.metadata;
    riderName = parsed?.riderTemplateName || 'Rider';
    const rd = parsed?.riderTemplateData || {};
    riderData = rd.formData || rd;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold">{riderName}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <p>Loading rider details...</p>
            </div>
          ) : !riderData ? (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p>No rider details found for this booking.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Technical Requirements */}
              {(riderData.stage_size_min || riderData.sound_system || riderData.lighting) && (
                <div>
                  <h4 className="text-sm font-semibold text-purple-600 mb-2">Technical Requirements</h4>
                  <div className="space-y-1.5 text-sm">
                    {riderData.stage_size_min && <div><span className="font-medium">Stage Size:</span> {riderData.stage_size_min}</div>}
                    {riderData.stage_surface && <div><span className="font-medium">Stage Surface:</span> {riderData.stage_surface}</div>}
                    {riderData.sound_system && <div><span className="font-medium">Sound System:</span> {riderData.sound_system}</div>}
                    {riderData.monitors && <div><span className="font-medium">Monitors:</span> {riderData.monitors}</div>}
                    {riderData.microphones && <div><span className="font-medium">Microphones:</span> {riderData.microphones}</div>}
                    {riderData.di_boxes && <div><span className="font-medium">DI Boxes:</span> {riderData.di_boxes}</div>}
                    {riderData.lighting && <div><span className="font-medium">Lighting:</span> {riderData.lighting}</div>}
                    {riderData.power_outlets && <div><span className="font-medium">Power Outlets:</span> {riderData.power_outlets}</div>}
                  </div>
                </div>
              )}
              {/* Performance Details */}
              {(riderData.performance_duration || riderData.soundcheck_duration || riderData.load_in_time) && (
                <div>
                  <h4 className="text-sm font-semibold text-purple-600 mb-2">Performance Details</h4>
                  <div className="space-y-1.5 text-sm">
                    {riderData.performance_duration && <div><span className="font-medium">Performance Duration:</span> {riderData.performance_duration} min</div>}
                    {riderData.num_sets && <div><span className="font-medium">Number of Sets:</span> {riderData.num_sets}</div>}
                    {riderData.set_break_duration && <div><span className="font-medium">Break Duration:</span> {riderData.set_break_duration} min</div>}
                    {riderData.soundcheck_duration && <div><span className="font-medium">Soundcheck:</span> {riderData.soundcheck_duration} min</div>}
                    {riderData.load_in_time && <div><span className="font-medium">Load-in Time:</span> {riderData.load_in_time} hrs before</div>}
                  </div>
                </div>
              )}
              {/* Hospitality Requirements */}
              {(riderData.green_room || riderData.meals || riderData.beverages || riderData.parking) && (
                <div>
                  <h4 className="text-sm font-semibold text-purple-600 mb-2">Hospitality Requirements</h4>
                  <div className="space-y-1.5 text-sm">
                    {riderData.green_room && <div><span className="font-medium">Green Room:</span> {riderData.green_room}</div>}
                    {riderData.meals && <div><span className="font-medium">Meals:</span> {riderData.meals}</div>}
                    {riderData.beverages && <div><span className="font-medium">Beverages:</span> {riderData.beverages}</div>}
                    {riderData.towels && <div><span className="font-medium">Towels:</span> Yes</div>}
                    {riderData.wifi_required && <div><span className="font-medium">WiFi:</span> Required</div>}
                    {riderData.parking && <div><span className="font-medium">Parking:</span> {riderData.parking}</div>}
                  </div>
                </div>
              )}
              {/* Financial Terms */}
              {(riderData.deposit_percentage || riderData.payment_method || riderData.cancellation_policy) && (
                <div>
                  <h4 className="text-sm font-semibold text-purple-600 mb-2">Financial Terms</h4>
                  <div className="space-y-1.5 text-sm">
                    {riderData.deposit_percentage && <div><span className="font-medium">Deposit:</span> {riderData.deposit_percentage}</div>}
                    {riderData.deposit_due_date && <div><span className="font-medium">Deposit Due:</span> {riderData.deposit_due_date}</div>}
                    {riderData.balance_due_date && <div><span className="font-medium">Balance Due:</span> {riderData.balance_due_date}</div>}
                    {riderData.payment_method && <div><span className="font-medium">Payment Method:</span> {riderData.payment_method}</div>}
                    {riderData.cancellation_policy && <div><span className="font-medium">Cancellation Policy:</span> {riderData.cancellation_policy}</div>}
                  </div>
                </div>
              )}
              {/* Policies */}
              {(riderData.recording_policy || riderData.merch_sales) && (
                <div>
                  <h4 className="text-sm font-semibold text-purple-600 mb-2">Policies</h4>
                  <div className="space-y-1.5 text-sm">
                    {riderData.recording_policy && <div><span className="font-medium">Recording:</span> {riderData.recording_policy}</div>}
                    {riderData.merch_sales && <div><span className="font-medium">Merch Sales:</span> {riderData.merch_sales}</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
