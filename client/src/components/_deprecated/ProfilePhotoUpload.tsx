import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Upload, X, Loader2 } from 'lucide-react';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string;
  onUpload: (fileData: string, fileName: string, mimeType: string) => Promise<{ url: string; success: boolean }>;
  isLoading?: boolean;
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

export function ProfilePhotoUpload({
  currentPhotoUrl,
  onUpload,
  isLoading = false,
  onSuccess,
  onError,
}: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileData = event.target?.result as string;
        setPreview(fileData);

        try {
          const result = await onUpload(fileData, file.name, file.type);
          
          if (result.success) {
            onSuccess?.(result.url);
          } else {
            setError('Failed to upload photo');
            onError?.('Failed to upload photo');
          }
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to upload photo';
          setError(errorMessage);
          onError?.(errorMessage);
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Failed to process file');
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInputRef.current.files = dataTransfer.files;
        
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Profile Photo</h3>

      {error && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Preview"
              className="h-40 w-40 rounded-lg object-cover border-2 border-gray-200"
            />
            <button
              onClick={handleRemove}
              disabled={uploading || isLoading}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop your photo here, or click to select
            </p>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading || isLoading}
        />

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isLoading}
            variant="outline"
          >
            {uploading || isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {preview ? 'Change Photo' : 'Upload Photo'}
              </>
            )}
          </Button>

          {preview && (
            <Button
              type="button"
              onClick={handleRemove}
              disabled={uploading || isLoading}
              variant="outline"
            >
              Remove
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Recommended size: 400x400px or larger. Square images work best.
        </p>
      </div>
    </Card>
  );
}
