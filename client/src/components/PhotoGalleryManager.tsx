import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * PhotoGalleryManager - DISABLED
 * This component requires missing artist router methods:
 * - artist.getMyProfile
 * - artist.addGalleryPhoto
 * - artist.removeGalleryPhoto
 */
export function PhotoGalleryManager() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Photo Gallery Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm">
          Photo gallery management is currently disabled. This feature will be available soon.
        </p>
      </CardContent>
    </Card>
  );
}

export default PhotoGalleryManager;
