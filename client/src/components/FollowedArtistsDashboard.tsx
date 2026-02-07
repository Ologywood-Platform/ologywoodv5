import React, { useState, useEffect } from 'react';
import { Heart, Calendar, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

interface FollowedArtist {
  id: number;
  artistName: string;
  genre: string[];
  location: string;
  rating: number;
  feeRangeMin?: number;
  feeRangeMax?: number;
  profilePhotoUrl?: string;
  upcomingAvailability?: string[];
}

export const FollowedArtistsDashboard: React.FC = () => {
  const [followedArtists, setFollowedArtists] = useState<FollowedArtist[]>([
    {
      id: 1,
      artistName: 'Luna Echo',
      genre: ['Indie Pop', 'Electronic'],
      location: 'Los Angeles, CA',
      rating: 4.8,
      feeRangeMin: 1500,
      feeRangeMax: 3500,
      profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
      upcomingAvailability: ['2026-02-14', '2026-02-21', '2026-03-07'],
    },
    {
      id: 2,
      artistName: 'The Velvet Collective',
      genre: ['Jazz', 'Soul'],
      location: 'New York, NY',
      rating: 4.9,
      feeRangeMin: 2000,
      feeRangeMax: 5000,
      profilePhotoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop',
      upcomingAvailability: ['2026-02-20', '2026-03-05'],
    },
  ]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load followed artists from backend
    // const loadFollowedArtists = async () => {
    //   setLoading(true);
    //   try {
    //     const response = await trpc.follows.getFollowedArtists.query();
    //     // Process and set artists
    //   } catch (error) {
    //     console.error('Failed to load followed artists:', error);
    //   } finally {
    //     setLoading(false);
    //   }
    // };
    // loadFollowedArtists();
  }, []);

  if (followedArtists.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Followed Artists Yet</h3>
        <p className="text-gray-500 mb-6">Start following artists to see their availability and get quick booking access</p>
        <Link href="/browse">
          <Button>Browse Artists</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Following ({followedArtists.length})</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {followedArtists.map((artist) => (
          <div key={artist.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
            {/* Artist Image - Optimized for face visibility */}
            <div className="relative h-48 bg-gray-200 overflow-hidden">
              {artist.profilePhotoUrl ? (
                <img
                  src={artist.profilePhotoUrl}
                  alt={artist.artistName}
                  className="w-full h-full object-cover object-top group-hover:scale-110 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 to-blue-500 flex-col gap-2">
                  <Heart className="w-12 h-12 text-white" />
                  <span className="text-white text-xs font-medium">No photo</span>
                </div>
              )}
            </div>

            {/* Artist Info */}
            <div className="p-4">
              <h3 className="font-bold text-lg text-gray-900 mb-1">{artist.artistName}</h3>

              {/* Genres */}
              <div className="flex flex-wrap gap-1 mb-3">
                {artist.genre.slice(0, 2).map((g, idx) => (
                  <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    {g}
                  </span>
                ))}
              </div>

              {/* Location & Rating */}
              <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                <span>📍 {artist.location}</span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {artist.rating}
                </span>
              </div>

              {/* Price Range */}
              {artist.feeRangeMin && artist.feeRangeMax && (
                <p className="text-sm font-semibold text-purple-600 mb-3">
                  💰 ${artist.feeRangeMin.toLocaleString()} - ${artist.feeRangeMax.toLocaleString()}
                </p>
              )}

              {/* Upcoming Availability */}
              {artist.upcomingAvailability && artist.upcomingAvailability.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-xs font-semibold text-green-700 mb-2">📅 Available Dates:</p>
                  <div className="space-y-1">
                    {artist.upcomingAvailability.slice(0, 3).map((date, idx) => (
                      <p key={idx} className="text-xs text-green-600">
                        {new Date(date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Link href={`/artist/${artist.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                  </Button>
                </Link>
                <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                  <Calendar className="w-4 h-4 mr-1" />
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowedArtistsDashboard;
