import React, { useState } from 'react';
import { Upload, X, ChevronLeft, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GalleryPhoto {
  id: string;
  url: string;
  caption?: string;
  uploadedAt: Date;
  order: number;
}

interface ArtistPhotoGalleryProps {
  artistId: number;
  isEditable?: boolean;
  onPhotosChange?: (photos: GalleryPhoto[]) => void;
}

export function ArtistPhotoGallery({
  artistId,
  isEditable = false,
  onPhotosChange
}: ArtistPhotoGalleryProps) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([
    {
      id: '1',
      url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
      caption: 'Live Performance - 2025',
      uploadedAt: new Date('2025-01-15'),
      order: 1
    },
    {
      id: '2',
      url: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=600&h=400&fit=crop',
      caption: 'Studio Session',
      uploadedAt: new Date('2025-01-10'),
      order: 2
    },
    {
      id: '3',
      url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop',
      caption: 'Festival Performance',
      uploadedAt: new Date('2024-12-20'),
      order: 3
    }
  ]);

  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string | null>(null);
  const [draggedPhoto, setDraggedPhoto] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPhoto: GalleryPhoto = {
          id: Date.now().toString(),
          url: event.target?.result as string,
          caption: '',
          uploadedAt: new Date(),
          order: photos.length + 1
        };
        const updatedPhotos = [...photos, newPhoto];
        setPhotos(updatedPhotos);
        onPhotosChange?.(updatedPhotos);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDeletePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter((p) => p.id !== photoId);
    setPhotos(updatedPhotos);
    onPhotosChange?.(updatedPhotos);
  };

  const handleUpdateCaption = (photoId: string, caption: string) => {
    const updatedPhotos = photos.map((p) =>
      p.id === photoId ? { ...p, caption } : p
    );
    setPhotos(updatedPhotos);
    onPhotosChange?.(updatedPhotos);
    setEditingCaption(null);
  };

  const handleDragStart = (photoId: string) => {
    setDraggedPhoto(photoId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetPhotoId: string) => {
    if (!draggedPhoto || draggedPhoto === targetPhotoId) return;

    const draggedIndex = photos.findIndex((p) => p.id === draggedPhoto);
    const targetIndex = photos.findIndex((p) => p.id === targetPhotoId);

    const updatedPhotos = [...photos];
    [updatedPhotos[draggedIndex], updatedPhotos[targetIndex]] = [
      updatedPhotos[targetIndex],
      updatedPhotos[draggedIndex]
    ];

    // Update order numbers
    updatedPhotos.forEach((p, i) => {
      p.order = i + 1;
    });

    setPhotos(updatedPhotos);
    onPhotosChange?.(updatedPhotos);
    setDraggedPhoto(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Photo Gallery</h3>
          <p className="text-gray-600 mt-1">
            Showcase your performances and talent ({photos.length} photos)
          </p>
        </div>
        {isEditable && (
          <label className="cursor-pointer">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Upload className="h-4 w-4 mr-2" />
              Add Photos
            </Button>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Empty State */}
      {photos.length === 0 && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h4>
          <p className="text-gray-600 mb-4">
            {isEditable
              ? 'Upload your first performance photo to get started'
              : 'This artist hasn\'t uploaded any photos yet'}
          </p>
          {isEditable && (
            <label>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload Photos
              </Button>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              draggable={isEditable}
              onDragStart={() => handleDragStart(photo.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(photo.id)}
              className={`group relative rounded-lg overflow-hidden bg-gray-100 aspect-video cursor-pointer transition ${
                draggedPhoto === photo.id ? 'opacity-50' : ''
              } ${isEditable ? 'cursor-move' : ''}`}
              onClick={() => setSelectedPhotoId(photo.id)}
            >
              {/* Image */}
              <img
                src={photo.url}
                alt={photo.caption || 'Gallery photo'}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition duration-300 flex items-end">
                {/* Caption */}
                {photo.caption && (
                  <div className="w-full p-3 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm font-medium">{photo.caption}</p>
                  </div>
                )}

                {/* Actions */}
                {isEditable && (
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCaption(photo.id);
                      }}
                      className="p-2 bg-white/90 hover:bg-white rounded-lg transition"
                    >
                      <Edit2 className="h-4 w-4 text-gray-700" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePhoto(photo.id);
                      }}
                      className="p-2 bg-white/90 hover:bg-white rounded-lg transition"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>

              {/* Order Badge */}
              {isEditable && (
                <div className="absolute top-2 left-2 bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                  {photo.order}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Caption Editor Modal */}
      {editingCaption && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold mb-4">Edit Caption</h3>
            <input
              type="text"
              defaultValue={photos.find((p) => p.id === editingCaption)?.caption || ''}
              onChange={(e) => {
                const photo = photos.find((p) => p.id === editingCaption);
                if (photo) {
                  handleUpdateCaption(editingCaption, e.target.value);
                }
              }}
              placeholder="Enter photo caption..."
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingCaption(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setEditingCaption(null)}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhotoId && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhotoId(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedPhotoId(null)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              <X className="h-6 w-6 text-white" />
            </button>

            {/* Image */}
            <img
              src={photos.find((p) => p.id === selectedPhotoId)?.url}
              alt="Gallery photo"
              className="w-full h-auto rounded-lg"
            />

            {/* Caption */}
            {photos.find((p) => p.id === selectedPhotoId)?.caption && (
              <div className="mt-4 text-center">
                <p className="text-white text-lg">
                  {photos.find((p) => p.id === selectedPhotoId)?.caption}
                </p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => {
                  const currentIndex = photos.findIndex((p) => p.id === selectedPhotoId);
                  const prevIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
                  setSelectedPhotoId(photos[prevIndex].id);
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                <ChevronLeft className="h-6 w-6 text-white" />
              </button>
              <span className="text-white text-sm">
                {photos.findIndex((p) => p.id === selectedPhotoId) + 1} / {photos.length}
              </span>
              <button
                onClick={() => {
                  const currentIndex = photos.findIndex((p) => p.id === selectedPhotoId);
                  const nextIndex = currentIndex === photos.length - 1 ? 0 : currentIndex + 1;
                  setSelectedPhotoId(photos[nextIndex].id);
                }}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                <ChevronRight className="h-6 w-6 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Gallery Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Upload high-quality performance photos to showcase your talent</li>
          <li>• Add captions to describe each photo or event</li>
          <li>• Drag photos to reorder them in your gallery</li>
          <li>• Include variety: solo shots, band photos, crowd interaction</li>
          <li>• Update your gallery quarterly with new content</li>
        </ul>
      </div>
    </div>
  );
}
