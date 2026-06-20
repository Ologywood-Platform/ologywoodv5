import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

export function GoogleCalendarSync() {
  const [, setLocation] = useLocation();
  const [syncing, setSyncing] = useState(false);

  // Check for gcal callback params in the URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gcalStatus = params.get('gcal');
    if (gcalStatus === 'connected') {
      toast.success('Google Calendar connected successfully! Your busy times are now synced.');
      // Remove the query params from the URL without a full reload
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    } else if (gcalStatus === 'error') {
      const reason = params.get('reason') || 'unknown';
      toast.error(`Failed to connect Google Calendar: ${reason}`);
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  // Query to check if Google Calendar is connected
  const { data: integration, isLoading, refetch } = trpc.profileAnalytics.getGoogleCalendarStatus.useQuery();
  const syncMutation = trpc.profileAnalytics.syncGoogleCalendar.useMutation({
    onSuccess: (data: { synced: number }) => {
      toast.success(`Calendar synced! ${data.synced} busy dates imported.`);
      refetch();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Failed to sync calendar');
    },
    onSettled: () => setSyncing(false),
  });

  const disconnectMutation = trpc.profileAnalytics.disconnectGoogleCalendar.useMutation({
    onSuccess: () => {
      toast.success('Google Calendar disconnected');
      refetch();
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Failed to disconnect');
    },
  });

  const handleConnect = () => {
    // Redirect to the Google Calendar OAuth flow
    window.location.href = '/api/calendar-sync/google/connect';
  };

  const handleSync = () => {
    setSyncing(true);
    syncMutation.mutate();
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect Google Calendar? Your manually set availability will not be affected.')) {
      disconnectMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none">
              <path d="M18.316 5.684H5.684v12.632h12.632V5.684z" fill="#fff"/>
              <path d="M18.316 23.368L23.368 18.316V5.684L18.316.632H5.684L.632 5.684v12.632l5.052 5.052h12.632z" fill="#4285F4"/>
              <path d="M12 18.316c-3.487 0-6.316-2.829-6.316-6.316S8.513 5.684 12 5.684s6.316 2.829 6.316 6.316-2.829 6.316-6.316 6.316z" fill="#fff"/>
              <path d="M12.632 8.526h-1.264v4.106l3.587 2.152.632-1.037-2.955-1.753V8.526z" fill="#4285F4"/>
            </svg>
            Google Calendar Sync
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {integration?.connected
              ? 'Your Google Calendar is connected. Busy times are automatically imported as unavailable dates.'
              : 'Connect your Google Calendar to automatically block off busy dates in your availability.'}
          </p>
        </div>
      </div>

      {integration?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>
              Connected{integration.googleEmail ? ` (${integration.googleEmail})` : ''}
              {integration.lastSyncedAt && (
                <span className="text-green-600 ml-1">
                  · Last synced {new Date(integration.lastSyncedAt).toLocaleDateString()}
                </span>
              )}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {syncing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Now
                </>
              )}
            </button>

            <button
              onClick={handleDisconnect}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
            >
              Disconnect
            </button>
          </div>

          <p className="text-xs text-gray-400">
            Sync imports busy events from the next 90 days. Manually set availability won't be overridden.
          </p>
        </div>
      ) : (
        <div>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Connect Google Calendar
          </button>
          <p className="text-xs text-gray-400 mt-2">
            We only read your calendar events (no write access). Busy times will be marked as unavailable in your Ologywood availability.
          </p>
        </div>
      )}
    </div>
  );
}
