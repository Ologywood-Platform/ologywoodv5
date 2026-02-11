import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';

export function EmailPreferencesCenter() {
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveMessage, setSaveMessage] = useState('');

  const { data: preferences, isLoading: preferencesLoading } = trpc.emailPreferences.getPreferences.useQuery();
  const updateMutation = trpc.emailPreferences.updatePreferences.useMutation();
  const unsubscribeAllMutation = trpc.emailPreferences.unsubscribeAll.useMutation();
  const resubscribeMutation = trpc.emailPreferences.resubscribe.useMutation();

  const [localPreferences, setLocalPreferences] = useState({
    frequency: 'weekly' as const,
    bookingUpdates: true,
    newOpportunities: true,
    platformNews: false,
    weeklyDigest: true,
    reminders: true,
  });

  useEffect(() => {
    if (preferences) {
      setLocalPreferences({
        frequency: preferences.frequency as 'daily' | 'weekly' | 'never',
        bookingUpdates: preferences.bookingUpdates,
        newOpportunities: preferences.newOpportunities,
        platformNews: preferences.platformNews,
        weeklyDigest: preferences.weeklyDigest,
        reminders: preferences.reminders,
      });
    }
  }, [preferences]);

  const handleFrequencyChange = (frequency: 'daily' | 'weekly' | 'never') => {
    setLocalPreferences(prev => ({ ...prev, frequency }));
  };

  const handleToggle = (key: keyof typeof localPreferences) => {
    if (key !== 'frequency') {
      setLocalPreferences(prev => ({
        ...prev,
        [key]: !prev[key],
      }));
    }
  };

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await updateMutation.mutateAsync({
        frequency: localPreferences.frequency,
        bookingUpdates: localPreferences.bookingUpdates,
        newOpportunities: localPreferences.newOpportunities,
        platformNews: localPreferences.platformNews,
        weeklyDigest: localPreferences.weeklyDigest,
        reminders: localPreferences.reminders,
      });
      setSaveStatus('success');
      setSaveMessage('Email preferences saved successfully!');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage('Failed to save preferences. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!window.confirm('Are you sure you want to unsubscribe from all emails? You can resubscribe anytime.')) {
      return;
    }
    
    setSaveStatus('saving');
    try {
      await unsubscribeAllMutation.mutateAsync();
      setLocalPreferences(prev => ({
        ...prev,
        frequency: 'never',
        bookingUpdates: false,
        newOpportunities: false,
        platformNews: false,
        weeklyDigest: false,
        reminders: false,
      }));
      setSaveStatus('success');
      setSaveMessage('You have been unsubscribed from all emails.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage('Failed to unsubscribe. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleResubscribe = async () => {
    setSaveStatus('saving');
    try {
      await resubscribeMutation.mutateAsync();
      setLocalPreferences({
        frequency: 'weekly',
        bookingUpdates: true,
        newOpportunities: true,
        platformNews: false,
        weeklyDigest: true,
        reminders: true,
      });
      setSaveStatus('success');
      setSaveMessage('You have been resubscribed to emails.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage('Failed to resubscribe. Please try again.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  if (preferencesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-slate-600">Loading preferences...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isUnsubscribed = localPreferences.frequency === 'never';

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-700">{saveMessage}</p>
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700">{saveMessage}</p>
        </div>
      )}

      {/* Email Frequency Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-slate-600" />
            <div>
              <CardTitle>Email Frequency</CardTitle>
              <CardDescription>How often would you like to receive emails?</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {['daily', 'weekly', 'never'].map((freq) => (
              <label key={freq} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="radio"
                  name="frequency"
                  value={freq}
                  checked={localPreferences.frequency === freq}
                  onChange={() => handleFrequencyChange(freq as 'daily' | 'weekly' | 'never')}
                  className="w-4 h-4"
                />
                <div>
                  <p className="font-medium text-slate-900 capitalize">{freq}</p>
                  <p className="text-sm text-slate-600">
                    {freq === 'daily' && 'Get updates every day'}
                    {freq === 'weekly' && 'Get a digest once a week'}
                    {freq === 'never' && 'Unsubscribe from all emails'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content Categories Section */}
      {!isUnsubscribed && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-slate-600" />
              <div>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>Choose which types of emails you want to receive</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Booking Updates */}
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={localPreferences.bookingUpdates}
                  onChange={() => handleToggle('bookingUpdates')}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Booking Updates</p>
                  <p className="text-sm text-slate-600">New booking requests, confirmations, and cancellations</p>
                </div>
              </label>

              {/* New Opportunities */}
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={localPreferences.newOpportunities}
                  onChange={() => handleToggle('newOpportunities')}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">New Opportunities</p>
                  <p className="text-sm text-slate-600">Matching artists/venues based on your preferences</p>
                </div>
              </label>

              {/* Weekly Digest */}
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={localPreferences.weeklyDigest}
                  onChange={() => handleToggle('weeklyDigest')}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Weekly Digest</p>
                  <p className="text-sm text-slate-600">Summary of activity and important updates</p>
                </div>
              </label>

              {/* Reminders */}
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={localPreferences.reminders}
                  onChange={() => handleToggle('reminders')}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Event Reminders</p>
                  <p className="text-sm text-slate-600">Reminders for upcoming bookings and events</p>
                </div>
              </label>

              {/* Platform News */}
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={localPreferences.platformNews}
                  onChange={() => handleToggle('platformNews')}
                  className="w-4 h-4 rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-slate-900">Platform News</p>
                  <p className="text-sm text-slate-600">New features, updates, and announcements</p>
                </div>
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saveStatus === 'saving' || isUnsubscribed}
          className="flex-1"
        >
          {saveStatus === 'saving' ? 'Saving...' : 'Save Preferences'}
        </Button>

        {isUnsubscribed ? (
          <Button
            onClick={handleResubscribe}
            variant="outline"
            disabled={saveStatus === 'saving'}
            className="flex-1"
          >
            {saveStatus === 'saving' ? 'Resubscribing...' : 'Resubscribe to Emails'}
          </Button>
        ) : (
          <Button
            onClick={handleUnsubscribeAll}
            variant="outline"
            disabled={saveStatus === 'saving'}
            className="flex-1"
          >
            {saveStatus === 'saving' ? 'Unsubscribing...' : 'Unsubscribe All'}
          </Button>
        )}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> We respect your preferences and will never send you emails you don't want. You can change these settings anytime.
        </p>
      </div>
    </div>
  );
}
