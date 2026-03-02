import { useState, useRef } from "react";
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImageUploadPreviewProps {
  onUpload: (file: File) => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  maxSizeBytes?: number;
  acceptedFormats?: string[];
  className?: string;
}

export function ImageUploadPreview({
  onUpload,
  onSuccess,
  onError,
  maxSizeBytes = 50 * 1024 * 1024,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp"],
  className,
}: ImageUploadPreviewProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    setUploadResult(null);

    // Validate file type
    if (!acceptedFormats.includes(selectedFile.type)) {
      setError(`Invalid file format. Accepted: ${acceptedFormats.join(", ")}`);
      return;
    }

    // Validate file size
    if (selectedFile.size > maxSizeBytes) {
      setError(
        `File size ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB`
      );
      return;
    }

    setFile(selectedFile);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await onUpload(file);
      setUploadResult(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Upload failed");
      setError(error.message);
      onError?.(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setFile(null);
    setUploadResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      {/* Upload Area */}
      {!preview && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Drag and drop your image here
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to browse from your computer
          </p>
          <p className="text-xs text-gray-400">
            Supported formats: JPEG, PNG, WebP (Max {(maxSizeBytes / 1024 / 1024).toFixed(0)}MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(",")}
            onChange={(e) => {
              const selectedFile = e.target.files?.[0];
              if (selectedFile) {
                handleFileSelect(selectedFile);
              }
            }}
            className="hidden"
          />
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden bg-gray-100 h-64">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            {!uploadResult && (
              <button
                onClick={handleClear}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* File Info */}
          {file && !uploadResult && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium text-gray-700">File Details</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Name:</span> {file.name}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {formatBytes(file.size)}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {file.type}
                </div>
              </div>
            </div>
          )}

          {/* Upload Result */}
          {uploadResult?.optimization && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="font-medium text-green-900">Upload Successful!</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm text-green-800">
                <div>
                  <span className="font-medium">Original:</span>{" "}
                  {formatBytes(uploadResult.optimization.originalSize)}
                </div>
                <div>
                  <span className="font-medium">Optimized:</span>{" "}
                  {formatBytes(uploadResult.optimization.optimizedSize)}
                </div>
                <div>
                  <span className="font-medium">Compression:</span>{" "}
                  {uploadResult.optimization.compressionRatio}%
                </div>
                <div>
                  <span className="font-medium">Format:</span>{" "}
                  {uploadResult.optimization.format.toUpperCase()}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Upload Error</p>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!uploadResult && (
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading || !file}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  "Upload Image"
                )}
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                disabled={isUploading}
              >
                Cancel
              </Button>
            </div>
          )}

          {uploadResult && (
            <div className="flex gap-2">
              <Button
                onClick={handleClear}
                className="flex-1"
              >
                Upload Another
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
