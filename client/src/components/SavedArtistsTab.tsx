import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, MapPin, DollarSign, Heart } from 'lucide-react';
import { Link } from 'wouter';
import { toast } from 'sonner';

export default function SavedArtistsTab() {
  const utils = trpc.useUtils();
  const { data: favorites, isLoading } = trpc.favorite.getMyFavorites.useQuery();
  
  const removeMutation = trpc.favorite.remove.useMutation({
    onSuccess: () => {
      toast.success('Artist removed from favorites');
      utils.favorite.getMyFavorites.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove favorite');
    },
  });
  
  const handleRemove = (artistId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeMutation.mutate({ artistId });
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading saved artists...
        </CardContent>
      </Card>
    );
  }
  
  if (!favorites || favorites.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saved Artists</CardTitle>
          <CardDescription>
            Artists you've bookmarked will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            You haven't saved any artists yet
          </p>
          <Link href="/browse">
            <Button>Browse Artists</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Saved Artists ({favorites.length})</CardTitle>
          <CardDescription>
            Artists you've bookmarked for future reference
          </CardDescription>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {favorites.map((artist) => (
          <Link key={artist.id} href={`/artist/${artist.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                {artist.profilePhotoUrl ? (
                  <img
                    src={artist.profilePhotoUrl}
                    alt={artist.artistName}
                    className="w-full h-48 object-cover rounded-md mb-4"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted rounded-md mb-4 flex items-center justify-center">
                    <Music className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                <CardTitle>{artist.artistName}</CardTitle>
                <CardDescription>
                  {Array.isArray(artist.genre) && artist.genre.length > 0
                    ? artist.genre.join(', ')
                    : 'Various Genres'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm mb-4">
                  {artist.location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{artist.location}</span>
                    </div>
                  )}
                  {artist.feeRangeMin && artist.feeRangeMax && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        ${artist.feeRangeMin} - ${artist.feeRangeMax}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => handleRemove(artist.id, e)}
                    disabled={removeMutation.isPending}
                  >
                    <Heart className="h-4 w-4 mr-2 fill-current text-red-500" />
                    Remove
                  </Button>
                  <Button size="sm" className="flex-1">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
