import React, { useState, useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface BookingNotification {
  id: string;
  artistName: string;
  venueName: string;
  eventType: string;
  timestamp: Date;
}

export const SocialProofWidget = () => {
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Simulate real-time booking notifications
    const mockNotifications: BookingNotification[] = [
      {
        id: '1',
        artistName: 'Jazz Collective',
        venueName: 'The Blue Room',
        eventType: 'Jazz Performance',
        timestamp: new Date(Date.now() - 2 * 60000),
      },
      {
        id: '2',
        artistName: 'Electric Dreams',
        venueName: 'Downtown Club',
        eventType: 'Electronic Music',
        timestamp: new Date(Date.now() - 8 * 60000),
      },
      {
        id: '3',
        artistName: 'Acoustic Hearts',
        venueName: 'Riverside Cafe',
        eventType: 'Acoustic Performance',
        timestamp: new Date(Date.now() - 15 * 60000),
      },
    ];

    setNotifications(mockNotifications);

    // Simulate new bookings every 30 seconds
    const interval = setInterval(() => {
      const newNotification: BookingNotification = {
        id: Date.now().toString(),
        artistName: `Artist ${Math.floor(Math.random() * 100)}`,
        venueName: `Venue ${Math.floor(Math.random() * 50)}`,
        eventType: ['Live Performance', 'DJ Set', 'Concert', 'Private Event'][Math.floor(Math.random() * 4)],
        timestamp: new Date(),
      };

      setNotifications((prev) => [newNotification, ...prev.slice(0, 2)]);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-6 max-w-sm z-30">
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-green-500 animate-slide-in"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="text-green-500 flex-shrink-0 mt-1" size={20} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {notification.artistName} booked {notification.venueName}
                </p>
                <p className="text-xs text-gray-600 mt-1">{notification.eventType}</p>
                <p className="text-xs text-gray-500 mt-1">{formatTime(notification.timestamp)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Close Button */}
      <button
        onClick={() => setIsVisible(false)}
        className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        <X size={14} />
        Hide notifications
      </button>

      <style>{`
        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateX(-100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SocialProofWidget;
