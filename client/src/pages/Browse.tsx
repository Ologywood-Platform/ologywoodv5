import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search, MapPin, DollarSign, MessageSquare, Calendar } from "lucide-react";
import { SearchFilters } from "@/components/SearchFilters";
import { FavoriteButton } from "@/components/FavoriteButton";
import { QuickSignupModal } from "@/components/QuickSignupModal";

export default function Browse() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
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

  const { data: artists, isLoading } = trpc.artist.search.useQuery(filters);

  const filteredArtists = artists?.filter(artist => {
    const matchesSearch = searchQuery === "" || 
      artist.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(artist.genre) && artist.genre.some(g => 
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
            <img src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663275372790/wPGyxTylibVlwkYr.png" alt="Ologywood" className="h-6 sm:h-8 w-6 sm:w-8 rounded" />
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
                placeholder="Search artists by name or genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <SearchFilters onFilterChange={setFilters} />

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
                        <img
                          src={artist.profilePhotoUrl}
                          alt={artist.artistName}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    )}
                    <CardHeader className="pb-2 sm:pb-3">
                      <CardTitle className="text-base sm:text-lg line-clamp-1">{artist.artistName}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm line-clamp-1">
                        {Array.isArray(artist.genre) && artist.genre.length > 0 
                          ? artist.genre.join(", ") 
                          : "Various Genres"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col pb-3 sm:pb-4">
                      <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm flex-1">
                        {artist.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="line-clamp-1">{artist.location}</span>
                          </div>
                        )}
                        {artist.feeRangeMin && artist.feeRangeMax && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="line-clamp-1">${artist.feeRangeMin} - ${artist.feeRangeMax}</span>
                          </div>
                        )}
                        {artist.bio && (
                          <p className="text-muted-foreground line-clamp-2 mt-1 sm:mt-2 text-xs sm:text-sm">
                            {artist.bio}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 mt-3 sm:mt-4">
                        <FavoriteButton artistId={artist.id} size="sm" showText={false} />
                        <Button 
                          className="flex-1 text-xs sm:text-sm h-8 sm:h-9" 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(`/artist/${artist.id}`);
                          }}
                        >
                          View Profile
                        </Button>
                        {isAuthenticated && user?.role === 'venue' && (
                          <Button
                            size="sm"
                            className="text-xs sm:text-sm h-8 sm:h-9 gap-1"
                            onClick={(e) => {
                              e.preventDefault();
                              handleBookClick(artist.id);
                            }}
                          >
                            <Calendar className="h-3 w-3" />
                            <span className="hidden sm:inline">Book</span>
                          </Button>
                        )}
                        {!isAuthenticated && (
                          <Button
                            size="sm"
                            className="text-xs sm:text-sm h-8 sm:h-9 gap-1"
                            onClick={(e) => {
                              e.preventDefault();
                              handleBookClick(artist.id);
                            }}
                          >
                            <Calendar className="h-3 w-3" />
                            <span className="hidden sm:inline">Book</span>
                          </Button>
                        )}
                        {isAuthenticated && user?.role !== 'artist' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs sm:text-sm h-8 sm:h-9 gap-1"
                            onClick={(e) => {
                              e.preventDefault();
                              handleMessageClick(artist.id);
                            }}
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span className="hidden sm:inline">Message</span>
                          </Button>
                        )}
                        {!isAuthenticated && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs sm:text-sm h-8 sm:h-9 gap-1"
                            onClick={(e) => {
                              e.preventDefault();
                              handleMessageClick(artist.id);
                            }}
                          >
                            <MessageSquare className="h-3 w-3" />
                            <span className="hidden sm:inline">Message</span>
                          </Button>
                        )}
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
