import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Search, MapPin, DollarSign } from "lucide-react";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  
  const { data: artists, isLoading } = trpc.artist.getAll.useQuery();

  const filteredArtists = artists?.filter(artist => {
    const matchesSearch = searchQuery === "" || 
      artist.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(artist.genre) && artist.genre.some(g => 
        g.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    const matchesLocation = locationFilter === "" || 
      artist.location?.toLowerCase().includes(locationFilter.toLowerCase());
    
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <a className="flex items-center gap-2 text-2xl font-bold text-primary">
              <Music className="h-8 w-8" />
              Ologywood
            </a>
          </Link>
          
          <Link href="/">
            <a>
              <Button variant="ghost">Back to Home</Button>
            </a>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Browse Artists</h1>
        
        {/* Filters */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Search by name or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              type="text"
              placeholder="Filter by location..."
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading artists...
          </div>
        ) : filteredArtists && filteredArtists.length > 0 ? (
          <>
            <p className="text-muted-foreground mb-6">
              Showing {filteredArtists.length} {filteredArtists.length === 1 ? 'artist' : 'artists'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArtists.map((artist) => (
                <Link key={artist.id} href={`/artist/${artist.id}`}>
                  <a>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        {artist.profilePhotoUrl ? (
                          <img 
                            src={artist.profilePhotoUrl} 
                            alt={artist.artistName}
                            className="w-full h-48 object-cover rounded-md mb-4"
                          />
                        ) : (
                          <div className="w-full h-48 bg-muted rounded-md mb-4 flex items-center justify-center">
                            <Music className="h-16 w-16 text-muted-foreground" />
                          </div>
                        )}
                        <CardTitle>{artist.artistName}</CardTitle>
                        <CardDescription>
                          {Array.isArray(artist.genre) && artist.genre.length > 0 
                            ? artist.genre.join(", ") 
                            : "Various Genres"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          {artist.location && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{artist.location}</span>
                            </div>
                          )}
                          {artist.feeRangeMin && artist.feeRangeMax && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <DollarSign className="h-4 w-4" />
                              <span>${artist.feeRangeMin} - ${artist.feeRangeMax}</span>
                            </div>
                          )}
                          {artist.bio && (
                            <p className="text-muted-foreground line-clamp-2 mt-2">
                              {artist.bio}
                            </p>
                          )}
                        </div>
                        <Button className="w-full mt-4" variant="outline">
                          View Profile
                        </Button>
                      </CardContent>
                    </Card>
                  </a>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              No artists found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
