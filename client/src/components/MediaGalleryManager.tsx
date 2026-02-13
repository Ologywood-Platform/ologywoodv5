import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Upload, X, Loader, Plus, Image as ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface MediaGalleryManagerProps {
  photos?: string[];
  artistId?: number;
  venueId?: number;
  onPhotosUpdate?: (photos: string[]) => void;
  maxPhotos?: number;
}

export function MediaGalleryManager({
  photos = [],
  artistId,
  venueId,
  onPhotosUpdate,
  maxPhotos = 10,
}: MediaGalleryManagerProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadPhotosMutation = trpc.photo.uploadMultiple.useMutation({
    onSuccess: (data: any) => {
      toast.success("Photos uploaded successfully");
      setSelectedFiles([]);
      setPreviewUrls([]);
      onPhotosUpdate?.(data.urls);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload photos");
      setIsUploading(false);
    },
  });

  const deletePhotoMutation = trpc.photo.deleteFromGallery.useMutation({
    onSuccess: (data: any) => {
      toast.success("Photo removed from gallery");
      onPhotosUpdate?.(data.remainingPhotos);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete photo");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Check total count
    if (photos.length + selectedFiles.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 5MB`);
        return;
      }

      validFiles.push(file);
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select files first");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });
    if (artistId) formData.append("artistId", artistId.toString());
    if (venueId) formData.append("venueId", venueId.toString());

    try {
      const response = await fetch("/api/photo/upload-multiple", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      uploadPhotosMutation.mutate({
        urls: data.urls,
        artistId,
        venueId,
      });
    } catch (error) {
      toast.error("Failed to upload photos");
      setIsUploading(false);
    }
  };

  const handleRemovePreview = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeletePhoto = (photoUrl: string) => {
    if (confirm("Are you sure you want to delete this photo?")) {
      deletePhotoMutation.mutate({
        url: photoUrl,
        artistId,
        venueId,
      });
    }
  };

  const handleCancel = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const remainingSlots = maxPhotos - photos.length - selectedFiles.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Media Gallery
        </CardTitle>
        <CardDescription>
          Showcase your work with up to {maxPhotos} photos ({photos.length + selectedFiles.length}/{maxPhotos})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Gallery */}
        {photos.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Gallery</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photoUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photoUrl}
                    alt={`Gallery photo ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePhoto(photoUrl)}
                    disabled={deletePhotoMutation.isPending}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview of New Photos */}
        {previewUrls.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">New Photos to Upload</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {previewUrls.map((previewUrl, index) => (
                <div key={index} className="relative group">
                  <img
                    src={previewUrl}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemovePreview(index)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Area */}
        {remainingSlots > 0 && previewUrls.length === 0 && (
          <div className="space-y-3">
            <Label htmlFor="gallery-input" className="text-sm font-medium">
              Add Photos ({remainingSlots} slots available)
            </Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                id="gallery-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <label
                htmlFor="gallery-input"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 5MB each (up to {remainingSlots} files)
                </p>
              </label>
            </div>
          </div>
        )}

        {/* Upload Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Upload high-quality photos that showcase your work. Good lighting and clear images help attract more bookings.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        {previewUrls.length > 0 && (
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading || selectedFiles.length === 0}
            >
              {isUploading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Uploading {selectedFiles.length} photos...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add {selectedFiles.length} Photo{selectedFiles.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Empty State */}
        {photos.length === 0 && previewUrls.length === 0 && (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No photos yet. Start building your gallery!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
