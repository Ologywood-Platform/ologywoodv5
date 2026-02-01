import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Video, FileText, Music, GripVertical, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'document' | 'audio';
  name: string;
  uploadedAt: string;
}

interface EnhancedMediaGalleryProps {
  role: 'artist' | 'venue';
}

export function EnhancedMediaGallery({ role }: EnhancedMediaGalleryProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'image' | 'video' | 'audio' | 'document'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<HTMLDivElement>(null);

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

  const getFileType = (fileName: string): 'image' | 'video' | 'audio' | 'document' => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'mov', 'avi'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'flac', 'm4a'].includes(ext)) return 'audio';
    return 'document';
  };

  const getFileIcon = (type: 'image' | 'video' | 'audio' | 'document') => {
    switch (type) {
      case 'image': return <ImageIcon className="h-6 w-6" />;
      case 'video': return <Video className="h-6 w-6" />;
      case 'audio': return <Music className="h-6 w-6" />;
      default: return <FileText className="h-6 w-6" />;
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Validate files
    const validFiles = fileArray.filter(file => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 50MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    try {
      for (const file of validFiles) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const fileData = e.target?.result as string;
          const fileType = getFileType(file.name);

          try {
            await addPhotoMutation.mutateAsync({
              fileData,
              fileName: file.name,
              mimeType: file.type,
            });

            toast.success(`${file.name} uploaded successfully`);
          } catch (error: any) {
            toast.error(`Failed to upload ${file.name}`);
          }
        };
        reader.readAsDataURL(file);
      }

      // Refetch after all uploads
      setTimeout(() => {
        refetch();
        setUploading(false);
      }, 1000);
    } catch (error: any) {
      toast.error('Failed to upload files');
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

  const filteredPhotos = selectedCategory === 'all' 
    ? photos 
    : photos.filter(p => getFileType(p) === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'image', 'video', 'audio', 'document'] as const).map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(cat)}
            className="capitalize whitespace-nowrap"
          >
            {cat === 'all' ? 'All Files' : cat}
          </Button>
        ))}
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Media</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={dragRef}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="media-upload"
            />
            
            <div className="flex flex-col items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">Drag and drop your files here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Supported: Images, Videos, Audio, Documents (Max 50MB each)
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Grid */}
      <Card>
        <CardHeader>
          <CardTitle>
            Media Gallery ({filteredPhotos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPhotos.map((photo, idx) => {
                const fileType = getFileType(photo);
                return (
                  <div
                    key={idx}
                    className="group relative rounded-lg overflow-hidden bg-muted aspect-square flex items-center justify-center"
                  >
                    {fileType === 'image' ? (
                      <img
                        src={photo}
                        alt={`Gallery item ${idx}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        {getFileIcon(fileType)}
                        <span className="text-xs text-center truncate px-2">
                          {photo.split('/').pop()?.substring(0, 20)}
                        </span>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => handleRemovePhoto(photo)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => window.open(photo, '_blank')}
                      >
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Drag Handle */}
                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition">
                      <GripVertical className="h-4 w-4 text-white" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No media files yet</p>
              <p className="text-sm text-muted-foreground">Upload your first file to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Media Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Files</p>
              <p className="text-2xl font-bold">{photos.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Images</p>
              <p className="text-2xl font-bold">{photos.filter(p => getFileType(p) === 'image').length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Videos</p>
              <p className="text-2xl font-bold">{photos.filter(p => getFileType(p) === 'video').length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Other</p>
              <p className="text-2xl font-bold">{photos.filter(p => ['audio', 'document'].includes(getFileType(p))).length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
