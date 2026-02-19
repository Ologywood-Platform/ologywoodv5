import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, MapPin, DollarSign, Music, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
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
  const [favorites, setFavorites] = useState<FavoriteArtist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's favorites
  const { data: userFavorites, isLoading } = trpc.favorite.getMyFavorites.useQuery();

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
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Favorites Yet
              </h2>
              <p className="text-gray-600 mb-6">
                Start exploring artists and save your favorites to keep track of performers you love.
              </p>
              <Button
                onClick={() => navigate("/browse")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Browse Artists
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Favorites Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((artist) => (
              <Card key={artist.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {/* Artist Photo */}
                {artist.profilePhotoUrl && (
                  <div className="h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={artist.profilePhotoUrl}
                      alt={artist.artistName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{artist.artistName}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Music className="w-4 h-4" />
                        {Array.isArray(artist.genre) ? artist.genre.join(", ") : artist.genre}
                      </CardDescription>
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(artist.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {artist.location || "Location not specified"}
                  </div>

                  {/* Fee Range */}
                  {(artist.feeRangeMin || artist.feeRangeMax) && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      {artist.feeRangeMin && artist.feeRangeMax
                        ? `$${artist.feeRangeMin.toLocaleString()} - $${artist.feeRangeMax.toLocaleString()}`
                        : artist.feeRangeMin
                        ? `From $${artist.feeRangeMin.toLocaleString()}`
                        : `Up to $${artist.feeRangeMax?.toLocaleString()}`}
                    </div>
                  )}

                  {/* Bio */}
                  {artist.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">{artist.bio}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => handleViewArtist(artist.id)}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      View Profile
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-8">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
