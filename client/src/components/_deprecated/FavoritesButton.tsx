import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface FavoritesButtonProps {
  itemId: number;
  itemType: 'artist' | 'venue';
  itemName: string;
  onFavoriteChange?: (isFavorited: boolean) => void;
}

export function FavoritesButton({
  itemId,
  itemType,
  itemName,
  onFavoriteChange,
}: FavoritesButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    const key = `favorites_${itemType}`;
    const favorites = JSON.parse(localStorage.getItem(key) || '[]');
    setIsFavorited(favorites.includes(itemId));
  }, [itemId, itemType]);

  const handleToggleFavorite = async () => {
    setIsLoading(true);
    try {
      const key = `favorites_${itemType}`;
      const favorites = JSON.parse(localStorage.getItem(key) || '[]');

      if (isFavorited) {
        // Remove from favorites
        const updated = favorites.filter((id: number) => id !== itemId);
        localStorage.setItem(key, JSON.stringify(updated));
        setIsFavorited(false);
        toast.success(`Removed ${itemName} from favorites`);
      } else {
        // Add to favorites
        if (!favorites.includes(itemId)) {
          favorites.push(itemId);
        }
        localStorage.setItem(key, JSON.stringify(favorites));
        setIsFavorited(true);
        toast.success(`Added ${itemName} to favorites`);
      }

      onFavoriteChange?.(!isFavorited);
    } catch (error) {
      toast.error('Failed to update favorites');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className="gap-2"
    >
      <Heart
        className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
      />
      {isFavorited ? 'Favorited' : 'Favorite'}
    </Button>
  );
}
