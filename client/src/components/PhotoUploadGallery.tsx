import { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { trpc } from '../lib/trpc';
import { useToast } from './ErrorToast';
import { Upload, X, Loader2, ImagePlus, Trash2, ZoomIn } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';

interface PhotoUploadGalleryProps {
  eventHistoryId: number;
  isOwner: boolean;
}

export function PhotoUploadGallery({ eventHistoryId, isOwner }: PhotoUploadGalleryProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; caption?: string | null } | null>(null);

  const { data: photos = [], refetch } = trpc.events.getPhotos.useQuery(
    { eventHistoryId },
    { enabled: eventHistoryId > 0 }
  );

  const uploadPhoto = trpc.events.uploadEventPhoto.useMutation({
    onSuccess: () => {
      toast.addSuccess('Photo Uploaded', 'Your photo has been added to this event.');
      refetch();
      setUploading(false);
    },
    onError: (error) => {
      toast.addError('Upload Failed', error.message);
      setUploading(false);
    },
  });

  const deletePhoto = trpc.events.deletePhoto.useMutation({
    onSuccess: () => {
      toast.addSuccess('Photo Deleted', 'The photo has been removed.');
      refetch();
    },
    onError: (error) => {
      toast.addError('Delete Failed', error.message);
    },
  });

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.addError('Invalid File', 'Please select an image file (JPG, PNG, WebP).');
      return;
    }

    // Validate file size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.addError('File Too Large', 'Maximum file size is 10 MB.');
      return;
    }

    setUploading(true);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadPhoto.mutate({
        eventHistoryId,
        fileData: base64,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.onerror = () => {
      toast.addError('Read Error', 'Failed to read the file.');
      setUploading(false);
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [eventHistoryId, uploadPhoto, toast]);

  return (
    <div className="space-y-3">
      {/* Photo Grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
              <img
                src={photo.photoUrl}
                alt={photo.caption || 'Event photo'}
                className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => setLightboxPhoto({ url: photo.photoUrl, caption: photo.caption })}
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => setLightboxPhoto({ url: photo.photoUrl, caption: photo.caption })}
                >
                  <ZoomIn className="h-5 w-5" />
                </Button>
                {isOwner && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-red-500/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this photo? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deletePhoto.mutate({ photoId: photo.id })}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              {/* Caption */}
              {photo.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 truncate">
                  {photo.caption}
                </div>
              )}
            </div>
          ))}

          {/* Upload tile (owner only) */}
          {isOwner && (
            <div
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <>
                  <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Add Photo</span>
                </>
              )}
            </div>
          )}
        </div>
      ) : isOwner ? (
        /* Empty state for owner */
        <div
          className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Upload Performance Photos</p>
                <p className="text-xs text-muted-foreground mt-1">JPG, PNG, or WebP up to 10 MB</p>
              </div>
            </>
          )}
        </div>
      ) : (
        /* Empty state for visitors */
        <p className="text-sm text-muted-foreground italic">No photos yet for this event.</p>
      )}

      {/* Hidden file input */}
      {isOwner && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      )}

      {/* Lightbox Dialog */}
      <Dialog open={!!lightboxPhoto} onOpenChange={() => setLightboxPhoto(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Photo Preview</DialogTitle>
          </DialogHeader>
          {lightboxPhoto && (
            <div className="relative">
              <img
                src={lightboxPhoto.url}
                alt={lightboxPhoto.caption || 'Event photo'}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
              {lightboxPhoto.caption && (
                <p className="text-center text-sm text-muted-foreground mt-2 px-4">
                  {lightboxPhoto.caption}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
