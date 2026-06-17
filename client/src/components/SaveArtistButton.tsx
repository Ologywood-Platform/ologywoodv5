import { Heart } from 'lucide-react';
import { Button } from './ui/button';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

interface SaveArtistButtonProps {
  artistId: number;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}

export default function SaveArtistButton({ artistId, size = 'sm' }: SaveArtistButtonProps) {
  const utils = trpc.useUtils();
  
  const { data: savedStatus } = trpc.booking.isArtistSaved.useQuery(
    { artistId },
    { staleTime: 60_000 }
  );

  const saveMutation = trpc.booking.saveArtist.useMutation({
    onSuccess: () => {
      utils.booking.isArtistSaved.invalidate({ artistId });
      utils.booking.getSavedArtists.invalidate();
      toast.success('Artist saved');
    },
  });

  const unsaveMutation = trpc.booking.unsaveArtist.useMutation({
    onSuccess: () => {
      utils.booking.isArtistSaved.invalidate({ artistId });
      utils.booking.getSavedArtists.invalidate();
      toast.success('Artist removed');
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
