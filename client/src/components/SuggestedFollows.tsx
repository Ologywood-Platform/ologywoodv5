import React, { useState, useEffect } from 'react';
import { Heart, Plus, X } from 'lucide-react';

interface SuggestedArtist {
  id: number;
  name: string;
  genre: string[];
  location: string;
  image: string;
  rating: number;
  followers: number;
  isFollowing?: boolean;
}

export const SuggestedFollows: React.FC = () => {
  const [suggestedArtists, setSuggestedArtists] = useState<SuggestedArtist[]>([
    {
      id: 1,
      name: 'Luna Echo',
      genre: ['Indie Pop', 'Electronic'],
      location: 'Los Angeles, CA',
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      rating: 4.8,
      followers: 342,
      isFollowing: false,
    },
    {
      id: 2,
      name: 'The Velvet Collective',
      genre: ['Jazz', 'Soul'],
      location: 'New York, NY',
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop',
      rating: 4.9,
      followers: 521,
      isFollowing: false,
    },
    {
      id: 3,
      name: 'DJ Sonic Wave',
      genre: ['Electronic', 'House'],
      location: 'Miami, FL',
      image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
      rating: 4.7,
      followers: 289,
      isFollowing: false,
    },
    {
      id: 4,
      name: 'The Harmony Band',
      genre: ['Rock', 'Alternative'],
      location: 'Seattle, WA',
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
      rating: 4.6,
      followers: 198,
      isFollowing: false,
    },
  ]);

  const handleFollow = (id: number) => {
    setSuggestedArtists(suggestedArtists.map(artist =>
      artist.id === id
        ? { ...artist, isFollowing: !artist.isFollowing, followers: artist.isFollowing ? artist.followers - 1 : artist.followers + 1 }
        : artist
    ));
  };

  const handleDismiss = (id: number) => {
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
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
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
                <div className="flex flex-wrap gap-1 mt-2 mb-3">
                  {artist.genre.slice(0, 2).map((g, idx) => (
                    <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {g}
                    </span>
                  ))}
                </div>

                {/* Location */}
                <p className="text-xs text-gray-500 mb-3">📍 {artist.location}</p>

                {/* Rating & Followers */}
                <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                  <span>⭐ {artist.rating}</span>
                  <span>{artist.followers} followers</span>
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
