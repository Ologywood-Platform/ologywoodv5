import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface CalendarFeedData {
  feedUrl: string;
  artistId: number;
  token: string;
}

export function CalendarSync() {
  const [showUrl, setShowUrl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<CalendarFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchFeedUrl = async () => {
      try {
        const res = await fetch('/api/trpc/artist.getCalendarFeedUrl', {
          credentials: 'include',
        });
        if (!res.ok) {
          throw new Error('Failed to fetch calendar feed URL');
        }
        const json = await res.json();
        // tRPC wraps the response in { result: { data: ... } }
        const feedData = json?.result?.data;
        if (feedData) {
          setData(feedData);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeedUrl();
  }, []);

  const handleCopyUrl = async () => {
    if (!data?.feedUrl) return;
    try {
      await navigator.clipboard.writeText(data.feedUrl);
      setCopied(true);
      toast.success('Calendar feed URL copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = data.feedUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success('Calendar feed URL copied to clipboard');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenGoogleCalendar = () => {
    if (!data?.feedUrl) return;
    const googleCalUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(data.feedUrl.replace('https://', 'webcal://').replace('http://', 'webcal://'))}`;
    window.open(googleCalUrl, '_blank');
    toast.info('Opening Google Calendar — paste the feed URL if prompted');
  };

  const handleOpenWebcal = () => {
    if (!data?.feedUrl) return;
    const webcalUrl = data.feedUrl.replace('https://', 'webcal://').replace('http://', 'webcal://');
    window.location.href = webcalUrl;
    toast.info('Opening your default calendar app...');
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

  if (error) {
    return null; // Silently hide if not an artist
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Calendar Sync
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Subscribe to your booking calendar in Google Calendar, Apple Calendar, or Outlook.
            Confirmed bookings will automatically appear and stay updated.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Quick Add Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleOpenGoogleCalendar}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path d="M18.316 5.684H5.684v12.632h12.632V5.684z" fill="#fff"/>
              <path d="M18.316 23.368L23.368 18.316V5.684L18.316.632H5.684L.632 5.684v12.632l5.052 5.052h12.632z" fill="#4285F4"/>
              <path d="M12 18.316c-3.487 0-6.316-2.829-6.316-6.316S8.513 5.684 12 5.684s6.316 2.829 6.316 6.316-2.829 6.316-6.316 6.316z" fill="#fff"/>
              <path d="M12.632 8.526h-1.264v4.106l3.587 2.152.632-1.037-2.955-1.753V8.526z" fill="#4285F4"/>
            </svg>
            Google Calendar
          </button>

          <button
            onClick={handleOpenWebcal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Apple / Outlook
          </button>

          <button
            onClick={() => setShowUrl(!showUrl)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {showUrl ? 'Hide URL' : 'Copy Feed URL'}
          </button>
        </div>

        {/* Feed URL (expandable) */}
        {showUrl && data?.feedUrl && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              iCal Feed URL (paste into any calendar app)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={data.feedUrl}
                className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-mono truncate"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopyUrl}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  copied
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              This URL is private — do not share it publicly. It auto-updates when bookings change.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
