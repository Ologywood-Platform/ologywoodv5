import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Calendar, Copy, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CalendarSyncSettings {
  googleCalendarConnected: boolean;
  iCalFeedUrl?: string;
  syncBookings: boolean;
  syncAvailability: boolean;
}

export function CalendarSync() {
  const [settings, setSettings] = useState<CalendarSyncSettings>({
    googleCalendarConnected: false,
    syncBookings: true,
    syncAvailability: true,
  });

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Generate iCal feed URL (would be generated on backend)
  const iCalFeedUrl = `${window.location.origin}/api/calendar/ical-feed?token=artist_${Math.random().toString(36).substr(2, 9)}`;

  const handleGoogleConnect = async () => {
    setLoading(true);
    try {
      // In production, this would redirect to Google OAuth
      toast.success('Google Calendar integration coming soon');
    } catch (error) {
      toast.error('Failed to connect Google Calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyiCalUrl = () => {
    navigator.clipboard.writeText(iCalFeedUrl);
    setCopied(true);
    toast.success('iCal feed URL copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleSync = (key: keyof CalendarSyncSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Google Calendar Integration */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">Google Calendar</h3>
              <p className="text-sm text-gray-600">Sync bookings and availability</p>
            </div>
            {settings.googleCalendarConnected && (
              <Badge className="bg-green-100 text-green-800">Connected</Badge>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Connect your Google Calendar to automatically sync your bookings and availability.
            </p>

            {!settings.googleCalendarConnected ? (
              <Button
                onClick={handleGoogleConnect}
                disabled={loading}
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Connect Google Calendar
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded border border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800">Connected successfully</span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSettings(prev => ({ ...prev, googleCalendarConnected: false }));
                    toast.success('Disconnected from Google Calendar');
                  }}
                >
                  Disconnect
                </Button>
              </div>
            )}

            <div className="pt-4 border-t space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.syncBookings}
                  onChange={() => handleToggleSync('syncBookings')}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">Sync bookings to calendar</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.syncAvailability}
                  onChange={() => handleToggleSync('syncAvailability')}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">Sync availability to calendar</span>
              </label>
            </div>
          </div>
        </Card>

        {/* iCal Feed */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg">iCal Feed</h3>
              <p className="text-sm text-gray-600">Universal calendar format</p>
            </div>
            <Badge className="bg-blue-100 text-blue-800">Active</Badge>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Use this iCal feed URL to import your availability into any calendar application.
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Feed URL</label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={iCalFeedUrl}
                  readOnly
                  className="text-xs"
                />
                <Button
                  onClick={handleCopyiCalUrl}
                  variant="outline"
                  size="sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded border border-blue-200 flex gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800">
                This feed is read-only and updates automatically when your availability changes.
              </p>
            </div>

            <div className="pt-4 border-t space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.syncBookings}
                  onChange={() => handleToggleSync('syncBookings')}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">Include bookings in feed</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.syncAvailability}
                  onChange={() => handleToggleSync('syncAvailability')}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm">Include availability in feed</span>
              </label>
            </div>
          </div>
        </Card>
      </div>

      {/* Supported Applications */}
      <Card className="p-6">
        <h3 className="font-semibold text-lg mb-4">Supported Applications</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Google Calendar', icon: '📅' },
            { name: 'Apple Calendar', icon: '🍎' },
            { name: 'Outlook', icon: '📧' },
            { name: 'Zoom', icon: '🎥' },
            { name: 'Slack', icon: '💬' },
            { name: 'Asana', icon: '✓' },
            { name: 'Notion', icon: '📝' },
            { name: 'Calendly', icon: '📆' },
          ].map(app => (
            <div key={app.name} className="p-3 rounded border border-gray-200 text-center">
              <div className="text-2xl mb-2">{app.icon}</div>
              <p className="text-sm font-medium">{app.name}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Instructions */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-semibold text-lg mb-4">How to Use</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <span className="font-semibold text-gray-700 min-w-6">1.</span>
            <p>
              <strong>Google Calendar:</strong> Click "Connect Google Calendar" to authorize Ologywood to access your calendar.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="font-semibold text-gray-700 min-w-6">2.</span>
            <p>
              <strong>iCal Feed:</strong> Copy the feed URL and paste it into any calendar application that supports iCal format.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="font-semibold text-gray-700 min-w-6">3.</span>
            <p>
              <strong>Sync Settings:</strong> Choose whether to sync bookings, availability, or both.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="font-semibold text-gray-700 min-w-6">4.</span>
            <p>
              <strong>Auto-Update:</strong> Your calendar will automatically update when you create or modify bookings.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
