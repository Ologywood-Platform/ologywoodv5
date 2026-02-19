import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, MapPin, DollarSign, Music, Trash2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

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

  // Get current user info
  const { data: user, isLoading: userLoading } = trpc.auth.me.useQuery();

  // Fetch user's favorites - only for venues
  // TODO: Fix backend - getMyFavorites is defined as mutation, should be query
  // const { data: userFavorites, isLoading: favoritesLoading } = trpc.favorite.getMyFavorites.useQuery(
  //   undefined,
  //   { enabled: isVenue === true }
  // );
  const favoritesLoading = false;

  useEffect(() => {
    if (!userLoading && user) {
      const isVenueUser = user.userType === 'venue';
      setIsVenue(isVenueUser);
      
      // TODO: Fetch favorites when backend is fixed
      // if (isVenueUser && userFavorites) {
      //   setFavorites(userFavorites);
      // }
    }
  }, [user, userLoading]);

  const handleRemoveFavorite = (artistId: number) => {
    setFavorites(favorites.filter(f => f.id !== artistId));
  };

  const handleViewArtist = (artistId: number) => {
    navigate(`/artist/${artistId}`);
  };

  if (userLoading || isVenue === null || favoritesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Show message for non-venue users
  if (!isVenue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Favorites for Venues
              </h2>
              <p className="text-gray-600 mb-6">
                This feature is available for venue accounts. Artists can browse and book performers directly from their profiles.
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show loading for venue users fetching favorites
  if (favoritesLoading) {
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

                <div className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{artist.artistName}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                        <Music className="w-4 h-4" />
                        {Array.isArray(artist.genre) ? artist.genre.join(", ") : artist.genre}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(artist.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>

                  <div className="space-y-3">
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

                    {/* Action Button */}
                    <Button
                      onClick={() => handleViewArtist(artist.id)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 mt-2"
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
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
