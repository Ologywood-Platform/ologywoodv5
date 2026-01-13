import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

interface PhotoGalleryManagerProps {
  role: 'artist' | 'venue';
}

export function PhotoGalleryManager({ role }: PhotoGalleryManagerProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const { data: profile, refetch } = role === 'artist' 
    ? trpc.artist.getMyProfile.useQuery()
    : trpc.venue.getMyProfile.useQuery();

  const addPhotoMutation = role === 'artist'
    ? trpc.artist.addGalleryPhoto.useMutation()
    : trpc.venue.addGalleryPhoto.useMutation();

  const removePhotoMutation = role === 'artist'
    ? trpc.artist.removeGalleryPhoto.useMutation()
    : trpc.venue.removeGalleryPhoto.useMutation();

  const photos = profile?.mediaGallery?.photos || [];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;

        await addPhotoMutation.mutateAsync({
          fileData,
          fileName: file.name,
          mimeType: file.type,
        });

        toast.success('Photo uploaded successfully');
        refetch();
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo');
      setUploading(false);
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    try {
      await removePhotoMutation.mutateAsync({ photoUrl });
      toast.success('Photo removed successfully');
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove photo');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo Gallery</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Upload Button */}
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
              disabled={uploading}
            />
            <label htmlFor="photo-upload">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                className="w-full"
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Max file size: 5MB. Supported formats: JPG, PNG, GIF, WebP
            </p>
          </div>

          {/* Photo Grid */}
          {photos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photoUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photoUrl}
                    alt={`Gallery photo ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => handleRemovePhoto(photoUrl)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={removePhotoMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
              <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No photos yet</p>
              <p className="text-sm text-muted-foreground">Upload photos to showcase your work</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
