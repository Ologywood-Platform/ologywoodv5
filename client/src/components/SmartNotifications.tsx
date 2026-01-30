import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, TrendingUp, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export type NotificationType =
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'rating_received'
  | 'new_recommendation'
  | 'upcoming_event'
  | 'negotiation_received'
  | 'negotiation_accepted'
  | 'revenue_milestone'
  | 'message_received';

export interface SmartNotification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

interface SmartNotificationsProps {
  notifications: SmartNotification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: number) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onDelete: (notificationId: number) => Promise<void>;
  isLoading?: boolean;
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  booking_request: <Calendar className="h-4 w-4" />,
  booking_confirmed: <Check className="h-4 w-4" />,
  booking_cancelled: <AlertCircle className="h-4 w-4" />,
  rating_received: <TrendingUp className="h-4 w-4" />,
  new_recommendation: <TrendingUp className="h-4 w-4" />,
  upcoming_event: <Calendar className="h-4 w-4" />,
  negotiation_received: <MessageSquare className="h-4 w-4" />,
  negotiation_accepted: <Check className="h-4 w-4" />,
  revenue_milestone: <TrendingUp className="h-4 w-4" />,
  message_received: <MessageSquare className="h-4 w-4" />,
};

const notificationColors: Record<NotificationType, string> = {
  booking_request: 'bg-blue-50 border-blue-200',
  booking_confirmed: 'bg-green-50 border-green-200',
  booking_cancelled: 'bg-red-50 border-red-200',
  rating_received: 'bg-yellow-50 border-yellow-200',
  new_recommendation: 'bg-purple-50 border-purple-200',
  upcoming_event: 'bg-orange-50 border-orange-200',
  negotiation_received: 'bg-indigo-50 border-indigo-200',
  negotiation_accepted: 'bg-green-50 border-green-200',
  revenue_milestone: 'bg-emerald-50 border-emerald-200',
  message_received: 'bg-cyan-50 border-cyan-200',
};

export function SmartNotifications({
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  isLoading = false,
}: SmartNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await onMarkAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: number) => {
    setIsDeleting(notificationId);
    try {
      await onDelete(notificationId);
    } finally {
      setIsDeleting(null);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <div className="relative">
      {/* Notification Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 mt-2 w-96 max-h-96 shadow-lg z-50">
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  disabled={isLoading}
                  className="text-xs"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b p-4 hover:bg-muted/50 transition-colors ${
                      notificationColors[notification.type]
                    } ${!notification.isRead ? 'font-semibold' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {notificationIcons[notification.type]}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold truncate">
                          {notification.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 flex-shrink-0">
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 hover:bg-white/50 rounded"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={isDeleting === notification.id}
                          className="p-1 hover:bg-white/50 rounded"
                          title="Delete"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Record<NotificationType, boolean>>({
    booking_request: true,
    booking_confirmed: true,
    booking_cancelled: true,
    rating_received: true,
    new_recommendation: true,
    upcoming_event: true,
    negotiation_received: true,
    negotiation_accepted: true,
    revenue_milestone: true,
    message_received: true,
  });

  const handleToggle = (type: NotificationType) => {
    setPreferences(prev => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const notificationLabels: Record<NotificationType, string> = {
    booking_request: 'Booking Requests',
    booking_confirmed: 'Booking Confirmations',
    booking_cancelled: 'Booking Cancellations',
    rating_received: 'New Ratings',
    new_recommendation: 'Artist Recommendations',
    upcoming_event: 'Upcoming Events',
    negotiation_received: 'Counter-Offers',
    negotiation_accepted: 'Accepted Offers',
    revenue_milestone: 'Revenue Milestones',
    message_received: 'Messages',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(notificationLabels).map(([type, label]) => (
          <div key={type} className="flex items-center justify-between">
            <label className="text-sm font-medium">{label}</label>
            <button
              onClick={() => handleToggle(type as NotificationType)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                preferences[type as NotificationType]
                  ? 'bg-green-600'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  preferences[type as NotificationType]
                    ? 'translate-x-6'
                    : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
