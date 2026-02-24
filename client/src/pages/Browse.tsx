import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search, MapPin, DollarSign, MessageSquare, Calendar, Heart } from "lucide-react";
import { SearchFilters } from "@/components/SearchFilters";
import { FavoriteButton } from "@/components/FavoriteButton";
import { QuickSignupModal } from "@/components/QuickSignupModal";
import { LazyImage } from "@/components/LazyImage";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// EventDiscovery removed - not part of current MVP
import { setMetaTags, pageMetaTags } from "@/utils/seoMeta";

export default function Browse() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.browse);
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    location?: string;
    minFee?: number;
    maxFee?: number;
    availableFrom?: string;
    availableTo?: string;
  }>({});
  
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

  const { data: artists, isLoading: artistsLoading } = trpc.artist.search.useQuery(filters);

  const filteredArtists = artists?.filter(artist => {
    const matchesSearch = searchQuery === "" || 
      artist.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(artist.genre) && artist.genre.some((g: string) => 
        g.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    return matchesSearch;
  });

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
    // After signup, redirect to the action they wanted to do
    if (modalConfig.actionType === 'book' && modalConfig.artistId) {
      navigate(`/bookings/create?artistId=${modalConfig.artistId}`);
    } else if (modalConfig.actionType === 'message' && modalConfig.artistId) {
      navigate(`/messages?artistId=${modalConfig.artistId}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile Optimized */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 sm:gap-2 text-lg sm:text-2xl font-bold text-primary">
            <img src="/logo-sm.png" alt="Ologywood" className="h-6 sm:h-8 w-6 sm:w-8 rounded" />
            <span className="hidden sm:inline">Ologywood</span>
            <span className="sm:hidden">OW</span>
          </Link>
          
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">← Back</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Tabs for Artists/Events */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'artists' | 'events')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-xs mb-6">
            <TabsTrigger value="artists">Artists</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>
          
          {/* Artists Tab */}
          <TabsContent value="artists" className="mt-0">
            {/* Filters */}
            <SearchFilters filterType="artists" onFilterChange={setFilters} />

            {/* Artists Grid */}
            {filteredArtists && filteredArtists.length > 0 ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing <strong>{filteredArtists.length}</strong> artist{filteredArtists.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {filteredArtists.map(artist => (
                    <Link key={artist.id} href={`/artist/${artist.id}`}>
                      <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                        {artist.profilePhotoUrl && (
                          <div className="h-40 sm:h-48 overflow-hidden bg-gray-200">
                            <LazyImage
                              src={artist.profilePhotoUrl}
                              alt={artist.artistName}
                              containerClassName="w-full h-full"
                              imageClassName="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
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
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-base sm:text-lg">
                  No artists found matching your criteria.
                </p>
              </div>
            )}
          </TabsContent>
          
          {/* Events Tab - Removed (not part of current MVP) */}
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
    </div>
  );
}
