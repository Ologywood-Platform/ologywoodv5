import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

/**
 * PhotoManagement - DISABLED
 * This component requires the 'photo' router which is not yet implemented.
 * To enable, implement photo upload/delete endpoints in the TRPC router.
 */
export function PhotoManagement() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Photo Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600 text-sm">
          Photo management is currently disabled. This feature will be available soon.
        </p>
      </CardContent>
    </Card>
  );
}

export default PhotoManagement;
