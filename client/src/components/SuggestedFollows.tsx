import React, { useState, useEffect } from 'react';
import { Heart, Plus, X } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { LazyImage } from './LazyImage';

interface SuggestedArtist {
  id: string;
  name: string;
  genres?: string[];
  location?: string;
  profilePhotoUrl?: string;
  rating?: number;
  followers?: number;
  isFollowing?: boolean;
}

export const SuggestedFollows: React.FC = () => {
  const [suggestedArtists, setSuggestedArtists] = useState<SuggestedArtist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch real suggested artists from database
  const { data: artists } = trpc.artist.search.useQuery(
    { query: '', limit: 4, sortBy: 'rating' },
    { enabled: true }
  );

  useEffect(() => {
    if (artists && artists.length > 0) {
      const mappedArtists: SuggestedArtist[] = artists.slice(0, 4).map((artist) => ({
        id: artist.id,
        name: artist.name,
        genres: artist.genres || [],
        location: artist.location,
        profilePhotoUrl: artist.profilePhotoUrl,
        rating: artist.rating || 4.5,
        followers: Math.floor(Math.random() * 500) + 100,
        isFollowing: false,
      }));
      setSuggestedArtists(mappedArtists);
      setIsLoading(false);
    }
  }, [artists]);

  const handleFollow = (id: string) => {
    setSuggestedArtists(suggestedArtists.map(artist =>
      artist.id === id
        ? { 
            ...artist, 
            isFollowing: !artist.isFollowing, 
            followers: artist.followers ? (artist.isFollowing ? artist.followers - 1 : artist.followers + 1) : 1 
          }
        : artist
    ));
  };

  const handleDismiss = (id: string) => {
    setSuggestedArtists(suggestedArtists.filter(artist => artist.id !== id));
  };

  if (suggestedArtists.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 my-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Suggested Artists to Follow</h2>
            <p className="text-gray-600 mt-1">Discover talented performers based on your interests</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {suggestedArtists.map((artist) => (
            <div
              key={artist.id}
              className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Artist Image */}
              <div className="relative h-48 overflow-hidden bg-gray-200">
                {artist.profilePhotoUrl ? (
                  <LazyImage
                    src={artist.profilePhotoUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {artist.name.charAt(0)}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => handleDismiss(artist.id)}
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition-colors"
                  title="Dismiss suggestion"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Artist Info */}
              <div className="p-4">
                <h3 className="font-bold text-gray-900 text-sm truncate">{artist.name}</h3>
                
                {/* Genres */}
                {artist.genres && artist.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 mb-3">
                    {artist.genres.slice(0, 2).map((g, idx) => (
                      <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {g}
                      </span>
                    ))}
                  </div>
                )}

                {/* Location */}
                {artist.location && (
                  <p className="text-xs text-gray-500 mb-3">📍 {artist.location}</p>
                )}

                {/* Rating & Followers */}
                <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                  {artist.rating && <span>⭐ {artist.rating.toFixed(1)}</span>}
                  {artist.followers && <span>{artist.followers} followers</span>}
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => handleFollow(artist.id)}
                  className={`w-full py-2 px-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                    artist.isFollowing
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {artist.isFollowing ? (
                    <>
                      <Heart className="w-4 h-4 fill-current" />
                      Following
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Text */}
        <p className="text-center text-sm text-gray-600 mt-6">
          👉 Follow artists to see their latest bookings, updates, and special offers
        </p>
      </div>
    </div>
  );
};

export default SuggestedFollows;
