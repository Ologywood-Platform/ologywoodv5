import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

interface AvailabilityAlertButtonProps {
  artistId: number;
  className?: string;
}

export const AvailabilityAlertButton: React.FC<AvailabilityAlertButtonProps> = ({
  artistId,
  className = '',
}) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if user is subscribed
  const { data: subscriptionStatus } = trpc.availabilityAlerts.isSubscribed.useQuery(
    { artistId },
    { enabled: !!artistId }
  );

  useEffect(() => {
    if (subscriptionStatus?.isSubscribed !== undefined) {
      setIsSubscribed(subscriptionStatus.isSubscribed);
    }
  }, [subscriptionStatus]);

  const subscribeMutation = trpc.availabilityAlerts.subscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(true);
      // Show toast notification
      console.log('Subscribed to availability alerts');
    },
    onError: (error) => {
      console.error('Failed to subscribe:', error.message);
    },
  });

  const unsubscribeMutation = trpc.availabilityAlerts.unsubscribe.useMutation({
    onSuccess: () => {
      setIsSubscribed(false);
      // Show toast notification
      console.log('Unsubscribed from availability alerts');
    },
    onError: (error) => {
      console.error('Failed to unsubscribe:', error.message);
    },
  });

  const handleToggle = async () => {
    setLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribeMutation.mutateAsync({ artistId });
      } else {
        await subscribeMutation.mutateAsync({ artistId });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={loading}
      variant={isSubscribed ? 'default' : 'outline'}
      className={className}
      title={isSubscribed ? 'Unsubscribe from alerts' : 'Get notified when availability opens'}
    >
      {isSubscribed ? (
        <>
          <Bell className="w-4 h-4 mr-2 fill-current" />
          Alerts On
        </>
      ) : (
        <>
          <BellOff className="w-4 h-4 mr-2" />
          Get Alerts
        </>
      )}
    </Button>
  );
};

export default AvailabilityAlertButton;
