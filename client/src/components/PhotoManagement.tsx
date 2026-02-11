import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { AlertCircle, Upload, X, Loader } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface PhotoManagementProps {
  currentPhotoUrl?: string | null;
  artistId?: number;
  venueId?: number;
  onPhotoUpdate?: (photoUrl: string) => void;
}

export function PhotoManagement({
  currentPhotoUrl,
  artistId,
  venueId,
  onPhotoUpdate,
}: PhotoManagementProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadPhotoMutation = trpc.photo.upload.useMutation({
    onSuccess: (data) => {
      toast.success("Profile photo updated successfully");
      setSelectedFile(null);
      setPreviewUrl(null);
      onPhotoUpdate?.(data.url);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to upload photo");
      setIsUploading(false);
    },
  });

  const deletePhotoMutation = trpc.photo.delete.useMutation({
    onSuccess: () => {
      toast.success("Profile photo removed");
      setPreviewUrl(null);
      onPhotoUpdate?.(null);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete photo");
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    if (artistId) formData.append("artistId", artistId.toString());
    if (venueId) formData.append("venueId", venueId.toString());

    try {
      const response = await fetch("/api/photo/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      uploadPhotoMutation.mutate({
        url: data.url,
        artistId,
        venueId,
      });
    } catch (error) {
      toast.error("Failed to upload photo");
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = () => {
    if (!currentPhotoUrl) return;

    if (confirm("Are you sure you want to delete your profile photo?")) {
      deletePhotoMutation.mutate({
        url: currentPhotoUrl,
        artistId,
        venueId,
      });
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Photo</CardTitle>
        <CardDescription>
          Upload a professional profile photo (JPG, PNG, max 5MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Photo Display */}
        {currentPhotoUrl && !previewUrl && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Photo</Label>
            <div className="relative w-full max-w-xs">
              <img
                src={currentPhotoUrl}
                alt="Current profile photo"
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeletePhoto}
                disabled={deletePhotoMutation.isPending}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Preview of New Photo */}
        {previewUrl && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Preview</Label>
            <div className="w-full max-w-xs">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg border"
              />
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!previewUrl && (
          <div className="space-y-3">
            <Label htmlFor="photo-input" className="text-sm font-medium">
              {currentPhotoUrl ? "Change Photo" : "Upload Photo"}
            </Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading}
              />
              <label
                htmlFor="photo-input"
                className="flex flex-col items-center justify-center cursor-pointer"
              >
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click to upload or drag and drop</p>
                <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
              </label>
            </div>
          </div>
        )}

        {/* File Info */}
        {selectedFile && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}

        {/* Upload Info */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Use a clear, professional headshot or band photo. Avoid logos, text, or watermarks.
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        {previewUrl && (
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
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
