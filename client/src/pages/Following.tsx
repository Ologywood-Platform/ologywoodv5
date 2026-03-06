import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Music, MapPin, ExternalLink, UserMinus, Loader2, Users, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { QuickSignupModal } from '@/components/QuickSignupModal';
import SiteHeader from '@/components/SiteHeader';
import { SuggestedFollows } from '@/components/SuggestedFollows';
import Footer from '@/components/Footer';

export default function Following() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('login');

  // If not logged in, show sign-up prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Follow Your Favorite Artists</h1>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Sign up to follow artists and get notified about their new events, profile updates, and more.
          </p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => { setAuthTab('login'); setShowAuthModal(true); }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              onClick={() => { setAuthTab('signup'); setShowAuthModal(true); }}
            >
              Create Account
            </Button>
          </div>
        </div>
        </div>
        <QuickSignupModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultTab={authTab}
          actionType="general"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
      <FollowingList userId={user.id} />
    </div>
  );
}

function FollowingList({ userId }: { userId: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();

  const { data: following, isLoading } = trpc.follows.getFollowing.useQuery({
    userId,
    limit: 100,
    offset: 0,
  });

  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => {
      utils.follows.getFollowing.invalidate();
      toast.success('Unfollowed successfully');
    },
    onError: () => {
      toast.error('Failed to unfollow');
    },
  });

  const handleUnfollow = (followingId: number, followingType: 'artist' | 'venue') => {
    unfollowMutation.mutate({ followingId, followingType });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }

  const followedArtists = following?.filter((f: any) => f.followingType === 'artist') || [];
  const followedVenues = following?.filter((f: any) => f.followingType === 'venue') || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Following</h1>
        <p className="text-gray-600">
          Artists and venues you follow. You'll receive email updates when they post new events or update their profiles.
        </p>
      </div>

      {/* Artists Section */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Music className="w-5 h-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Artists ({followedArtists.length})
          </h2>
        </div>

        {followedArtists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No artists followed yet</h3>
              <p className="text-gray-500 mb-4">Discover and follow artists to get updates about their events.</p>
              <Button onClick={() => navigate('/browse')} className="bg-purple-600 hover:bg-purple-700">
                Browse Artists
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {followedArtists.map((artist: any) => (
              <Card key={artist.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {(artist.name || 'A').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{artist.name}</h3>
                        <p className="text-sm text-gray-500">
                          Followed {new Date(artist.followedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/artist/${artist.id}`)}
                        title="View Profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnfollow(artist.id, 'artist')}
                        disabled={unfollowMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Unfollow"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Discover More Artists */}
      <div className="mb-10">
        <SuggestedFollows />
      </div>

      {/* Venues Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-cyan-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Venues ({followedVenues.length})
          </h2>
        </div>

        {followedVenues.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No venues followed yet</h3>
              <p className="text-gray-500 mb-4">Follow venues to stay updated on their events and opportunities.</p>
              <Button onClick={() => navigate('/venues')} variant="outline">
                Browse Venues
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {followedVenues.map((venue: any) => (
              <Card key={venue.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-lg">
                          {(venue.name || 'V').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{venue.name}</h3>
                        <p className="text-sm text-gray-500">
                          Followed {new Date(venue.followedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/venue/${venue.id}`)}
                        title="View Profile"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnfollow(venue.id, 'venue')}
                        disabled={unfollowMutation.isPending}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Unfollow"
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
          <Footer />
    </div>
  );
}
