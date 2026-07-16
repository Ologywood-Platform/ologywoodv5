import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Search, MapPin, DollarSign, MessageSquare, Calendar, Heart, SlidersHorizontal, X, RotateCcw, Plane, Building2, Users, Filter, Wine, Disc3, Mic2, Theater, Trophy, TreePine, UtensilsCrossed, Sofa, Tent, Lock, HelpCircle, ArrowUpDown, Send, Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SiteHeader from "@/components/SiteHeader";
import { ClearableInput } from "@/components/ui/clearable-input";
import { SearchFilters } from "@/components/SearchFilters";
import { FavoriteButton } from "@/components/FavoriteButton";
import { QuickSignupModal } from "@/components/QuickSignupModal";
import { LazyImage } from "@/components/LazyImage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { setMetaTags, pageMetaTags } from "@/utils/seoMeta";
import { JsonLd, buildBreadcrumbJsonLd } from "@/components/JsonLd";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { TouringBadge } from '@/components/TouringDisplay';
import { CrmBadge } from '@/components/CrmBadge';

export default function Browse() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.browse);
  }, []);

  const searchParams = useSearch();
  const initialQuery = new URLSearchParams(searchParams).get('q') || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<{
    location?: string;
    minFee?: number;
    maxFee?: number;
    availableFrom?: string;
    availableTo?: string;
    touringOnly?: boolean;
    crmOnly?: boolean;
  }>({});
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  
  // Collapsible filters state
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal state
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    actionType: 'book' | 'message';
    targetType: 'artist' | 'venue';
    artistId?: number;
  }>({
    actionType: 'book',
    targetType: 'artist',
  });
  
  // Tab state for Artists/Events/Venues - read from URL ?tab= param
  const initialTab = new URLSearchParams(searchParams).get('tab') as 'artists' | 'events' | 'venues' | null;
  const [activeTab, setActiveTab] = useState<'artists' | 'events' | 'venues'>(initialTab && ['artists', 'events', 'venues'].includes(initialTab) ? initialTab : 'artists');

  // Talent type filter for Browse
  const [talentTypeFilter, setTalentTypeFilter] = useState<string>('all');

  // Venue filter state
  const [venueLocation, setVenueLocation] = useState('');
  const [venueType, setVenueType] = useState('');
  const [venueCapacityRange, setVenueCapacityRange] = useState('');
  const [showVenueFilters, setShowVenueFilters] = useState(false);

  // Parse capacity range into min/max
  const getCapacityFilter = () => {
    switch (venueCapacityRange) {
      case 'small': return { minCapacity: 1, maxCapacity: 100 };
      case 'medium': return { minCapacity: 101, maxCapacity: 500 };
      case 'large': return { minCapacity: 501, maxCapacity: 1500 };
      case 'xlarge': return { minCapacity: 1501, maxCapacity: undefined };
      default: return { minCapacity: undefined, maxCapacity: undefined };
    }
  };

  const capacityFilter = getCapacityFilter();

  // Fetch venues for the venues tab
  const { data: venuesList, isLoading: venuesLoading } = trpc.venue.search.useQuery(
    {
      searchQuery: searchQuery || undefined,
      location: venueLocation || undefined,
      venueType: venueType || undefined,
      minCapacity: capacityFilter.minCapacity,
      maxCapacity: capacityFilter.maxCapacity,
      limit: 50,
    },
    { enabled: activeTab === 'venues' && !!(searchQuery || venueLocation || venueType || venueCapacityRange) }
  );

  const [venueSort, setVenueSort] = useState<'newest' | 'capacity_desc' | 'capacity_asc' | 'alphabetical' | 'alphabetical_desc'>('newest');

  const hasVenueFilters = venueType || venueCapacityRange;
  const hasVenueSearched = !!(searchQuery || venueLocation || venueType || venueCapacityRange);
  const clearVenueFilters = () => {
    setVenueType('');
    setVenueCapacityRange('');
  };

  // Venue type icon mapping
  const getVenueTypeIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('bar') || t.includes('lounge')) return <Wine className="h-3.5 w-3.5" />;
    if (t.includes('nightclub') || t.includes('club')) return <Disc3 className="h-3.5 w-3.5" />;
    if (t.includes('concert')) return <Mic2 className="h-3.5 w-3.5" />;
    if (t.includes('theater')) return <Theater className="h-3.5 w-3.5" />;
    if (t.includes('arena') || t.includes('stadium')) return <Trophy className="h-3.5 w-3.5" />;
    if (t.includes('outdoor') || t.includes('amphitheater')) return <TreePine className="h-3.5 w-3.5" />;
    if (t.includes('restaurant')) return <UtensilsCrossed className="h-3.5 w-3.5" />;
    if (t.includes('rooftop')) return <Sofa className="h-3.5 w-3.5" />;
    if (t.includes('festival')) return <Tent className="h-3.5 w-3.5" />;
    if (t.includes('private') || t.includes('estate')) return <Lock className="h-3.5 w-3.5" />;
    if (t.includes('warehouse')) return <Building2 className="h-3.5 w-3.5" />;
    if (t.includes('hotel') || t.includes('ballroom')) return <Building2 className="h-3.5 w-3.5" />;
    if (t.includes('church') || t.includes('worship')) return <Building2 className="h-3.5 w-3.5" />;
    if (t.includes('community')) return <Building2 className="h-3.5 w-3.5" />;
    if (t.includes('banquet')) return <Building2 className="h-3.5 w-3.5" />;
    if (t.includes('event space')) return <Building2 className="h-3.5 w-3.5" />;
    return <Building2 className="h-3.5 w-3.5" />;
  };

  // Format venue type label
  const formatVenueType = (type: string) => {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Venue';
  };

  // Sort venues
  const sortedVenues = (() => {
    if (!venuesList) return [];
    const venues = [...(venuesList as any[])];
    switch (venueSort) {
      case 'capacity_desc':
        return venues.sort((a, b) => (b.capacity || 0) - (a.capacity || 0));
      case 'capacity_asc':
        return venues.sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
      case 'alphabetical':
        return venues.sort((a, b) => (a.organizationName || '').localeCompare(b.organizationName || ''));
      case 'alphabetical_desc':
        return venues.sort((a, b) => (b.organizationName || '').localeCompare(a.organizationName || ''));
      case 'newest':
      default:
        return venues.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
  })();

  // Venue availability indicator
  const venueIds = sortedVenues.map((v: any) => v.id);
  const { data: availabilityData } = trpc.venue.getAvailabilitySummary.useQuery(
    { venueIds },
    { enabled: activeTab === 'venues' && venueIds.length > 0 }
  );

  // Save/follow venue mutations
  const utils = trpc.useUtils();
  const followVenue = trpc.follows.follow.useMutation({
    onSuccess: () => {
      utils.follows.isFollowing.invalidate();
      toast.success('Venue saved!');
    },
    onError: (err) => toast.error(err.message || 'Failed to save venue'),
  });
  const unfollowVenue = trpc.follows.unfollow.useMutation({
    onSuccess: () => {
      utils.follows.isFollowing.invalidate();
      toast.success('Venue removed from saved');
    },
    onError: (err) => toast.error(err.message || 'Failed to remove venue'),
  });

  const handleSaveVenue = (e: React.MouseEvent, venueUserId: number, isCurrentlySaved: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign in to save venues.');
      return;
    }
    if (isCurrentlySaved) {
      unfollowVenue.mutate({ followingId: venueUserId, followingType: 'venue' });
    } else {
      followVenue.mutate({ followingId: venueUserId, followingType: 'venue' });
    }
  };

  // Request to Perform modal state
  const [showPerformModal, setShowPerformModal] = useState(false);
  const [performVenue, setPerformVenue] = useState<any>(null);
  const [performEventName, setPerformEventName] = useState('');
  const [performDate, setPerformDate] = useState('');
  const [performMessage, setPerformMessage] = useState('');

  const requestToPerform = trpc.booking.requestToPerform.useMutation({
    onSuccess: () => {
      toast.success('Performance request sent! The venue will be notified.');
      setShowPerformModal(false);
      setPerformEventName('');
      setPerformDate('');
      setPerformMessage('');
      setPerformVenue(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send request');
    },
  });

  const handleRequestToPerform = (e: React.MouseEvent, venue: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Please sign up or log in to request a performance.');
      return;
    }
    if (user?.role !== 'artist') {
      toast.error('Only artists can request to perform at venues.');
      return;
    }
    setPerformVenue(venue);
    setShowPerformModal(true);
  };

  const submitPerformRequest = () => {
    if (!performVenue || !performEventName || !performDate) {
      toast.error('Please fill in the event name and date.');
      return;
    }
    requestToPerform.mutate({
      venueId: performVenue.id,
      eventName: performEventName,
      eventDate: performDate,
      message: performMessage || undefined,
    });
  };

  const { data: artists, isLoading: artistsLoading, refetch: refetchArtists } = trpc.artist.search.useQuery(filters, { enabled: hasAppliedFilters || searchQuery.length > 0 });

  // Fetch touring status for all artists to show badges
  const artistIds = artists?.map(a => a.id) || [];
  const { data: touringStatus } = trpc.touring.getTouringStatus.useQuery(
    { artistProfileIds: artistIds },
    { enabled: artistIds.length > 0 }
  );

  // Pull-to-refresh
  const { PullIndicator } = usePullToRefresh({
    onRefresh: async () => {
      await refetchArtists();
    },
  });

  const noResultsRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const filteredArtists = artists?.filter(artist => {
    const matchesSearch = searchQuery === "" || 
      artist.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(artist.genre) && artist.genre.some((g: string) => 
        g.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    // Apply talent type filter
    if (talentTypeFilter !== 'all') {
      const artistTalentType = (artist as any).talentType || 'artist';
      if (artistTalentType !== talentTypeFilter) return false;
    }
    
    // Apply touring filter client-side
    if (filters.touringOnly && touringStatus) {
      if (!touringStatus[artist.id]) return false;
    }
    
    // Apply CRM supporter filter
    if (filters.crmOnly) {
      if (!(artist as any).crmSupporter) return false;
    }
    
    return matchesSearch;
  });

  // Auto-scroll to no-results message when search yields zero results
  useEffect(() => {
    if (filteredArtists && filteredArtists.length === 0 && searchQuery && noResultsRef.current) {
      noResultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [filteredArtists, searchQuery]);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  const handleBookClick = (artistId: number) => {
    if (!isAuthenticated) {
      setModalConfig({
        actionType: 'book',
        targetType: 'artist',
        artistId,
      });
      setShowSignupModal(true);
    } else {
      navigate(`/bookings/create?artistId=${artistId}`);
    }
  };

  const handleMessageClick = (artistId: number) => {
    if (!isAuthenticated) {
      setModalConfig({
        actionType: 'message',
        targetType: 'artist',
        artistId,
      });
      setShowSignupModal(true);
    } else {
      navigate(`/messages?artistId=${artistId}`);
    }
  };

  const handleSignupSuccess = () => {
    if (modalConfig.actionType === 'book' && modalConfig.artistId) {
      navigate(`/bookings/create?artistId=${modalConfig.artistId}`);
    } else if (modalConfig.actionType === 'message' && modalConfig.artistId) {
      navigate(`/messages?artistId=${modalConfig.artistId}`);
    }
  };

  const handleResetAll = () => {
    setSearchQuery('');
    setFilters({});
    setHasAppliedFilters(false);
    // Keep the filter panel open so user can select new criteria (UX fix)
    setShowFilters(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={buildBreadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: 'Browse Artists', url: '/browse' }])} id="browse-breadcrumb" />
      <SiteHeader />
      <PullIndicator />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Search Bar + Filter Toggle */}
        <div className="mb-4 sm:mb-6">
          <div className="flex gap-2 sm:gap-3">
            <ClearableInput
              placeholder={activeTab === 'venues' ? 'Search venues by name or location...' : activeTab === 'events' ? 'Search events...' : 'Search artists by name or genre...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
              leftIcon={<Search className="h-4 w-4" />}
              className="text-xs sm:text-sm"
              wrapperClassName="flex-1"
            />
            {activeTab !== 'venues' && (
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-primary-foreground text-primary text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            )}
            {(searchQuery || activeFilterCount > 0) && activeTab !== 'venues' && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 shrink-0 text-muted-foreground"
                onClick={handleResetAll}
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            )}
          </div>
        </div>

        {/* Tabs for Artists/Events/Venues */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'artists' | 'events' | 'venues')} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-sm mb-4 sm:mb-6">
            <TabsTrigger value="artists">Talent</TabsTrigger>
            <TabsTrigger value="venues">Venues</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          
          {/* Artists Tab */}
          <TabsContent value="artists" className="mt-0">
            {/* Collapsible Filters */}
            {showFilters && (
              <SearchFilters filterType="artists" onFilterChange={(newFilters) => {
                setFilters(newFilters);
                setHasAppliedFilters(true);
                // Keep filter panel open so user can refine (UX consistency)
                // Scroll to results count so user sees "X artists found" first
                setTimeout(() => {
                  if (resultsRef.current) {
                    resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }} />
            )}

            {/* Talent Type Filter Chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { value: 'all', label: 'All' },
                { value: 'artist', label: 'Artists' },
                { value: 'athlete', label: 'Athletes' },
                { value: 'creator', label: 'Creators' },
                { value: 'entertainer', label: 'Entertainers' },
                { value: 'influencer', label: 'Influencers' },
              ].map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setTalentTypeFilter(chip.value)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    talentTypeFilter === chip.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
              <button
                onClick={() => setFilters(f => ({ ...f, crmOnly: !f.crmOnly }))}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  filters.crmOnly
                    ? 'bg-amber-100 border-amber-300 text-amber-800 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300'
                    : 'bg-background border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <img src="/manus-storage/crmbadge_optimized_2553962d.png" alt="" className="w-4 h-4 object-contain" />
                CRM Supporters
              </button>
            </div>

            {/* Results Count */}
            {(hasAppliedFilters || searchQuery.length > 0) && filteredArtists && filteredArtists.length > 0 && (
              <div ref={resultsRef} className="mb-4 scroll-mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing <strong>{filteredArtists.length}</strong> artist{filteredArtists.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}

            {/* Loading State */}
            {artistsLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="h-full animate-pulse">
                    <div className="aspect-[4/3] bg-muted rounded-t-lg" />
                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Artists Grid */}
            {!artistsLoading && (hasAppliedFilters || searchQuery.length > 0) && filteredArtists && filteredArtists.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredArtists.map(artist => (
                  <Link key={artist.id} href={`/artist/${artist.id}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                      {/* Always show image area — with photo or placeholder */}
                      <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg">
                        {artist.profilePhotoUrl ? (
                          <LazyImage
                            src={artist.profilePhotoUrl}
                            alt={artist.artistName}
                            containerClassName="w-full h-full"
                            imageClassName="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                            {(artist as any).talentType === 'athlete' ? (
                              <>
                                <svg className="h-10 w-10 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                <span className="text-xs text-muted-foreground/60">Athlete</span>
                              </>
                            ) : (
                              <>
                                <Music className="h-10 w-10 text-primary/30" />
                                <span className="text-xs text-muted-foreground/60">No photo yet</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h3 className="font-semibold text-sm sm:text-base truncate">{artist.artistName}</h3>
                                {(artist as any).crmSupporter && <CrmBadge size="md" />}
                                {touringStatus?.[artist.id] && <TouringBadge />}
                              </div>
                              {(artist as any).talentType === 'athlete' ? (
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                  {[(artist as any).sportCategory, (artist as any).sportPosition, (artist as any).sportTeam].filter(Boolean).join(' · ') || 'Athlete'}
                                </p>
                              ) : (
                                Array.isArray(artist.genre) && artist.genre.length > 0 && (
                                  <p className="text-xs sm:text-sm text-muted-foreground truncate">{artist.genre.join(", ")}</p>
                                )
                              )}
                            </div>
                            <FavoriteButton artistId={artist.id} size="sm" />
                          </div>
                          
                          {artist.location && (
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{artist.location}</span>
                            </div>
                          )}
                          
                          {artist.feeRangeMin && (
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                              <DollarSign className="h-3 w-3 flex-shrink-0" />
                              <span>From ${artist.feeRangeMin}</span>
                            </div>
                          )}
                          
                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              className="text-xs sm:text-sm h-8 sm:h-9 gap-1 flex-1"
                              onClick={(e) => {
                                e.preventDefault();
                                handleBookClick(artist.id);
                              }}
                            >
                              <Calendar className="h-3 w-3" />
                              <span className="hidden sm:inline">Book</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs sm:text-sm h-8 sm:h-9 gap-1 flex-1"
                              onClick={(e) => {
                                e.preventDefault();
                                handleMessageClick(artist.id);
                              }}
                            >
                              <MessageSquare className="h-3 w-3" />
                              <span className="hidden sm:inline">Message</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {/* Initial State - No search/filter applied yet */}
            {!hasAppliedFilters && searchQuery.length === 0 && (
              <div className="text-center py-16">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Search for Artists</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Use the search bar above or open Filters to find artists by genre, location, availability, and more.
                </p>
              </div>
            )}
            {/* No Results */}
            {(hasAppliedFilters || searchQuery.length > 0) && !artistsLoading && filteredArtists && filteredArtists.length === 0 && (
              <div ref={noResultsRef} className="text-center py-16">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Artists Found</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                  No artists found matching your criteria. Try adjusting your search or filters.
                </p>
                <div className="flex gap-3 justify-center">
                  {searchQuery && (
                    <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                      Clear Search
                    </Button>
                  )}
                  {activeFilterCount > 0 && (
                    <Button variant="outline" size="sm" onClick={handleResetAll}>
                      <RotateCcw className="h-3 w-3 mr-1.5" />
                      Reset All
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Venues Tab */}
          <TabsContent value="venues" className="mt-0">
            {/* Venue Filters */}
            <div className="mb-4 space-y-3">
              {/* Location filter */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <div className="relative flex-1 sm:max-w-[280px]">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter by city or state..."
                    value={venueLocation}
                    onChange={(e) => setVenueLocation(e.target.value)}
                    className="h-10 text-xs sm:text-sm pl-9"
                  />
                  {venueLocation && (
                    <button
                      onClick={() => setVenueLocation('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Additional filters row */}
              <div className="flex items-center gap-2">
                <Button
                  variant={showVenueFilters ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowVenueFilters(!showVenueFilters)}
                  className="gap-1.5"
                >
                  <Filter className="h-3.5 w-3.5" />
                  More Filters
                  {hasVenueFilters && (
                    <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                      {[venueType, venueCapacityRange].filter(Boolean).length}
                    </Badge>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { clearVenueFilters(); }} className="gap-1 text-muted-foreground">
                  <X className="h-3.5 w-3.5" />
                  Clear Filters
                </Button>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground hidden sm:inline">Sort by</span>
                  <Select value={venueSort} onValueChange={(v) => setVenueSort(v as any)}>
                    <SelectTrigger className="h-8 w-[170px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="alphabetical">A to Z</SelectItem>
                      <SelectItem value="alphabetical_desc">Z to A</SelectItem>
                      <SelectItem value="capacity_desc">Largest capacity</SelectItem>
                      <SelectItem value="capacity_asc">Smallest capacity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {showVenueFilters && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-muted/50 rounded-lg border">
                  {/* Venue Type Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 justify-between">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" /> Venue Type</span>
                      {venueType && (
                        <button onClick={() => setVenueType('')} className="text-[10px] text-muted-foreground hover:text-foreground underline">clear</button>
                      )}
                    </label>
                    <Select value={venueType || '__all__'} onValueChange={(v) => setVenueType(v === '__all__' ? '' : v)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All types</SelectItem>
                        <SelectItem value="Arena">Arena / Stadium</SelectItem>
                        <SelectItem value="Banquet">Banquet Hall</SelectItem>
                        <SelectItem value="Bar">Bar / Lounge</SelectItem>
                        <SelectItem value="Church">Church / Place of Worship</SelectItem>
                        <SelectItem value="Community">Community Center</SelectItem>
                        <SelectItem value="Concert">Concert Hall</SelectItem>
                        <SelectItem value="Event Space">Event Space</SelectItem>
                        <SelectItem value="Hotel">Hotel Ballroom</SelectItem>
                        <SelectItem value="Nightclub">Nightclub</SelectItem>
                        <SelectItem value="Outdoor">Outdoor Amphitheater</SelectItem>
                        <SelectItem value="Private">Private Estate</SelectItem>
                        <SelectItem value="Restaurant">Restaurant</SelectItem>
                        <SelectItem value="Rooftop">Rooftop</SelectItem>
                        <SelectItem value="Theater">Theater</SelectItem>
                        <SelectItem value="Warehouse">Warehouse</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Capacity Filter */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1 justify-between">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> Capacity</span>
                      {venueCapacityRange && (
                        <button onClick={() => setVenueCapacityRange('')} className="text-[10px] text-muted-foreground hover:text-foreground underline">clear</button>
                      )}
                    </label>
                    <Select value={venueCapacityRange || '__all__'} onValueChange={(v) => setVenueCapacityRange(v === '__all__' ? '' : v)}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Any size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Any size</SelectItem>
                        <SelectItem value="small">Small (1–100)</SelectItem>
                        <SelectItem value="medium">Medium (101–500)</SelectItem>
                        <SelectItem value="large">Large (501–1,500)</SelectItem>
                        <SelectItem value="xlarge">XL (1,500+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {venuesLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="h-full animate-pulse">
                    <div className="aspect-[4/3] bg-muted rounded-t-lg" />
                    <CardContent className="p-3 sm:p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                        <div className="h-3 bg-muted rounded w-1/3" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Initial State - No search/filter applied yet */}
            {!hasVenueSearched && (
              <div className="text-center py-16">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Search for Venues</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  Use the search bar above or filters to find venues by name, location, type, or capacity.
                </p>
              </div>
            )}

            {hasVenueSearched && !venuesLoading && sortedVenues.length > 0 && (
              <>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing <strong>{sortedVenues.length}</strong> venue{sortedVenues.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {sortedVenues.map((venue: any) => (
                    <VenueCard
                      key={venue.id}
                      venue={venue}
                      availabilityData={availabilityData}
                      getVenueTypeIcon={getVenueTypeIcon}
                      formatVenueType={formatVenueType}
                      handleRequestToPerform={handleRequestToPerform}
                      handleSaveVenue={handleSaveVenue}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              </>
            )}

            {hasVenueSearched && !venuesLoading && sortedVenues.length === 0 && (
              <div className="text-center py-16">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Venues Found</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                  No venues match your search. Try a different query or check back as new venues join the platform.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-0">
            <div className="text-center py-16">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Events Available</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Sorry, there are no events scheduled at this time. Check back soon for upcoming performances and shows.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Signup Modal */}
      <QuickSignupModal
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSignupSuccess={handleSignupSuccess}
        actionType={modalConfig.actionType}
        targetType={modalConfig.targetType}
      />

      {/* Request to Perform Modal */}
      <Dialog open={showPerformModal} onOpenChange={setShowPerformModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Request to Perform
            </DialogTitle>
            <DialogDescription>
              Send a performance request to <strong>{performVenue?.organizationName}</strong>. They'll receive a notification and can accept or decline.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="perform-event-name">Event / Show Name *</Label>
              <Input
                id="perform-event-name"
                placeholder="e.g., Friday Night Live, Album Release Party"
                value={performEventName}
                onChange={(e) => setPerformEventName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perform-date">Preferred Date *</Label>
              <Input
                id="perform-date"
                type="date"
                value={performDate}
                onChange={(e) => setPerformDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="perform-message">Message (optional)</Label>
              <Textarea
                id="perform-message"
                placeholder="Tell the venue about your act, set length, or any special requirements..."
                value={performMessage}
                onChange={(e) => setPerformMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPerformModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitPerformRequest}
              disabled={requestToPerform.isPending || !performEventName || !performDate}
              className="gap-1.5"
            >
              {requestToPerform.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}


// VenueCard sub-component with save button and availability indicator
function VenueCard({ venue, availabilityData, getVenueTypeIcon, formatVenueType, handleRequestToPerform, handleSaveVenue, isAuthenticated }: any) {
  // Check if user has saved/followed this venue
  const { data: followData } = trpc.follows.isFollowing.useQuery(
    { followingId: venue.userId, followingType: 'venue' as const },
    { enabled: isAuthenticated }
  );
  const isSaved = followData?.isFollowing || false;
  const availability = availabilityData?.[venue.id];

  return (
    <Link href={`/venue/${venue.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 rounded-t-lg relative">
          {venue.profilePhotoUrl ? (
            <LazyImage
              src={venue.profilePhotoUrl}
              alt={venue.organizationName}
              containerClassName="w-full h-full"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="h-16 w-16 text-muted-foreground/30" />
            </div>
          )}
          {/* Venue type icon overlay */}
          {venue.venueType && (
            <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
              {getVenueTypeIcon(venue.venueType)}
            </div>
          )}
          {/* Save/Heart button */}
          <button
            className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm hover:bg-background transition-colors"
            onClick={(e) => handleSaveVenue(e, venue.userId, isSaved)}
            title={isSaved ? 'Remove from saved' : 'Save venue'}
          >
            <Heart className={`h-4 w-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
          {/* Availability indicator */}
          {availability && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
              <div className={`h-2 w-2 rounded-full ${availability.hasOpenDates ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-[10px] font-medium text-foreground">
                {availability.hasOpenDates ? 'Available' : 'Limited'}
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-3 sm:p-4">
          <h3 className="font-semibold text-base sm:text-lg truncate">{venue.organizationName}</h3>
          {venue.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {venue.location}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {venue.venueType && (
              <Badge variant="secondary" className="text-xs gap-1 flex items-center">
                {getVenueTypeIcon(venue.venueType)}
                {formatVenueType(venue.venueType)}
              </Badge>
            )}
            {venue.capacity && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Users className="h-3 w-3" />
                {venue.capacity}
              </span>
            )}
          </div>
          {/* Request to Perform button - only for artists */}
          <Button
            size="sm"
            variant="outline"
            className="mt-3 w-full gap-1.5 text-xs"
            onClick={(e) => handleRequestToPerform(e, venue)}
          >
            <Send className="h-3 w-3" />
            Request to Perform
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
