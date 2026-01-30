import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search, MapPin, DollarSign } from "lucide-react";
import { SearchFilters } from "@/components/SearchFilters";
import { FavoriteButton } from "@/components/FavoriteButton";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<{
    location?: string;
    minFee?: number;
    maxFee?: number;
    availableFrom?: string;
    availableTo?: string;
  }>({});
  
  const { data: artists, isLoading } = trpc.artist.search.useQuery(filters);

  const filteredArtists = artists?.filter(artist => {
    const matchesSearch = searchQuery === "" || 
      artist.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(artist.genre) && artist.genre.some(g => 
        g.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile Optimized */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 sm:gap-2 text-lg sm:text-2xl font-bold text-primary">
            <img src="/logo-icon.png" alt="Ologywood" className="h-6 sm:h-8 w-6 sm:w-8 rounded" />
            <span className="hidden sm:inline">Ologywood</span>
            <span className="sm:hidden">OW</span>
          </Link>
          
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">← Back</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Title - Mobile Optimized */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-8">Browse Artists</h1>
        
        {/* Search and Filters - Mobile Optimized */}
        <div className="mb-6 sm:mb-8 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-3 sm:gap-6">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 sm:h-5 w-4 sm:w-5" />
              <Input
                type="text"
                placeholder="Search by artist name or genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-sm sm:text-base py-2 sm:py-3"
              />
            </div>
          </div>
          
          <div>
            <SearchFilters onFilterChange={setFilters} />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading artists...
          </div>
        ) : filteredArtists && filteredArtists.length > 0 ? (
          <>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              Showing {filteredArtists.length} {filteredArtists.length === 1 ? 'artist' : 'artists'}
            </p>
            
            {/* Artist Grid - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredArtists.map((artist) => (
                <Link key={artist.id} href={`/artist/${artist.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
                    <CardHeader className="pb-3 sm:pb-4">
                      {artist.profilePhotoUrl ? (
                        <img 
                          src={artist.profilePhotoUrl} 
                          alt={artist.artistName}
                          className="w-full h-32 sm:h-40 md:h-48 object-cover rounded-md mb-3 sm:mb-4"
                        />
                      ) : (
                        <div className="w-full h-32 sm:h-40 md:h-48 bg-muted rounded-md mb-3 sm:mb-4 flex items-center justify-center">
                          <Music className="h-10 sm:h-12 md:h-16 w-10 sm:w-12 md:w-16 text-muted-foreground" />
                        </div>
                      )}
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
                        <Button className="flex-1" variant="outline" size="sm" className="text-xs sm:text-sm h-8 sm:h-9">
                          View Profile
                        </Button>
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
    </div>
  );
}
