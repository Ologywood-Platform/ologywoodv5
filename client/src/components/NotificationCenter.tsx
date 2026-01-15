import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Bell, Mail, Check, Trash2, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: number;
  type: 'booking' | 'message' | 'payment' | 'contract' | 'review';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
}

interface NotificationPreference {
  type: string;
  inApp: boolean;
  email: boolean;
  push: boolean;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mock notifications
  const mockNotifications: Notification[] = [
    {
      id: 1,
      type: 'booking',
      title: 'New Booking Request',
      description: 'The Venue NYC requested a booking for March 15, 2026',
      timestamp: '2 hours ago',
      isRead: false,
      actionUrl: '/bookings/101',
    },
    {
      id: 2,
      type: 'message',
      title: 'New Message',
      description: 'Jazz Club Downtown sent you a message',
      timestamp: '1 hour ago',
      isRead: false,
      actionUrl: '/messages/2',
    },
    {
      id: 3,
      type: 'contract',
      title: 'Contract Signed',
      description: 'The Venue NYC signed the contract for your March 15 booking',
      timestamp: '30 minutes ago',
      isRead: true,
      actionUrl: '/contracts/5',
    },
    {
      id: 4,
      type: 'payment',
      title: 'Payment Received',
      description: 'You received a $500 deposit payment',
      timestamp: '1 day ago',
      isRead: true,
      actionUrl: '/payments',
    },
    {
      id: 5,
      type: 'review',
      title: 'New Review',
      description: 'A venue left you a 5-star review',
      timestamp: '2 days ago',
      isRead: true,
      actionUrl: '/reviews',
    },
  ];

  const mockPreferences: NotificationPreference[] = [
    { type: 'Booking Requests', inApp: true, email: true, push: true },
    { type: 'Messages', inApp: true, email: true, push: true },
    { type: 'Contracts', inApp: true, email: true, push: false },
    { type: 'Payments', inApp: true, email: true, push: true },
    { type: 'Reviews', inApp: true, email: false, push: false },
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
    setPreferences(mockPreferences);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const handleDeleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const handleTogglePreference = (index: number, field: keyof Omit<NotificationPreference, 'type'>) => {
    setPreferences(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: !updated[index][field],
      };
      return updated;
    });
    toast.success('Preference updated');
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return '📅';
      case 'message':
        return '💬';
      case 'payment':
        return '💳';
      case 'contract':
        return '📄';
      case 'review':
        return '⭐';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking':
        return 'bg-blue-100 text-blue-800';
      case 'message':
        return 'bg-purple-100 text-purple-800';
      case 'payment':
        return 'bg-green-100 text-green-800';
      case 'contract':
        return 'bg-yellow-100 text-yellow-800';
      case 'review':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Your Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <Check className="h-4 w-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <Card
                  key={notification.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{notification.title}</h4>
                        <Badge className={getNotificationColor(notification.type)}>
                          {notification.type}
                        </Badge>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{notification.timestamp}</p>
                    </div>
                    <div className="flex gap-2">
                      {notification.actionUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = notification.actionUrl!;
                          }}
                        >
                          View
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-8 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications yet</p>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <h3 className="font-semibold text-lg">Notification Preferences</h3>
          <p className="text-sm text-gray-600">
            Choose how you want to receive notifications for different types of events.
          </p>

          <div className="space-y-4">
            {preferences.map((pref, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold">{pref.type}</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.inApp}
                      onChange={() => handleTogglePreference(index, 'inApp')}
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-sm">In-App</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.email}
                      onChange={() => handleTogglePreference(index, 'email')}
                      className="h-4 w-4 rounded"
                    />
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pref.push}
                      onChange={() => handleTogglePreference(index, 'push')}
                      className="h-4 w-4 rounded"
                    />
                    <span className="text-sm">Push</span>
                  </label>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> You can customize these preferences at any time. Email notifications are sent daily at 9 AM.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
