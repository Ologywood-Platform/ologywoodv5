import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Home, Search, ArrowLeft } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';

export default function NotFound() {
  const [location, navigate] = useLocation();

  const isArtistPage = location.startsWith('/artist/');
  const isVenuePage = location.startsWith('/venue/') && !location.includes('/venue/events') && !location.includes('/venue/invoice') && !location.includes('/venue-');
  const isEventPage = location.startsWith('/events/');

  const entityType = isArtistPage ? 'artist' : isVenuePage ? 'venue' : isEventPage ? 'event' : 'page';
  const slug = location.split('/').pop() || '';
  const readableName = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const browseUrl = entityType === 'venue' ? '/venues' : entityType === 'event' ? '/events' : '/browse';
  const browseLabel = entityType === 'venue' ? 'Browse Venues' : entityType === 'event' ? 'Browse Events' : 'Browse Artists';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-gray-900 dark:to-purple-950">
      <SiteHeader />
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-8xl font-bold text-purple-200 dark:text-purple-800 mb-2">404</h1>
          <div className="w-24 h-1 bg-purple-500 mx-auto rounded-full" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          {entityType === 'artist' && `We couldn't find "${readableName}"`}
          {entityType === 'venue' && `Venue "${readableName}" not found`}
          {entityType === 'event' && `Event "${readableName}" not found`}
          {entityType === 'page' && 'Page not found'}
        </h2>

        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
          {entityType === 'artist' && 'This artist may have changed their name, removed their profile, or the link may be incorrect.'}
          {entityType === 'venue' && 'This venue may have been removed or the link may be incorrect.'}
          {entityType === 'event' && 'This event may have ended, been cancelled, or the link may be incorrect.'}
          {entityType === 'page' && "The page you're looking for doesn't exist or has been moved."}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.history.back()} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          <Button onClick={() => navigate(browseUrl)} className="gap-2 bg-purple-600 hover:bg-purple-700">
            <Search className="h-4 w-4" />
            {browseLabel}
          </Button>

          <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>

        <p className="text-sm text-gray-400 dark:text-gray-500 mt-12">
          Need help?{' '}
          <a href="/help" className="text-purple-600 hover:underline">Visit our Help Center</a>{' '}
          or use the <a href="/browse" className="text-purple-600 hover:underline">search feature</a> to find what you're looking for.
        </p>
      </div>
    </div>
  );
}
