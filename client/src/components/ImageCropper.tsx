import React, { useState, useCallback } from 'react';
import { Crop, RotateCw, ZoomIn, ZoomOut, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio?: number;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  title?: string;
}

export function ImageCropper({
  imageSrc,
  aspectRatio = 1,
  onCropComplete,
  onCancel,
  title = 'Crop Your Image'
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const handleCrop = useCallback(() => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = imageRef.current;
    const size = Math.min(image.width, image.height);

    canvas.width = size;
    canvas.height = size;

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-size / 2, -size / 2);

    const scaledWidth = image.width * zoom;
    const scaledHeight = image.height * zoom;
    const x = (size - scaledWidth) / 2 + crop.x;
    const y = (size - scaledHeight) / 2 + crop.y;

    ctx.drawImage(image, x, y, scaledWidth, scaledHeight);
    ctx.restore();

    const croppedImage = canvas.toDataURL('image/jpeg', 0.95);
    onCropComplete(croppedImage);
  }, [crop, zoom, rotation, onCropComplete]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    if (e.buttons === 1) {
      setCrop({ x: x / zoom, y: y / zoom });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(Math.max(0.5, Math.min(3, zoom + delta)));
  };

  const aspectRatioOptions = [
    { label: 'Square (1:1)', value: 1 },
    { label: 'Portrait (3:4)', value: 0.75 },
    { label: 'Landscape (16:9)', value: 16 / 9 }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview Area */}
          <div
            className="relative bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300"
            style={{
              aspectRatio: aspectRatio,
              maxHeight: '400px'
            }}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
          >
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              className="w-full h-full object-cover cursor-move"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${crop.x}px, ${crop.y}px)`,
                transformOrigin: 'center',
                transition: 'none'
              }}
              draggable={false}
            />
            {/* Crop Guide Lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-0 right-0 border-t border-white/30"></div>
              <div className="absolute top-2/3 left-0 right-0 border-t border-white/30"></div>
              <div className="absolute top-0 left-1/3 bottom-0 border-l border-white/30"></div>
              <div className="absolute top-0 left-2/3 bottom-0 border-l border-white/30"></div>
            </div>
          </div>

          {/* Aspect Ratio Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2">
              {aspectRatioOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    // Update aspect ratio
                  }}
                  className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            {/* Zoom Control */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Zoom</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Rotation</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setRotation((rotation - 90) % 360)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <RotateCw className="h-5 w-5" />
                </button>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="15"
                  value={rotation}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm text-gray-600 w-12 text-right">{rotation}°</span>
              </div>
            </div>
          </div>

          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCrop}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Crop
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips for Best Results</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Drag to move the image within the crop area</li>
              <li>• Use the zoom slider to adjust image size</li>
              <li>• Center your face in the crop frame</li>
              <li>• The grid lines follow the rule of thirds</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
