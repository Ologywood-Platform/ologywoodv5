import { toSlug } from '@/lib/slugify';
/**
 * SuggestedFollows Component
 * 
 * Displays a grid of suggested artists to follow with real data:
 * - For logged-in users: personalized recommendations + remaining artists (excludes already-followed)
 * - For logged-out users: all artists as discovery
 * - Follow/Unfollow calls the real tRPC mutation
 * - Follower counts are real from the database
 * - Dismiss removes the card from view (client-side only)
 */
import { useState } from 'react';
import { Heart, Plus, X, Users } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { LazyImage } from './LazyImage';
import { toast } from 'sonner';
import { Link } from 'wouter';

interface SuggestedArtistData {
  id: number;
  userId: number;
  artistName: string;
  genres: string[];
  location: string | null;
  profilePhotoUrl: string | null;
  followerCount: number;
  isRecommended: boolean;
}

export const SuggestedFollows: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const utils = trpc.useUtils();

  // Fetch suggested artists from the new enriched endpoint
  const { data: suggestedArtists, isLoading } = trpc.follows.getSuggestedArtists.useQuery(
    { limit: 8 },
    { staleTime: 60_000 }
  );

  // Follow mutation
  const followMutation = trpc.follows.follow.useMutation({
    onSuccess: (_data, variables) => {
      toast.success('Following! You\'ll get updates about their events.');
      // Invalidate relevant queries
      utils.follows.getSuggestedArtists.invalidate();
      utils.follows.isFollowing.invalidate({ followingId: variables.followingId });
      utils.follows.getStats.invalidate({ userId: variables.followingId });
      utils.follows.getFollowing.invalidate();
    },
    onError: (error) => {
      if (error.message?.includes('Already following')) {
        toast.info('You\'re already following this artist');
      } else {
        toast.error(error.message || 'Failed to follow');
      }
    },
  });

  // Unfollow mutation
  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: (_data, variables) => {
      toast.success('Unfollowed');
      utils.follows.getSuggestedArtists.invalidate();
      utils.follows.isFollowing.invalidate({ followingId: variables.followingId });
      utils.follows.getStats.invalidate({ userId: variables.followingId });
      utils.follows.getFollowing.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to unfollow');
    },
  });

  const handleFollow = (artist: SuggestedArtistData) => {
    if (!isAuthenticated) {
      toast.info('Sign in to follow artists and get updates');
      return;
    }
    followMutation.mutate({
      followingId: artist.userId,
      followingType: 'artist',
    });
  };

  const handleDismiss = (artistId: number) => {
    setDismissedIds(prev => new Set(prev).add(artistId));
  };

  // Filter out dismissed artists
  const visibleArtists = (suggestedArtists || [])
    .filter((a: SuggestedArtistData) => !dismissedIds.has(a.id));

  if (isLoading) {
    return (
      <div className="w-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-6 my-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground mb-2">Suggested Artists to Follow</h2>
          <p className="text-muted-foreground mb-6">Discover talented performers based on your interests</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-background rounded-lg h-72 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (visibleArtists.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg p-6 my-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Suggested Artists to Follow</h2>
            <p className="text-muted-foreground mt-1">Discover talented performers based on your interests</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleArtists.slice(0, 4).map((artist: SuggestedArtistData) => (
            <div
              key={artist.id}
              className="bg-background rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
              {/* Artist Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                <Link href={`/artist/${toSlug(artist.name || '')}`}>
                  {artist.profilePhotoUrl ? (
                    <LazyImage
                      src={artist.profilePhotoUrl}
                      alt={artist.artistName}
                      className="w-full h-full object-cover cursor-pointer"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center cursor-pointer">
                      <span className="text-white text-4xl font-bold">
                        {artist.artistName.charAt(0)}
                      </span>
                    </div>
                  )}
                </Link>
                <button
                  onClick={() => handleDismiss(artist.id)}
                  className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-md hover:bg-background transition-colors"
                  title="Dismiss suggestion"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
                {artist.isRecommended && (
                  <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
              </div>

              {/* Artist Info */}
              <div className="p-4">
                <Link href={`/artist/${toSlug(artist.name || '')}`}>
                  <h3 className="font-bold text-foreground text-sm truncate hover:text-primary cursor-pointer">
                    {artist.artistName}
                  </h3>
                </Link>
                
                {/* Genres */}
                {artist.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 mb-3">
                    {artist.genres
                      .filter(g => g && typeof g === 'string')
                      .slice(0, 2)
                      .map((g, idx) => (
                        <span key={`${artist.id}-genre-${idx}`} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                          {g}
                        </span>
                      ))}
                  </div>
                )}

                {/* Location */}
                {artist.location && (
                  <p className="text-xs text-muted-foreground mb-3 truncate">📍 {artist.location}</p>
                )}

                {/* Follower Count */}
                <div className="flex items-center text-xs text-muted-foreground mb-4">
                  <Users className="w-3 h-3 mr-1" />
                  <span>{artist.followerCount} {artist.followerCount === 1 ? 'follower' : 'followers'}</span>
                </div>

                {/* Follow Button */}
                <button
                  onClick={() => handleFollow(artist)}
                  disabled={followMutation.isPending}
                  className="w-full py-2 px-3 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Follow</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Info Text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Follow artists to see their latest bookings, updates, and special offers
        </p>
      </div>
    </div>
  );
};

export default SuggestedFollows;
