import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, Users, DollarSign, ArrowLeft, MessageSquare, Heart, Share2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { JsonLd, buildEventJsonLd, buildBreadcrumbJsonLd } from '@/components/JsonLd';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { SimilarEvents } from '@/components/SimilarEvents';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';

export default function EventDetail() {
  const { id: idParam } = useParams();
  const eventId = idParam ? parseInt(idParam) : 0;
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Fetch event from real API
  const { data: event, isLoading, error } = trpc.events.getById.useQuery(
    { id: eventId },
    { enabled: eventId > 0 }
  );

  // Check if event is saved by current user
  const { data: isSavedData } = trpc.events.isEventSaved.useQuery(
    { eventId },
    { enabled: isAuthenticated && eventId > 0 }
  );
  const isSaved = isSavedData ?? false;

  const saveEventMutation = trpc.events.saveEvent.useMutation();
  const unsaveEventMutation = trpc.events.unsaveEvent.useMutation();
  const utils = trpc.useUtils();

  // Set SEO meta tags for the event
  useEffect(() => {
    if (event) {
      setMetaTags(pageMetaTags.eventDetail(event.eventTitle, eventId, undefined, event.description || undefined));
    }
  }, [event, eventId]);

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'TBD';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleSaveEvent = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save events');
      return;
    }

    try {
      if (isSaved) {
        await unsaveEventMutation.mutateAsync({ eventId });
        toast.success('Event removed from saved');
      } else {
        await saveEventMutation.mutateAsync({ eventId });
        toast.success('Event saved!');
      }
      utils.events.isEventSaved.invalidate({ eventId });
    } catch (err) {
      toast.error('Failed to save event');
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }
    if (!event) return;

    setIsSendingMessage(true);
    try {
      // Navigate to messages page with the artist context
      navigate(`/messages?artistId=${event.artistId}`);
      toast.success('Redirecting to messages...');
      setMessageDialogOpen(false);
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleNavigateToArtist = () => {
    if (!event) return;
    // Use artistProfileId if available, otherwise fall back to artistId
    const profileId = (event as any).artistProfileId || event.artistId;
    navigate(`/artist/${String(profileId)}`);
  };

  const handleShare = async () => {
    if (navigator.share && event) {
      try {
        await navigator.share({
          title: event.eventTitle,
          text: `Check out this event: ${event.eventTitle}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-slate-100 text-slate-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      wedding: 'Wedding',
      corporate: 'Corporate Event',
      festival: 'Festival',
      bar_gig: 'Bar Gig',
      private_party: 'Private Party',
      concert: 'Concert',
      other: 'Other',
    };
    return labels[type] || type;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SiteHeader />
        <div className="flex justify-center items-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  // Error or not found state
  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
          <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">Event Not Found</h2>
          <p className="text-slate-500 mb-6">This event may have been removed or doesn't exist.</p>
          <Button onClick={() => navigate('/events')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  const artistName = (event as any).artistName || 'Unknown Artist';
  const artistPhoto = (event as any).artistPhoto;
  const artistGenre = (event as any).artistGenre || '';
  const artistBio = (event as any).artistBio || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <JsonLd data={[buildEventJsonLd({
        ...event,
        eventDate: typeof event.eventDate === 'string' ? event.eventDate : (event.eventDate as any)?.toISOString?.()?.split('T')[0] || '',
        rate: event.rate ? String(event.rate) : undefined,
      }), buildBreadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: 'Events', url: '/events' }, { name: event.eventTitle, url: `/events/${eventId}` }])]} id={`event-${eventId}`} />
      <SiteHeader />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Breadcrumb */}
        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Events', href: '/events' },
            { label: event.eventTitle },
          ]}
        />

        {/* Main Event Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{event.eventTitle}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{getEventTypeLabel(event.eventType)}</Badge>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Event Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Date & Time</p>
                  <p className="text-base font-semibold">
                    {formatDate(event.eventDate)}
                    {event.eventTime && ` at ${event.eventTime}`}
                    {event.eventEndTime && ` - ${event.eventEndTime}`}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-600">Location</p>
                  <p className="text-base font-semibold">{event.location || 'TBD'}</p>
                </div>
              </div>

              {event.capacity && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Capacity</p>
                    <p className="text-base font-semibold">{event.capacity} people</p>
                  </div>
                </div>
              )}

              {event.rate && (
                <div className="flex items-start gap-3">
                  <DollarSign className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-600">Rate</p>
                    <p className="text-base font-semibold">${event.rate}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h3 className="font-semibold mb-2">About This Event</h3>
                <p className="text-slate-600 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t flex-wrap">
              <Button
                onClick={handleSaveEvent}
                disabled={saveEventMutation.isPending || unsaveEventMutation.isPending}
                variant={isSaved ? 'default' : 'outline'}
                className="gap-2"
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save Event'}
              </Button>

              <Button
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error('Please sign in to message artists');
                    return;
                  }
                  setMessageDialogOpen(true);
                }}
                variant="outline"
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Message Artist
              </Button>

              <Button
                variant="outline"
                className="gap-2 ml-auto"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Artist Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">About the Artist</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {artistPhoto && (
                <img
                  src={artistPhoto}
                  alt={artistName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{artistName}</h3>
                {artistGenre && (
                  <p className="text-sm text-slate-600">{artistGenre}</p>
                )}
                {artistBio && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2">{artistBio}</p>
                )}
              </div>
            </div>

            <Button
              onClick={handleNavigateToArtist}
              variant="outline"
              className="w-full"
            >
              View Artist Profile
            </Button>
          </CardContent>
        </Card>

        {/* Similar Events */}
        <SimilarEvents eventId={eventId} limit={6} />
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {artistName}</DialogTitle>
            <DialogDescription>
              Send a message about this event
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              rows={4}
            />

            <div className="flex gap-2">
              <Button
                onClick={handleSendMessage}
                disabled={isSendingMessage || !messageText.trim()}
              >
                {isSendingMessage && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Message
              </Button>
              <Button
                variant="outline"
                onClick={() => setMessageDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
