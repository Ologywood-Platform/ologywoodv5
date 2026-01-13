import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

interface FavoriteButtonProps {
  artistId: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function FavoriteButton({ 
  artistId, 
  variant = 'outline', 
  size = 'default',
  showText = true 
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  // Only venues can favorite
  const isVenue = user?.role === 'venue';
  
  const { data: isFavorited, isLoading } = trpc.favorite.isFavorited.useQuery(
    { artistId },
    { enabled: isVenue }
  );
  
  const addMutation = trpc.favorite.add.useMutation({
    onSuccess: () => {
      toast.success('Artist added to favorites');
      utils.favorite.isFavorited.invalidate({ artistId });
      utils.favorite.getMyFavorites.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add favorite');
    },
  });
  
  const removeMutation = trpc.favorite.remove.useMutation({
    onSuccess: () => {
      toast.success('Artist removed from favorites');
      utils.favorite.isFavorited.invalidate({ artistId });
      utils.favorite.getMyFavorites.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove favorite');
    },
  });
  
  const handleToggle = () => {
    if (!isVenue) {
      toast.error('Only venues can favorite artists');
      return;
    }
    
    if (isFavorited) {
      removeMutation.mutate({ artistId });
    } else {
      addMutation.mutate({ artistId });
    }
  };
  
  if (!isVenue) {
    return null;
  }
  
  const isProcessing = addMutation.isPending || removeMutation.isPending;
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggle}
      disabled={isLoading || isProcessing}
      className={isFavorited ? 'text-red-500 hover:text-red-600' : ''}
    >
      <Heart 
        className={`h-4 w-4 ${showText ? 'mr-2' : ''} ${isFavorited ? 'fill-current' : ''}`} 
      />
      {showText && (isFavorited ? 'Saved' : 'Save')}
    </Button>
  );
}
