import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Heart, MapPin, Music } from 'lucide-react';
import { Link } from 'wouter';
import { RatingBadge } from './RatingDisplay';

interface FavoriteItem {
  id: number;
  name: string;
  location: string;
  type: 'artist' | 'venue';
  image?: string;
  rating?: number;
  reviewCount?: number;
}

export function FavoritesTab() {
  const [favoriteArtists, setFavoriteArtists] = useState<FavoriteItem[]>([]);
  const [favoriteVenues, setFavoriteVenues] = useState<FavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState<'artists' | 'venues'>('artists');

  useEffect(() => {
    // Load favorites from localStorage
    const artistIds = JSON.parse(localStorage.getItem('favorites_artist') || '[]');
    const venueIds = JSON.parse(localStorage.getItem('favorites_venue') || '[]');

    // In a real app, fetch the actual data from the API
    // For now, we'll show a placeholder
    setFavoriteArtists(
      artistIds.map((id: number) => ({
        id,
        name: `Artist ${id}`,
        location: 'City, State',
        type: 'artist' as const,
        rating: 4.5,
        reviewCount: 12,
      }))
    );

    setFavoriteVenues(
      venueIds.map((id: number) => ({
        id,
        name: `Venue ${id}`,
        location: 'City, State',
        type: 'venue' as const,
        rating: 4.8,
        reviewCount: 8,
      }))
    );
  }, []);

  const handleRemoveFavorite = (id: number, type: 'artist' | 'venue') => {
    const key = `favorites_${type}`;
    const favorites = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = favorites.filter((fid: number) => fid !== id);
    localStorage.setItem(key, JSON.stringify(updated));

    if (type === 'artist') {
      setFavoriteArtists(favoriteArtists.filter(item => item.id !== id));
    } else {
      setFavoriteVenues(favoriteVenues.filter(item => item.id !== id));
    }
  };

  const items = activeTab === 'artists' ? favoriteArtists : favoriteVenues;
  const emptyMessage =
    activeTab === 'artists'
      ? 'No favorite artists yet. Browse and add your favorites!'
      : 'No favorite venues yet. Browse and add your favorites!';

  return (
    <div className="space-y-6">
      {/* Tab Selector */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === 'artists' ? 'default' : 'outline'}
          onClick={() => setActiveTab('artists')}
          className="gap-2"
        >
          <Music className="h-4 w-4" />
          Favorite Artists ({favoriteArtists.length})
        </Button>
        <Button
          variant={activeTab === 'venues' ? 'default' : 'outline'}
          onClick={() => setActiveTab('venues')}
          className="gap-2"
        >
          <MapPin className="h-4 w-4" />
          Favorite Venues ({favoriteVenues.length})
        </Button>
      </div>

      {/* Items Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {item.location}
                    </CardDescription>
                  </div>
                  <Heart className="h-5 w-5 fill-red-500 text-red-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Rating */}
                {item.rating && (
                  <RatingBadge
                    averageRating={item.rating}
                    totalReviews={item.reviewCount}
                  />
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Link href={`/${activeTab === 'artists' ? 'artist' : 'venue'}/${item.id}`}>
                    <Button variant="outline" className="flex-1" asChild>
                      <span>View Profile</span>
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFavorite(item.id, activeTab === 'artists' ? 'artist' : 'venue')}
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">{emptyMessage}</p>
            <Link href="/browse">
              <Button asChild>
                <span>Browse {activeTab === 'artists' ? 'Artists' : 'Venues'}</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
