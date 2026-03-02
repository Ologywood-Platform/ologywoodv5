// DISABLED: Media gallery router methods not available
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, ImageIcon } from 'lucide-react';

interface EnhancedMediaGalleryProps {
  role: 'artist' | 'venue';
}

export function EnhancedMediaGallery({ role }: EnhancedMediaGalleryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Media Gallery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 mb-4">
          Media gallery upload features coming soon.
        </p>
        <Button disabled>
          <Upload className="w-4 h-4 mr-2" />
          Upload Media (Coming Soon)
        </Button>
      </CardContent>
    </Card>
  );
}

export default EnhancedMediaGallery;
