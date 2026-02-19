import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MapPin, DollarSign, Music, Trash2, ArrowLeft } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

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
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Only venues can have favorites
  const isVenue = user?.role === 'venue';

  // Fetch user's favorites (only if venue)
  const { data: userFavorites, isLoading } = trpc.favorite.getMyFavorites.useQuery(undefined, {
    enabled: isVenue
  });

  useEffect(() => {
    if (userFavorites) {
      setFavorites(userFavorites);
      setLoading(false);
    }
  }, [userFavorites]);

  const handleRemoveFavorite = async (artistId: number) => {
    try {
      // Call API to remove favorite
      setFavorites(favorites.filter(f => f.id !== artistId));
    } catch (err) {
      setError("Failed to remove favorite");
    }
  };

  const handleViewArtist = (artistId: number) => {
    navigate(`/artist/${artistId}`);
  };

  // Show message if user is not a venue
  if (!isVenue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Favorites Not Available</CardTitle>
            <CardDescription>Only venues can save favorite artists.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600 mb-4">
              If you're a venue organizer, please switch to your venue account to access favorites.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-500 fill-red-500" />
            My Favorites
          </h1>
          <p className="text-gray-600 mt-2">
            {favorites.length === 0
              ? "You haven't saved any favorite artists yet"
              : `You have ${favorites.length} favorite artist${favorites.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {favorites.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Favorites Yet</h3>
              <p className="text-gray-600 mb-6">
                Start exploring and save your favorite artists to book them later.
              </p>
              <Button onClick={() => navigate('/browse')}>
                Browse Artists
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Favorites Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((artist) => (
              <Card key={artist.id} className="hover:shadow-lg transition-shadow">
                {artist.profilePhotoUrl && (
                  <div className="w-full h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={artist.profilePhotoUrl}
                      alt={artist.artistName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{artist.artistName}</CardTitle>
                  {artist.genre && artist.genre.length > 0 && (
                    <CardDescription>{artist.genre.join(", ")}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {artist.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">{artist.bio}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    {artist.location && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{artist.location}</span>
                      </div>
                    )}
                    {artist.feeRangeMin && artist.feeRangeMax && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <DollarSign className="w-4 h-4" />
                        <span>${artist.feeRangeMin} - ${artist.feeRangeMax}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleViewArtist(artist.id)}
                    >
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveFavorite(artist.id)}
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
