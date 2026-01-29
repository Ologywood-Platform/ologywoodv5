import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Bell, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

interface NotificationPreferences {
  emailBookingUpdates: boolean;
  smsBookingUpdates: boolean;
  emailContractUpdates: boolean;
  smsContractUpdates: boolean;
  phoneNumber?: string;
}

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailBookingUpdates: true,
    smsBookingUpdates: false,
    emailContractUpdates: true,
    smsContractUpdates: false,
    phoneNumber: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleCheckboxChange = (field: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (value: string) => {
    setPreferences(prev => ({ ...prev, phoneNumber: value }));
  };

  const handleSave = async () => {
    // Validate phone number if SMS is enabled
    if ((preferences.smsBookingUpdates || preferences.smsContractUpdates) && !preferences.phoneNumber) {
      toast.error('Please enter a phone number for SMS notifications');
      return;
    }

    setIsSaving(true);
    try {
      // Save preferences to localStorage for now
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how you want to receive updates about bookings and contracts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <Mail className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Email Notifications</h3>
            </div>

            <div className="space-y-3 ml-7">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailBooking"
                  checked={preferences.emailBookingUpdates}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('emailBookingUpdates', checked as boolean)
                  }
                />
                <Label htmlFor="emailBooking" className="cursor-pointer">
                  Booking updates (new requests, confirmations, cancellations)
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="emailContract"
                  checked={preferences.emailContractUpdates}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('emailContractUpdates', checked as boolean)
                  }
                />
                <Label htmlFor="emailContract" className="cursor-pointer">
                  Contract updates (rider changes, signature requests)
                </Label>
              </div>
            </div>
          </div>

          {/* SMS Notifications */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b">
              <MessageSquare className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">SMS Text Notifications</h3>
            </div>

            <div className="space-y-3 ml-7">
              <div>
                <Label htmlFor="phone" className="text-sm">
                  Phone Number (for SMS)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={preferences.phoneNumber || ''}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="mt-1"
                  disabled={!preferences.smsBookingUpdates && !preferences.smsContractUpdates}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smsBooking"
                  checked={preferences.smsBookingUpdates}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('smsBookingUpdates', checked as boolean)
                  }
                />
                <Label htmlFor="smsBooking" className="cursor-pointer">
                  Booking updates via text
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="smsContract"
                  checked={preferences.smsContractUpdates}
                  onCheckedChange={(checked) => 
                    handleCheckboxChange('smsContractUpdates', checked as boolean)
                  }
                />
                <Label htmlFor="smsContract" className="cursor-pointer">
                  Contract updates via text
                </Label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full mt-6"
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> We'll use these preferences to send you important updates about your bookings and contracts. You can change these settings anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
