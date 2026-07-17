import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Music, Building2, Search, UserMinus, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

type FilterTab = 'all' | 'artists' | 'venues';

export function FollowsManagement() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmUnfollow, setConfirmUnfollow] = useState<{ id: number; type: 'artist' | 'venue'; name: string } | null>(null);

  const { data: following, isLoading } = trpc.follows.getFollowing.useQuery({
    userId: user?.id || 0,
    limit: 200,
    offset: 0,
  }, { enabled: !!user?.id });

  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => {
      utils.follows.getFollowing.invalidate();
      toast.success('Unfollowed successfully');
      setConfirmUnfollow(null);
    },
    onError: () => {
      toast.error('Failed to unfollow');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  const allFollowed = following || [];
  const artists = allFollowed.filter((f: any) => f.followingType === 'artist');
  const venues = allFollowed.filter((f: any) => f.followingType === 'venue');

  const displayed = activeTab === 'artists' ? artists : activeTab === 'venues' ? venues : allFollowed;

  const filtered = searchQuery.trim()
    ? displayed.filter((f: any) => (f.name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : displayed;

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: allFollowed.length },
    { key: 'artists', label: 'Artists', count: artists.length },
    { key: 'venues', label: 'Venues', count: venues.length },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
              activeTab === tab.key
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={`Search ${activeTab === 'artists' ? 'artists' : activeTab === 'venues' ? 'venues' : 'followed'}...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Helper note */}
      <p className="text-xs text-slate-500">
        Manage the artists and venues you follow. Unfollowing will stop email updates and notifications from them.
      </p>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            {activeTab === 'venues' ? <Building2 className="w-6 h-6 text-gray-400" /> : <Music className="w-6 h-6 text-gray-400" />}
          </div>
          <p className="text-gray-500 text-sm">
            {searchQuery ? `No results for "${searchQuery}"` : `You haven't followed any ${activeTab === 'all' ? 'artists or venues' : activeTab} yet.`}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => navigate('/browse')}
          >
            Browse & Discover
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item: any) => (
            <Card key={`${item.followingType}-${item.id}`} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.profilePhotoUrl ? (
                      <img
                        src={item.profilePhotoUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        item.followingType === 'venue'
                          ? 'bg-gradient-to-br from-blue-500 to-teal-500'
                          : 'bg-gradient-to-br from-purple-500 to-cyan-500'
                      }`}>
                        <span className="text-white font-bold text-sm">
                          {(item.name || '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                          {item.name}
                        </h4>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          item.followingType === 'venue'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        }`}>
                          {item.followingType === 'venue' ? 'Venue' : 'Artist'}
                        </span>
                      </div>
                      {item.nextEvent && (
                        <p className="text-xs text-purple-600 dark:text-purple-400 truncate">
                          Next: {item.nextEvent.title}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0"
                      onClick={() => navigate(item.followingType === 'venue' ? `/venue/${item.profileId || item.id}` : `/artist/${item.profileId || item.id}`)}
                      title="View Profile"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => setConfirmUnfollow({ id: item.id, type: item.followingType, name: item.name })}
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

      {/* Unfollow Confirmation Dialog */}
      {confirmUnfollow && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setConfirmUnfollow(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 mx-4 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Unfollow {confirmUnfollow.name}?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              You will no longer receive email updates or notifications about their events and activity.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmUnfollow(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => unfollowMutation.mutate({ followingId: confirmUnfollow.id, followingType: confirmUnfollow.type })}
                disabled={unfollowMutation.isPending}
              >
                {unfollowMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Unfollow'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
