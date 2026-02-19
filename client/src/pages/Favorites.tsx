import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, DollarSign, Music, Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface FavoriteArtist {
  id: number;
  artistName: string;
  genre: string[] | null;
  location: string | null;
  feeRangeMin: number | null;
  feeRangeMax: number | null;
  profilePhotoUrl: string | null;
  bio: string | null;
  userId: number;
}

export default function Favorites() {
  const [, navigate] = useLocation();
  const [favorites, setFavorites] = useState<FavoriteArtist[]>([]);
  const [isVenue, setIsVenue] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  // Get current user info
  // const { data: user } = trpc.auth.me.useQuery();
  const user = null; // TODO: Fix TRPC query issues

  // Remove favorite mutation
  const removeMutation = trpc.favorite.remove.useMutation();

  useEffect(() => {
    // TODO: Fix TRPC query issues - for now show placeholder
    setIsVenue(false);
    setIsLoading(false);
  }, []);

  const fetchFavorites = async () => {
    setIsLoadingFavorites(true);
    try {
      // TODO: Replace with proper TRPC query once backend is fixed
      // For now, this is a placeholder that shows the UI structure
      setFavorites([]);
    } catch (error) {
      toast.error("Failed to load favorites");
    } finally {
      setIsLoadingFavorites(false);
    }
  };

  const handleRemoveFavorite = async (artistId: number) => {
    try {
      await removeMutation.mutateAsync({ artistId });
      setFavorites(favorites.filter(f => f.userId !== artistId));
      toast.success("Artist removed from following");
    } catch (error) {
      toast.error("Failed to remove artist");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Non-venue users see this message
  if (isVenue === false) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Heart className="w-16 h-16 text-purple-600 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Following</h1>
          <p className="text-gray-600 mb-8">
            As an artist, you can follow other artists for inspiration and collaboration.
          </p>
          <Button 
            onClick={() => navigate("/artists")}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Browse Artists
          </Button>
        </div>
      </div>
    );
  }

  // Venues see their favorite artists
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Following</h1>
          <p className="text-gray-600">
            {favorites.length} artist{favorites.length !== 1 ? 's' : ''} saved
          </p>
        </div>

        {isLoadingFavorites ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No artists saved yet</h2>
            <p className="text-gray-600 mb-6">
              Start exploring and save your favorite artists to view them here.
            </p>
            <Button 
              onClick={() => navigate("/artists")}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              Browse Artists
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((artist) => (
              <Card key={artist.userId} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {artist.profilePhotoUrl && (
                    <img
                      src={artist.profilePhotoUrl}
                      alt={artist.artistName}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {artist.artistName}
                  </h3>

                  {artist.genre && artist.genre.length > 0 && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                      <Music className="w-4 h-4" />
                      <span>{artist.genre.join(", ")}</span>
                    </div>
                  )}

                  {artist.location && (
                    <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{artist.location}</span>
                    </div>
                  )}

                  {(artist.feeRangeMin || artist.feeRangeMax) && (
                    <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>
                        ${artist.feeRangeMin || 0} - ${artist.feeRangeMax || "TBD"}
                      </span>
                    </div>
                  )}

                  {artist.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {artist.bio}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate(`/artist/${artist.userId}`)}
                    >
                      View Profile
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFavorite(artist.userId)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
