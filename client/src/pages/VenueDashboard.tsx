import { toSlug } from '@/lib/slugify';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../_core/hooks/useAuth';
import { trpc } from '../lib/trpc';
import SiteHeader from '../components/SiteHeader';
import { formatEventTime } from '../lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import ProfileCompletenessCard from '../components/ProfileCompletenessCard';
import { Button } from '../components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { AlertCircle, CheckCircle, Settings, Calendar, CalendarDays as CalendarIcon, Users, Plus, Edit2, Eye, ClipboardList, X, DollarSign, FileText, Camera, Upload, Loader2, ImageIcon, Trash2, GripVertical, Pencil, ExternalLink, Heart, Megaphone, BarChart3, ShoppingBag, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import { MobileBottomNav } from '../components/MobileBottomNav';
import { Skeleton } from '../components/ui/skeleton';
import ImageCropper from '../components/ImageCropper';
import { VenueContractsDashboard } from '../components/VenueContractsDashboard';
import VenueCalendar from '../components/VenueCalendar';
import { VenueCalendarSync } from '../components/VenueCalendarSync';
import VenueAnalytics from '../components/VenueAnalytics';
import ArtistFilters, { ArtistFilterValues } from '../components/ArtistFilters';
import SettlementForm from '../components/SettlementForm';
import SaveArtistButton from '../components/SaveArtistButton';
import DashboardAnalyticsCards from '../components/DashboardAnalyticsCards';
import VenueSponsorManagement from '../components/VenueSponsorManagement';
import BookingFunnel from '../components/BookingFunnel';
import { LocationInput } from '../components/LocationInput';
import { OperatingHoursEditor } from '../components/OperatingHoursEditor';

export function VenueDashboard() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProfile, setEditingProfile] = useState(false);
  const [viewingRiderBookingId, setViewingRiderBookingId] = useState<number | null>(null);
  const [profileForm, setProfileForm] = useState({
    organizationName: '',
    location: '',
    city: '',
    state: '',
    country: 'US',
    contactName: '',
    contactPhone: '',
    bio: '',
    venueType: '',
    capacity: '' as string | number,
    email: '',
    amenities: {} as Record<string, boolean>,
    operatingHours: null as any,
  });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<any>(null);

  // Fetch venue profile
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = trpc.venue.getMyProfile.useQuery(
    undefined,
    { enabled: !!user && (user.role === 'venue' || user.role === 'admin'), staleTime: 120_000 }
  );

  // Fetch venue bookings
  const { data: bookings, isLoading: bookingsLoading, refetch: refetchBookings } = trpc.booking.getMyVenueBookings.useQuery(
    undefined,
    { enabled: !!user && (user.role === 'venue' || user.role === 'admin'), staleTime: 60_000 }
  );

  // Fetch venue review rating
  const { data: venueRating } = trpc.venueReview.getAverageRating.useQuery(
    { venueId: profile?.id || 0 },
    { enabled: !!profile?.id, staleTime: 5 * 60 * 1000 }
  );

  // Fetch artists for discovery — only load when Artists tab is active
  const [artistFilters, setArtistFilters] = useState<ArtistFilterValues>({ searchQuery: '', genre: [], location: '' });
  const hasFilters = artistFilters.genre.length > 0 || artistFilters.location || artistFilters.minFee || artistFilters.maxFee || artistFilters.availableDate;
  const { data: allArtists, isLoading: artistsLoading } = trpc.artist.search.useQuery(
    {
      genre: artistFilters.genre.length > 0 ? artistFilters.genre : undefined,
      location: artistFilters.location || undefined,
      minFee: artistFilters.minFee,
      maxFee: artistFilters.maxFee,
      availableDate: artistFilters.availableDate,
    },
    { enabled: !!user && (user.role === 'venue' || user.role === 'admin') && activeTab === 'artists', staleTime: 300_000 }
  );
  // Apply client-side name search on top of server-side filters
  const artists = allArtists?.filter(a => {
    if (!artistFilters.searchQuery) return true;
    const q = artistFilters.searchQuery.toLowerCase();
    return (
      a.artistName?.toLowerCase().includes(q) ||
      (Array.isArray(a.genre) && a.genre.some((g: string) => g?.toLowerCase().includes(q))) ||
      a.location?.toLowerCase().includes(q)
    );
  });

  // Update profile form when profile data loads
  useEffect(() => {
    if (profile) {
      setProfileForm({
        organizationName: profile.organizationName || '',
        location: profile.location || '',
        city: (profile as any).city || '',
        state: (profile as any).state || '',
        country: (profile as any).country || 'US',
        contactName: profile.contactName || '',
        contactPhone: profile.contactPhone || '',
        bio: profile.bio || '',
        venueType: (profile as any).venueType || '',
        capacity: (profile as any).capacity || '',
        email: (profile as any).email || '',
        amenities: (profile as any).amenities || {},
        operatingHours: (profile as any).operatingHours || null,
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
      toast.success('Profile created successfully!');
    },
    onError: (error: any) => {
      if (error.message?.includes('already exists')) {
        toast.info('Profile already exists — switching to edit mode...');
        refetchProfile();
        setEditingProfile(true);
      } else {
        toast.error(error.message || 'Failed to create profile');
      }
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Open cropper instead of uploading directly
    const reader = new FileReader();
    reader.onloadend = () => {
      setCropperImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleCropComplete = (croppedBlob: Blob) => {
    setShowCropper(false);
    setCropperImage(null);
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      uploadPhotoMutation.mutate({
        fileData: base64,
        fileName: 'venue-profile-photo.jpg',
        mimeType: 'image/jpeg',
      });
    };
    reader.readAsDataURL(croppedBlob);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setCropperImage(null);
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
      // Build display location from structured fields
      const locationDisplay = [profileForm.city, profileForm.state].filter(Boolean).join(', ') || profileForm.location;
      const formData = {
        ...profileForm,
        location: locationDisplay,
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
    navigate(`/artist/${toSlug(artistName || '')}`);
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          {/* Completeness card skeleton */}
          <Skeleton className="h-24 w-full rounded-lg" />
          {/* Tabs skeleton */}
          <div className="flex gap-2">
            {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-24 rounded-md" />)}
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
    <>
    <SiteHeader />
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 px-3 py-4 sm:p-6 transition-colors duration-200">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center gap-4">
          {((user as any)?.customAvatarUrl || (user as any)?.avatarUrl) ? (
            <img src={(user as any).customAvatarUrl || (user as any).avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
          ) : null}
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">Venue Dashboard</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage your venue, bookings, and artist connections</p>
          </div>
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
          <TabsList className="grid w-full grid-cols-6 h-auto">
            <TabsTrigger value="overview" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="bookings" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Bookings</span>
            </TabsTrigger>
            <TabsTrigger value="artists" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Artists</span>
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Saved</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Megaphone className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">My Events</span>
            </TabsTrigger>
            <TabsTrigger value="gallery" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <ImageIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Gallery</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Handshake className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Sponsors</span>
            </TabsTrigger>
            <TabsTrigger value="profile" id="venue-profile-tab" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-1 sm:px-3 py-2">
              <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Analytics Summary Cards */}
            <DashboardAnalyticsCards
              monthlyBookings={(() => {
                const now = new Date();
                return bookings?.filter(b => {
                  const created = new Date(b.createdAt || b.eventDate);
                  return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
                }).length || 0;
              })()}
              totalEarnings={(() => {
                return bookings?.filter(b => b.status === 'completed' || b.status === 'confirmed')
                  .reduce((sum, b) => sum + (Number(b.totalFee) || 0), 0) || 0;
              })()}
              averageRating={typeof venueRating === 'number' ? venueRating : (venueRating as any)?.averageRating || 0}
              reviewCount={(venueRating as any)?.reviewCount || 0}
              previousMonthBookings={(() => {
                const now = new Date();
                const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                return bookings?.filter(b => {
                  const created = new Date(b.createdAt || b.eventDate);
                  return created.getFullYear() === lastMonth.getFullYear() && created.getMonth() === lastMonth.getMonth();
                }).length || 0;
              })()}
            />

            {/* Profile Completeness */}
            {profile && (
              <ProfileCompletenessCard
                profile={profile}
                type="venue"
                onEditProfile={() => {
                  setActiveTab('profile');
                  setEditingProfile(true);
                }}
              />
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>Track deposits, final payments, and download receipts</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>Review artist requirements and sign booking agreements</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>Discuss event details, logistics, and rider needs with artists</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/merch')}>
                    <CardContent className="py-5 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-6 w-6 text-pink-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">Shop & Offers</h3>
                        <p className="text-sm text-muted-foreground">Branded items, gift cards, and VIP packages</p>
                      </div>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent>Showcase your branded merchandise and special offers on your profile</TooltipContent>
              </Tooltip>
            </div>

            {/* Venue Contracts Status Tracker */}
            <VenueContractsDashboard />

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

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="space-y-4">
            {bookingsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[400px] w-full rounded-lg" />
              </div>
            ) : (
              <VenueCalendar
                bookings={bookings || []}
                onBookingClick={(booking) => {
                  navigate(`/booking/${booking.id}`);
                }}
                onCreateBooking={(startDate, endDate) => {
                  const params = new URLSearchParams({ date: startDate });
                  if (endDate) params.set('endDate', endDate);
                  navigate(`/booking/create?${params.toString()}`);
                }}
                onPostEvent={(booking) => {
                  const params = new URLSearchParams({
                    bookingId: booking.id.toString(),
                    artistId: (booking as any).artistId?.toString() || '',
                    artistName: booking.artistName || '',
                    date: typeof booking.eventDate === 'string' ? booking.eventDate : new Date(booking.eventDate).toISOString().split('T')[0],
                    time: booking.eventTime || '',
                  });
                  navigate(`/venue/events/create?${params.toString()}`);
                }}
              />
            )}
            <div className="mt-6">
              <VenueCalendarSync />
            </div>
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            {bookingsLoading ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-40" />
                          <Skeleton className="h-4 w-56" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <div className="flex gap-2 mt-4">
                          <Skeleton className="h-8 w-24 rounded-md" />
                          <Skeleton className="h-8 w-24 rounded-md" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                            {new Date(booking.eventDate).toLocaleDateString()} at {booking.eventTime ? formatEventTime(booking.eventTime) : 'TBA'} • <span className={`capitalize ${booking.status === 'confirmed' ? 'text-green-600' : booking.status === 'pending' ? 'text-yellow-600' : booking.status === 'cancelled' ? 'text-red-600' : ''}`}>{booking.status}</span>
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
            <ArtistFilters onFilterChange={setArtistFilters} isLoading={artistsLoading} />
            {artistsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => (
                  <Card key={i}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <div className="flex gap-2 mt-2">
                            <Skeleton className="h-8 w-20 rounded-md" />
                            <Skeleton className="h-8 w-20 rounded-md" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : artists && artists.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artists.map(artist => {
                  if (!artist) return null;
                  return (
                  <Card key={artist.id}>
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-900/30 flex-shrink-0 flex items-center justify-center">
                          {artist.profilePhotoUrl ? (
                            <img src={artist.profilePhotoUrl} alt={artist.artistName || 'Artist'} className="h-full w-full object-cover" />
                          ) : (
                            <Users className="h-6 w-6 text-purple-400" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{artist.artistName || 'Artist'}</CardTitle>
                          <CardDescription>
                            {Array.isArray(artist.genre) ? [...new Set(artist.genre)].join(', ') : (artist.genre || 'Genre not specified')} • {artist.location || 'Location not specified'}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {artist.bio && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{artist.bio}</p>
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
                          <SaveArtistButton artistId={artist.id} />
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

          {/* Saved Artists Tab */}
          <TabsContent value="saved" className="space-y-4">
            <SavedArtistsTab navigate={navigate} />
          </TabsContent>

          {/* My Events Tab */}
          <TabsContent value="events" className="space-y-4">
            <MyEventsTab venueProfileId={profile?.id} />
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
                  <label className={`inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors text-sm font-medium ${uploadingGallery ? 'opacity-80 pointer-events-none' : ''}`}>
                    {uploadingGallery ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="h-4 w-4" /> Add Photos</>
                    )}
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
                        <label className={`inline-flex items-center gap-2 px-6 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium ${uploadingGallery ? 'opacity-60 pointer-events-none' : ''}`}>
                          {uploadingGallery ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                          ) : (
                            <><Upload className="h-4 w-4" /> Upload Your First Photo</>
                          )}
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <VenueAnalytics venueId={profile?.id || 0} bookings={bookings || []} />
            <BookingFunnel venueId={profile?.id || 0} />
          </TabsContent>

          {/* Sponsors Tab */}
          <TabsContent value="sponsors" className="space-y-4">
            <VenueSponsorManagement />
          </TabsContent>

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
                              <img src={profile.profilePhotoUrl} alt="Venue" className={`w-full h-full object-cover transition-opacity ${uploadingPhoto ? 'opacity-40' : ''}`} />
                            ) : (
                              <Camera className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          {uploadingPhoto ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full">
                              <Loader2 className="h-6 w-6 text-white animate-spin" />
                              <span className="text-[10px] text-white font-medium mt-1">Uploading</span>
                            </div>
                          ) : (
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                              <Camera className="h-6 w-6 text-white" />
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoSelect}
                                className="hidden"
                              />
                            </label>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className={`inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium ${uploadingPhoto ? 'opacity-60 pointer-events-none' : ''}`}>
                            {uploadingPhoto ? (
                              <><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</>
                            ) : (
                              <><Upload className="h-4 w-4" /> Upload Photo</>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoSelect}
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
                      <LocationInput
                        city={profileForm.city}
                        state={profileForm.state}
                        country={profileForm.country}
                        onChange={({ city, state, country }) => setProfileForm({ ...profileForm, city, state, country })}
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
                          <option value="Arena / Stadium">Arena / Stadium</option>
                          <option value="Banquet Hall">Banquet Hall</option>
                          <option value="Bar / Lounge">Bar / Lounge</option>
                          <option value="Church / Place of Worship">Church / Place of Worship</option>
                          <option value="Community Center">Community Center</option>
                          <option value="Concert Hall">Concert Hall</option>
                          <option value="Event Space">Event Space</option>
                          <option value="Hotel Ballroom">Hotel Ballroom</option>
                          <option value="Nightclub">Nightclub</option>
                          <option value="Outdoor Amphitheater">Outdoor Amphitheater</option>
                          <option value="Private Estate">Private Estate</option>
                          <option value="Restaurant">Restaurant</option>
                          <option value="Rooftop">Rooftop</option>
                          <option value="Theater">Theater</option>
                          <option value="Warehouse">Warehouse</option>
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
                      <OperatingHoursEditor
                        value={profileForm.operatingHours}
                        onChange={(schedule) => setProfileForm({ ...profileForm, operatingHours: schedule })}
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
                      <Button
                        variant="outline"
                        className="flex items-center gap-2"
                        onClick={() => window.open(`/venue/${(profile as any)?.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Preview
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
                            <img src={profile.profilePhotoUrl} alt="Venue" className={`w-full h-full object-cover transition-opacity ${uploadingPhoto ? 'opacity-40' : ''}`} />
                          ) : (
                            <Camera className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        {uploadingPhoto ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full">
                            <Loader2 className="h-5 w-5 text-white animate-spin" />
                            <span className="text-[9px] text-white font-medium mt-0.5">Uploading</span>
                          </div>
                        ) : (
                          <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                            <Camera className="h-5 w-5 text-white" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoSelect}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{profile.organizationName}</p>
                        <label className={`inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 cursor-pointer hover:text-purple-800 dark:hover:text-purple-300 mt-1 ${uploadingPhoto ? 'opacity-60 pointer-events-none' : ''}`}>
                          {uploadingPhoto ? (
                            <><Loader2 className="h-3 w-3 animate-spin" /> Uploading...</>
                          ) : (
                            <><Camera className="h-3 w-3" /> Change Photo</>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoSelect}
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
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={() => setEditingProfile(true)}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                      >
                        <Edit2 className="h-4 w-4" />
                        Edit Profile
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={() => window.open(`/venue/${(profile as any)?.id}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Preview Public Profile
                      </Button>
                    </div>
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
                      <LocationInput
                        city={profileForm.city}
                        state={profileForm.state}
                        country={profileForm.country}
                        onChange={({ city, state, country }) => setProfileForm({ ...profileForm, city, state, country })}
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
                          <option value="Arena / Stadium">Arena / Stadium</option>
                          <option value="Banquet Hall">Banquet Hall</option>
                          <option value="Bar / Lounge">Bar / Lounge</option>
                          <option value="Church / Place of Worship">Church / Place of Worship</option>
                          <option value="Community Center">Community Center</option>
                          <option value="Concert Hall">Concert Hall</option>
                          <option value="Event Space">Event Space</option>
                          <option value="Hotel Ballroom">Hotel Ballroom</option>
                          <option value="Nightclub">Nightclub</option>
                          <option value="Outdoor Amphitheater">Outdoor Amphitheater</option>
                          <option value="Private Estate">Private Estate</option>
                          <option value="Restaurant">Restaurant</option>
                          <option value="Rooftop">Rooftop</option>
                          <option value="Theater">Theater</option>
                          <option value="Warehouse">Warehouse</option>
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
                      <OperatingHoursEditor
                        value={profileForm.operatingHours}
                        onChange={(schedule) => setProfileForm({ ...profileForm, operatingHours: schedule })}
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

      {/* Image Cropper Modal */}
      {showCropper && cropperImage && (
        <ImageCropper
          imageSrc={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
          cropShape="round"
        />
      )}
    </div>
    </>
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
            <div className="space-y-4 py-4">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/3 mt-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
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


// Saved Artists Tab Component
function SavedArtistsTab({ navigate }: { navigate: (path: string) => void }) {
  const { data: savedArtists, isLoading } = trpc.booking.getSavedArtists.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-24 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  if (!savedArtists || savedArtists.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Saved or Followed Artists Yet</h3>
          <p className="text-gray-500 mb-4">Browse artists and tap the heart icon to save them, or follow artists from their profiles.</p>
          <Button
            variant="outline"
            onClick={() => navigate('/browse')}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Browse Artists
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500 fill-current" />
          Saved & Followed Artists ({savedArtists.length})
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {savedArtists.map((item: any) => {
          const artist = item.artist;
          if (!artist) return null;
          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {artist.profilePhotoUrl ? (
                    <img
                      src={artist.profilePhotoUrl}
                      alt={artist.artistName}
                      className="w-14 h-14 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <Users className="h-6 w-6 text-purple-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{artist.artistName}</h4>
                    <p className="text-sm text-gray-500 truncate">{Array.isArray(artist.genre) ? [...new Set(artist.genre)].join(', ') : (artist.genre || 'No genre')}</p>
                    <p className="text-sm text-gray-400 truncate">{artist.location || 'No location'}</p>
                    {item.source === 'followed' && (
                      <span className="inline-block text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 rounded mt-1">Following</span>
                    )}
                    {artist.minimumFee && (
                      <p className="text-sm font-medium text-green-600 mt-1">${artist.minimumFee}+</p>
                    )}
                  </div>
                  <SaveArtistButton artistId={artist.id} size="icon" />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => navigate(`/artist/${toSlug(artist.artistName || '')}`)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 text-xs bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate(`/booking/create?artistId=${artist.id}`)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Book
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


function MyEventsTab({ venueProfileId }: { venueProfileId?: number }) {
  const [, navigate] = useLocation();
  const { data: events, isLoading } = trpc.events.getVenueEvents.useQuery(
    {},
    { enabled: !!venueProfileId }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Events Posted Yet</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Post events from your confirmed bookings to promote shows and sell tickets directly to fans.
          </p>
          <Button onClick={() => navigate('/venue/events/create')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Your Events ({events.length})</h3>
        <Button onClick={() => navigate('/venue/events/create')} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      </div>
      {events.map((event: any) => (
        <Card key={event.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{event.title}</h4>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </span>
                  {event.eventTime && (
                    <span>{formatEventTime(event.eventTime)}</span>
                  )}
                  {event.ticketPrice && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      {event.ticketPrice}
                    </span>
                  )}
                </div>
                {event.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{event.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  event.status === 'published' ? 'bg-green-100 text-green-700' :
                  event.status === 'draft' ? 'bg-gray-100 text-gray-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {event.status || 'published'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
