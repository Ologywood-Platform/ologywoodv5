// DISABLED: bookingAnalyticsExport router not available
import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const BookingAnalyticsExport: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Export Booking Analytics</h3>
      <p className="text-gray-600 mb-4">Analytics export feature coming soon.</p>
      <Button disabled>
        <Download className="w-4 h-4 mr-2" />
        Export (Coming Soon)
      </Button>
    </div>
  );
};

export default BookingAnalyticsExport;
