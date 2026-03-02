// DISABLED: availabilityAlerts router not available
import React from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AvailabilityAlertButtonProps {
  artistId: number;
  className?: string;
}

export const AvailabilityAlertButton: React.FC<AvailabilityAlertButtonProps> = ({
  artistId,
  className = '',
}) => {
  return (
    <Button
      disabled
      variant="outline"
      className={className}
      title="Availability alerts feature coming soon"
    >
      <Bell className="w-4 h-4 mr-2" />
      Alerts (Coming Soon)
    </Button>
  );
};

export default AvailabilityAlertButton;
