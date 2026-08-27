import { toSlug } from '@/lib/slugify';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, MessageSquare, Music, Settings, Star, Clock, DollarSign, Heart, Users, Lock, Download, Crown, Camera, FileText, Pencil, Trash2, MapPin, ExternalLink, Ticket, ShoppingBag, Disc3, Megaphone, Video } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { formatEventTime } from '@/lib/utils';
import { formatDateOnly } from '@shared/dateOnly';
import { AccountSettings } from '@/components/AccountSettings';
import { EventStatusManager } from '@/components/EventStatusManager';
import { FansSection } from '@/components/FansSection';
import { SubscriptionManagement } from '@/components/SubscriptionManagement';
import { SponsorManagement } from '@/components/SponsorManagement';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { CalendarSync } from '@/components/CalendarSync';
import { GoogleCalendarSync } from '@/components/GoogleCalendarSync';
import ProfileCompletenessCard from '@/components/ProfileCompletenessCard';
import { PerformanceVideoUpload } from '@/components/PerformanceVideoUpload';
import { VideoPortfolioManager } from '@/components/VideoPortfolioManager';
import { ReferralSection } from '@/components/ReferralSection';
import BookingCalendar from '@/components/BookingCalendar';
import DashboardAnalyticsCards from '@/components/DashboardAnalyticsCards';
import { SiteHeader } from "@/components/SiteHeader";

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
  const { data: myEvents = [], refetch: refetchEvents } = trpc.events.getMyEvents.useQuery({}, {
    enabled: isArtist,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  const { data: bookingStats } = trpc.profileAnalytics.getBookingStats.useQuery(undefined, {
    enabled: isArtist,
    staleTime: 5 * 60 * 1000,
  });
  const { data: revenueData } = trpc.profileAnalytics.getRevenueByMonth.useQuery({ months: 2 }, {
    enabled: isArtist,
    staleTime: 5 * 60 * 1000,
  });
  const { data: avgRating } = trpc.artistReview.getAverageRating.useQuery(
    { artistId: artistProfile?.id || 0 },
    { enabled: isArtist && !!artistProfile?.id, staleTime: 5 * 60 * 1000 }
  );
  const { data: promoRequests } = trpc.promote.getMyRequests.useQuery(undefined, {
    enabled: isArtist, staleTime: 2 * 60 * 1000,
  });
  const activePromoRequest = promoRequests?.find((r: any) => r.status === 'submitted' || r.status === 'in_review' || r.status === 'in_progress');
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [editingPromo, setEditingPromo] = useState(false);
  const [editBudget, setEditBudget] = useState('');
  const [editGoals, setEditGoals] = useState('');
  const editPromoMutation = trpc.promote.editBoostRequest.useMutation({
    onSuccess: () => {
      setEditingPromo(false);
      setShowPromoModal(false);
    },
  });

  const { data: projectStats } = trpc.projectPreviews.getMyStats.useQuery(undefined, {
    enabled: isArtist, staleTime: 5 * 60 * 1000,
  });
  const deleteEventMutation = trpc.events.deleteArtistPost.useMutation({
    onSuccess: () => { refetchEvents(); },
  });
  const [deletingEventId, setDeletingEventId] = useState<number | null>(null);
  // Messages are accessed from the Messages page, not dashboard

  // Verify user is an artist — show skeleton while redirect happens
  if (!isArtist) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <SiteHeader />
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

  // Check if profile is complete - only require artistName (athletes don't need genre)
  if (!artistProfile || !artistProfile.artistName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>You need to complete your profile before accessing the dashboard.</CardDescription>
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
            {((user as any)?.customAvatarUrl || (user as any)?.avatarUrl) ? (
              <img src={(user as any).customAvatarUrl || (user as any).avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
            ) : artistProfile?.profilePhotoUrl ? (
              <img src={artistProfile.profilePhotoUrl} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
            ) : null}
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
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-center gap-4 min-w-0">
                    {artistProfile?.profilePhotoUrl && (
                      <img
                        src={artistProfile.profilePhotoUrl}
                        alt={artistProfile.artistName || 'Artist'}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-xl sm:text-2xl break-words">{artistProfile?.artistName || 'Artist'}</CardTitle>
                      <CardDescription className="break-words">{artistProfile?.genre ? [...new Set(artistProfile.genre)].join(', ') : 'Genre not specified'}</CardDescription>
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
                    className="gap-2 flex-shrink-0 self-start"
                  >
                    <Settings className="h-4 w-4" />
                    Edit Profile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => navigate(`/artist/${toSlug(artistProfile?.artistName || '')}`)}
                    className="flex-1"
                  >
                    View Public Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Profile Completeness */}
            {artistProfile && (
              <ProfileCompletenessCard
                profile={artistProfile}
                type="artist"
                onEditProfile={() => navigate('/onboarding/artist')}
              />
            )}

            {/* Analytics Summary Cards */}
            {bookingStats && (
              <DashboardAnalyticsCards
                monthlyBookings={(() => {
                  const now = new Date();
                  const thisMonth = now.toISOString().slice(0, 7);
                  const thisMonthRevenue = revenueData?.find(r => r.month === thisMonth);
                  // Count bookings created this month from the bookings list
                  const monthlyCount = bookings?.filter(b => {
                    const created = new Date(b.createdAt || b.eventDate);
                    return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
                  }).length || 0;
                  return monthlyCount;
                })()}
                totalEarnings={revenueData?.reduce((sum, r) => sum + r.revenue, 0) || 0}
                averageRating={avgRating?.averageRating || 0}
                reviewCount={avgRating?.reviewCount || 0}
                previousMonthBookings={(() => {
                  const now = new Date();
                  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  return bookings?.filter(b => {
                    const created = new Date(b.createdAt || b.eventDate);
                    return created.getFullYear() === lastMonth.getFullYear() && created.getMonth() === lastMonth.getMonth();
                  }).length || 0;
                })()}
              />
            )}

            {/* Quick Actions */}
            <Card id="quick-actions">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/bookings')}
                      >
                        <Calendar className="h-5 w-5" />
                        <span className="text-xs font-medium">Bookings</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Manage gigs</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View and manage your upcoming and past bookings</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/availability')}
                      >
                        <Clock className="h-5 w-5" />
                        <span className="text-xs font-medium">Availability</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Set open dates</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Set your available dates so venues know when to book you</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/rider-builder')}
                      >
                        <Music className="h-5 w-5" />
                        <span className="text-xs font-medium">Rider Builder</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Your requirements</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Create your technical and hospitality requirements for venues</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/messages')}
                      >
                        <MessageSquare className="h-5 w-5" />
                        <span className="text-xs font-medium">Messages</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Chat with venues</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Chat with venues and manage booking conversations</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/earnings')}
                      >
                        <DollarSign className="h-5 w-5" />
                        <span className="text-xs font-medium">Earnings</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Track payments</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Track your payments, payouts, and revenue history</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/fan-club')}
                      >
                        <Users className="h-5 w-5" />
                        <span className="text-xs font-medium">Fan Club</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Grow your fans</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Manage your fan club, membership tiers, and exclusive content</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4 border-purple-200 hover:bg-purple-50"
                        onClick={() => navigate('/ology-live/dashboard')}
                      >
                        <Video className="h-5 w-5 text-purple-600" />
                        <span className="text-xs font-medium">Ology Live</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Virtual sessions</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Create and manage virtual live sessions — gaming, Q&A, workshops, and more</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/content-releases')}
                      >
                        <Download className="h-5 w-5" />
                        <span className="text-xs font-medium">Releases</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Monetize content</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Create and monetize content releases — movies, albums, courses, and more</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/events')}
                      >
                        <Calendar className="h-5 w-5" />
                        <span className="text-xs font-medium">Events</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Post & sell tickets</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Post and manage your live events and sell tickets</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/favorites')}
                      >
                        <Heart className="h-5 w-5" />
                        <span className="text-xs font-medium">Favorites</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Saved venues</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View venues and artists you've saved</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate(`/artists/${artistProfile?.id || ''}/history`)}
                      >
                        <Camera className="h-5 w-5" />
                        <span className="text-xs font-medium">Portfolio</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Past performances</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Showcase your past performances and media</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/contracts')}
                      >
                        <FileText className="h-5 w-5" />
                        <span className="text-xs font-medium">Contracts</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Sign agreements</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View and sign your booking contracts</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/merch')}
                      >
                        <ShoppingBag className="h-5 w-5" />
                        <span className="text-xs font-medium">Merch</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Sell products</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Sell merch to fans — pre-order/made-to-order, upload designs, set prices</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/projects')}
                      >
                        <Disc3 className="h-5 w-5" />
                        <span className="text-xs font-medium">Projects</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Preview releases</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Showcase upcoming albums, EPs, and mixtapes with audio snippets</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => navigate('/team')}
                      >
                        <Users className="h-5 w-5" />
                        <span className="text-xs font-medium">Team</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">Manage access</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Invite your manager and team members to help manage your profile</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full flex flex-col items-center gap-2 h-auto py-4 border-purple-200 hover:bg-purple-50 relative"
                        onClick={() => navigate('/promote')}
                      >
                        {activePromoRequest && (
                          <span
                            className={`absolute top-1.5 right-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold cursor-pointer hover:opacity-80 ${activePromoRequest.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : activePromoRequest.status === 'in_review' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}
                            onClick={(e) => { e.stopPropagation(); setShowPromoModal(true); }}
                            title="Click for details"
                          >
                            {activePromoRequest.status === 'in_progress' ? 'Active' : activePromoRequest.status === 'in_review' ? 'Review' : 'Pending'}
                          </span>
                        )}
                        <Megaphone className="h-5 w-5 text-purple-600" />
                        <span className="text-xs font-medium">Promote</span>
                        <span className="text-[10px] text-muted-foreground leading-tight block sm:hidden">AI ad copy</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Generate AI ad copy or request managed promotion for your events and releases</TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>

            {/* Project Stats */}
            {projectStats && projectStats.projectCount > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Disc3 className="h-5 w-5 text-purple-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Project Previews</p>
                      <p className="text-xs text-muted-foreground">
                        {projectStats.projectCount} project{projectStats.projectCount !== 1 ? 's' : ''} · {projectStats.trackCount} track{projectStats.trackCount !== 1 ? 's' : ''} · {projectStats.totalPlays} play{projectStats.totalPlays !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/projects')} className="text-xs">
                      Manage
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Calendar */}
            {bookings && bookings.length > 0 && (
              <BookingCalendar bookings={bookings} role="artist" />
            )}

            {/* Incoming Booking Requests */}
            {bookings && bookings.filter((b: any) => b.status === 'pending').length > 0 && (
              <Card className="border-amber-200 bg-amber-50/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600" />
                    Incoming Requests
                  </CardTitle>
                  <CardDescription>{bookings.filter((b: any) => b.status === 'pending').length} pending request(s) awaiting your response</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bookings.filter((b: any) => b.status === 'pending').slice(0, 5).map((booking: any) => (
                      <BookingRequestCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Bookings (confirmed) */}
            {upcomingBookings.filter((b: any) => b.status === 'confirmed').length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
                  <CardDescription>{upcomingBookings.filter((b: any) => b.status === 'confirmed').length} confirmed event(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingBookings.filter((b: any) => b.status === 'confirmed').slice(0, 3).map((booking: any) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div>
                          <p className="font-semibold text-sm">{booking.venueName || `Booking #${booking.id}`}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-600">
                              {new Date(booking.eventDate).toLocaleDateString()}
                            </p>
                            {booking.bookingType && (
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded capitalize">
                                {booking.bookingType.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                          {booking.totalFee && (
                            <p className="text-xs font-medium text-green-700 mt-0.5">${Number(booking.totalFee).toLocaleString()}</p>
                          )}
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

            {/* Google Calendar Two-Way Sync */}
            <GoogleCalendarSync />

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
                    Post Event
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {myEvents && myEvents.length > 0 ? (
                  <div className="space-y-3">
                    {myEvents.slice(0, 5).map((event: any) => (
                      <div key={event.id} className="flex gap-3 items-start p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                        {(event as any).coverImageUrl ? (
                          <img
                            src={(event as any).coverImageUrl}
                            alt={event.eventTitle}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 cursor-pointer"
                            onClick={() => navigate(`/events/${toSlug(event.eventTitle || '')}`)}
                          />
                        ) : (
                          <div
                            className="w-14 h-14 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 cursor-pointer"
                            onClick={() => navigate(`/events/${toSlug(event.eventTitle || '')}`)}
                          >
                            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4
                            className="font-semibold text-sm truncate cursor-pointer hover:text-purple-600 transition"
                            onClick={() => navigate(`/events/${toSlug(event.eventTitle || '')}`)}
                          >
                            {event.eventTitle}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-gray-400">
                            {formatDateOnly(event.eventDate, { weekday: 'short', month: 'short', day: 'numeric' })}
                            {event.eventTime && ` at ${formatEventTime(event.eventTime)}`}
                          </p>
                          {event.location && (
                            <p className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {event.location}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                            onClick={() => navigate(`/events/${event.id}/tickets`)}
                            title="Manage tickets"
                          >
                            <Ticket className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => navigate(`/events/${event.id}/edit`)}
                            title="Edit event"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this event?')) {
                                setDeletingEventId(event.id);
                                deleteEventMutation.mutate({ id: event.id }, {
                                  onSettled: () => setDeletingEventId(null),
                                });
                              }
                            }}
                            disabled={deletingEventId === event.id}
                            title="Delete event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {myEvents.length > 5 && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/events')}
                      >
                        View All {myEvents.length} Events
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-3" />
                    <p className="text-sm text-slate-600 mb-4">
                      Post your first event to let fans know where you're performing!
                    </p>
                    <Button
                      onClick={() => navigate('/events/create')}
                      className="w-full"
                    >
                      Post Your First Event
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Video (Pro Feature) */}
            <PerformanceVideoUpload
              onUpgradeClick={() => {
                const subSection = document.getElementById('subscription-management');
                if (subSection) subSection.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Video Portfolio (Multi-video clips) */}
            <VideoPortfolioManager talentType={(artistProfile as any)?.talentType || 'artist'} />

            {/* Subscription Management */}
            <div id="subscription-management">
              <SubscriptionManagement />
            </div>

            {/* Sponsor Management (Enterprise tier) */}
            <div id="sponsor-management">
              <SponsorManagement />
            </div>

            {/* Referral Section */}
            <ReferralSection />

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

      {/* Promotion Request Details Modal */}
      {activePromoRequest && (
        <Dialog open={showPromoModal} onOpenChange={setShowPromoModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-purple-600" />
                Boost Request Details
              </DialogTitle>
              <DialogDescription>Your current promotion request status and timeline</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${activePromoRequest.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : activePromoRequest.status === 'in_review' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-100 text-orange-700'}`}>
                  {activePromoRequest.status === 'in_progress' ? 'In Progress' : activePromoRequest.status === 'in_review' ? 'Under Review' : 'Submitted'}
                </span>
              </div>
              {/* Target */}
              {activePromoRequest.targetName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Promoting</span>
                  <span className="text-sm font-medium">{activePromoRequest.targetName}</span>
                </div>
              )}
              {/* Type */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Type</span>
                <span className="text-sm capitalize">{activePromoRequest.type?.replace('_', ' ') || 'General'}</span>
              </div>
              {/* Budget */}
              {activePromoRequest.budget && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Budget</span>
                  <span className="text-sm font-medium">${activePromoRequest.budget}</span>
                </div>
              )}
              {/* Timeline */}
              {activePromoRequest.timeline && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Timeline</span>
                  <span className="text-sm">{activePromoRequest.timeline}</span>
                </div>
              )}
              {/* Platforms */}
              {activePromoRequest.platforms && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground block mb-1">Platforms</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(Array.isArray(activePromoRequest.platforms) ? activePromoRequest.platforms : [activePromoRequest.platforms]).map((p: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-muted rounded text-xs capitalize">{p}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Goals */}
              {activePromoRequest.goals && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground block mb-1">Goals</span>
                  <p className="text-sm">{activePromoRequest.goals}</p>
                </div>
              )}
              {/* Submitted Date */}
              {activePromoRequest.createdAt && (
                <div className="flex items-center justify-between border-t pt-3">
                  <span className="text-sm font-medium text-muted-foreground">Submitted</span>
                  <span className="text-sm">{new Date(activePromoRequest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              )}
              {/* Admin Notes */}
              {activePromoRequest.adminNotes && (
                <div className="border-t pt-3">
                  <span className="text-sm font-medium text-muted-foreground block mb-1">Team Notes</span>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">{activePromoRequest.adminNotes}</p>
                </div>
              )}
              {/* Edit Mode */}
              {editingPromo && activePromoRequest.status === 'submitted' ? (
                <div className="border-t pt-3 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">Budget ($)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background"
                      value={editBudget}
                      onChange={(e) => setEditBudget(e.target.value)}
                      min={50}
                      step={10}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground block mb-1">Goals</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-md text-sm bg-background min-h-[80px]"
                      value={editGoals}
                      onChange={(e) => setEditGoals(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        editPromoMutation.mutate({
                          requestId: activePromoRequest.id,
                          budget: Math.round(parseFloat(editBudget) * 100),
                          goals: editGoals,
                        });
                      }}
                      disabled={editPromoMutation.isPending}
                    >
                      {editPromoMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingPromo(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : activePromoRequest.status === 'submitted' ? (
                <div className="border-t pt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setEditBudget(String((activePromoRequest.budget || 0) / 100));
                      setEditGoals(activePromoRequest.goals || '');
                      setEditingPromo(true);
                    }}
                  >
                    Edit Request
                  </Button>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
export default ArtistDashboardV3;

// Booking Request Card with Accept / Decline / Counter
function BookingRequestCard({ booking }: { booking: any }) {
  const [, navigate] = useLocation();
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const utils = trpc.useUtils();

  const updateStatus = trpc.booking.updateStatus.useMutation({
    onSuccess: () => {
      utils.booking.getMyArtistBookings.invalidate();
    },
  });

  const counterOffer = trpc.booking.counterOffer.useMutation({
    onSuccess: () => {
      setShowCounter(false);
      setCounterAmount('');
      setCounterMessage('');
      utils.booking.getMyArtistBookings.invalidate();
    },
  });

  return (
    <div className="p-4 bg-white rounded-lg border border-amber-200 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-sm">{booking.venueName || booking.clientName || `Request #${booking.id}`}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-600">
              {new Date(booking.eventDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            {booking.eventTime && (
              <span className="text-xs text-slate-500">at {booking.eventTime}</span>
            )}
          </div>
          {booking.bookingType && (
            <span className="inline-block mt-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded capitalize">
              {booking.bookingType.replace('_', ' ')}
            </span>
          )}
        </div>
        <div className="text-right">
          {booking.totalFee && (
            <p className="text-sm font-bold text-green-700">${Number(booking.totalFee).toLocaleString()}</p>
          )}
          <p className="text-[10px] text-slate-500">Proposed Budget</p>
        </div>
      </div>

      {/* Event Details */}
      {booking.eventDetails && (
        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded line-clamp-2">{booking.eventDetails}</p>
      )}

      {/* Counter Offer (if already countered) */}
      {booking.counterOfferAmount && (
        <div className="text-xs bg-blue-50 border border-blue-200 p-2 rounded">
          <p className="font-medium text-blue-800">Counter Offer: ${Number(booking.counterOfferAmount).toLocaleString()}</p>
          {booking.counterOfferMessage && <p className="text-blue-600 mt-0.5">{booking.counterOfferMessage}</p>}
        </div>
      )}

      {/* Contract Status Indicator */}
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-md bg-slate-50 border border-slate-100">
        <span className="text-[10px] font-medium text-slate-500">Contract:</span>
        {booking.riderStatus === 'signed' || booking.riderStatus === 'fully_executed' ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Fully Executed
          </span>
        ) : booking.riderStatus === 'artist_signed' ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Signed by Talent — Awaiting Booker
          </span>
        ) : booking.riderStatus === 'venue_signed' ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-blue-700">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Signed by Booker — Awaiting Talent
          </span>
        ) : booking.riderStatus === 'sent' ? (
          <span className="flex items-center gap-1 text-[10px] font-medium text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Sent — Awaiting Signatures
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            Not Generated
          </span>
        )}
      </div>

      {/* Action Buttons */}
      {!showCounter ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={() => updateStatus.mutate({ id: booking.id, status: 'confirmed' })}
            disabled={updateStatus.isPending}
          >
            Accept
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => setShowCounter(true)}
          >
            Counter
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => updateStatus.mutate({ id: booking.id, status: 'cancelled' })}
            disabled={updateStatus.isPending}
          >
            Decline
          </Button>
        </div>
      ) : (
        <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
          <p className="text-xs font-medium">Your Counter Offer</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">$</span>
              <input
                type="number"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder="Amount"
                className="w-full pl-5 pr-2 py-1.5 text-sm border rounded bg-white"
              />
            </div>
          </div>
          <input
            type="text"
            value={counterMessage}
            onChange={(e) => setCounterMessage(e.target.value)}
            placeholder="Optional message (e.g., 'Includes travel')..."
            className="w-full px-2 py-1.5 text-xs border rounded bg-white"
            maxLength={500}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                if (counterAmount) {
                  counterOffer.mutate({
                    bookingId: booking.id,
                    counterAmount: Number(counterAmount),
                    message: counterMessage || undefined,
                  });
                }
              }}
              disabled={!counterAmount || counterOffer.isPending}
            >
              Send Counter
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCounter(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* View Details / Contract Links */}
      <div className="flex items-center gap-3">
        <button
          className="text-[10px] text-primary hover:underline"
          onClick={() => navigate(`/booking/${booking.id}`)}
        >
          View Full Details →
        </button>
        <button
          className="text-[10px] text-purple-600 hover:underline"
          onClick={() => navigate(`/booking/${booking.id}`)}
        >
          📜 Generate Contract
        </button>
      </div>
    </div>
  );
}
