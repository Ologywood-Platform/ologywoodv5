import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { trpc } from '../lib/trpc';
import { useToastContext } from './ErrorToast';

interface SaveArtistButtonProps {
  artistId: number;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export default function SaveArtistButton({ artistId, size = 'sm' }: SaveArtistButtonProps) {
  const toast = useToastContext();
  const utils = trpc.useUtils();
  
  const { data: savedStatus } = trpc.booking.isArtistSaved.useQuery(
    { artistId },
    { staleTime: 60_000 }
  );

  const saveMutation = trpc.booking.saveArtist.useMutation({
    onSuccess: () => {
      utils.booking.isArtistSaved.invalidate({ artistId });
      utils.booking.getSavedArtists.invalidate();
      toast.addSuccess('Artist saved', 'Added to your saved artists');
    },
  });

  const unsaveMutation = trpc.booking.unsaveArtist.useMutation({
    onSuccess: () => {
      utils.booking.isArtistSaved.invalidate({ artistId });
      utils.booking.getSavedArtists.invalidate();
      toast.addSuccess('Artist removed', 'Removed from saved artists');
    },
  });

  const isSaved = savedStatus?.saved || false;
  const isPending = saveMutation.isPending || unsaveMutation.isPending;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaved) {
      unsaveMutation.mutate({ artistId });
    } else {
      saveMutation.mutate({ artistId });
    }
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggle}
      disabled={isPending}
      className={`${isSaved ? 'text-red-500 hover:text-red-600' : 'text-gray-400 hover:text-red-400'}`}
      title={isSaved ? 'Remove from saved' : 'Save artist'}
    >
      <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
    </Button>
  );
}
