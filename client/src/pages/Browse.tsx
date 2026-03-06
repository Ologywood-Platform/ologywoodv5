import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search, MapPin, DollarSign, MessageSquare, Calendar, Heart, SlidersHorizontal, X, RotateCcw } from "lucide-react";
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
import Footer from '@/components/Footer';

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
  }>({});
  
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
  
  // Tab state for Artists/Events
  const [activeTab, setActiveTab] = useState<'artists' | 'events'>('artists');

  const { data: artists, isLoading: artistsLoading, refetch: refetchArtists } = trpc.artist.search.useQuery(filters);

  // Pull-to-refresh
  const { PullIndicator } = usePullToRefresh({
    onRefresh: async () => {
      await refetchArtists();
    },
  });

  const noResultsRef = useRef<HTMLDivElement>(null);

  const filteredArtists = artists?.filter(artist => {
    const matchesSearch = searchQuery === "" || 
      artist.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(artist.genre) && artist.genre.some((g: string) => 
        g.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
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
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={buildBreadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: 'Browse Artists', url: '/browse' }])} id="browse-breadcrumb" />
      <SiteHeader hideBrowse />
      <PullIndicator />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Search Bar + Filter Toggle */}
        <div className="mb-4 sm:mb-6">
          <div className="flex gap-2 sm:gap-3">
            <ClearableInput
              placeholder="Search by name or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery("")}
              leftIcon={<Search className="h-4 w-4" />}
              className="text-xs sm:text-sm"
              wrapperClassName="flex-1"
            />
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
            {(searchQuery || activeFilterCount > 0) && (
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

        {/* Tabs for Artists/Events */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'artists' | 'events')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-xs mb-4 sm:mb-6">
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          
          {/* Artists Tab */}
          <TabsContent value="artists" className="mt-0">
            {/* Collapsible Filters */}
            {showFilters && (
              <SearchFilters filterType="artists" onFilterChange={(newFilters) => {
                setFilters(newFilters);
                setShowFilters(false);
              }} />
            )}

            {/* Results Count */}
            {filteredArtists && filteredArtists.length > 0 && (
              <div className="mb-4">
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
            {!artistsLoading && filteredArtists && filteredArtists.length > 0 && (
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
                            <Music className="h-10 w-10 text-primary/30" />
                            <span className="text-xs text-muted-foreground/60">No photo yet</span>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm sm:text-base truncate">{artist.artistName}</h3>
                              {Array.isArray(artist.genre) && artist.genre.length > 0 && (
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">{artist.genre.join(", ")}</p>
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

            {/* No Results */}
            {!artistsLoading && filteredArtists && filteredArtists.length === 0 && (
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
          
          {/* Events Tab */}
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
      <Footer />
    </div>
  );
}
