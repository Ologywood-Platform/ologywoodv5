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
import { JsonLd, buildEventJsonLd, buildBreadcrumbJsonLd } from '@/components/JsonLd';

// Mock event data - replace with API call
const mockEvent = {
  id: 1,
  eventTitle: 'Summer Music Festival 2026',
  eventType: 'Festival',
  eventDate: new Date('2026-06-15'),
  eventTime: '18:00',
  eventEndTime: '23:00',
  location: '123 Main St, New York, NY',
  capacity: 500,
  rate: '$5000',
  description: 'Join us for an amazing summer music festival featuring local and international artists.',
  isPublic: true,
  status: 'available',
  artistId: 1,
  artistName: 'The Amazing Band',
  artistPhoto: 'https://via.placeholder.com/80',
  artistGenre: 'Rock, Alternative',
  artistRating: 4.8,
  artistReviews: 12,
};

export default function EventDetail() {
  const { id: idParam } = useParams();
  const eventId = idParam ? parseInt(idParam) : 0;
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [event, setEvent] = useState(mockEvent);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    // TODO: Fetch event data from API
    // const fetchEvent = async () => {
    //   try {
    //     const response = await fetch(`/api/events/${eventId}`);
    //     if (response.ok) {
    //       const data = await response.json();
    //       setEvent(data);
    //     }
    //   } catch (error) {
    //     toast.error('Failed to load event');
    //   }
    // };
    // fetchEvent();
  }, [eventId]);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const handleSaveEvent = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save events');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Call API to save/unsave event
      // const response = await fetch(`/api/events/${eventId}/save`, {
      //   method: isSaved ? 'DELETE' : 'POST',
      // });
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Event removed from saved' : 'Event saved');
    } catch (error) {
      toast.error('Failed to save event');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setIsSendingMessage(true);
    try {
      // TODO: Send message to artist
      // const response = await fetch('/api/messages', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     recipientId: event.artistId,
      //     message: messageText,
      //     eventId: eventId,
      //   }),
      // });
      toast.success('Message sent to artist');
      setMessageText('');
      setMessageDialogOpen(false);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleNavigateToArtist = () => {
    navigate(`/artist/${String(event.artistId)}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'booked':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {event && <JsonLd data={[buildEventJsonLd({
        ...event,
        eventDate: event.eventDate instanceof Date ? event.eventDate.toISOString().split('T')[0] : event.eventDate,
        rate: typeof event.rate === 'string' ? event.rate.replace('$', '') : event.rate,
      }), buildBreadcrumbJsonLd([{ name: 'Home', url: '/' }, { name: 'Events', url: '/events' }, { name: event.eventTitle, url: `/events/${eventId}` }])]} id={`event-${eventId}`} />}
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('-1')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Event Details</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Main Event Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-3xl mb-2">{event.eventTitle}</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{event.eventType}</Badge>
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
                  <p className="text-base font-semibold">{event.location}</p>
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
                    <p className="text-base font-semibold">{event.rate}</p>
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
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={handleSaveEvent}
                disabled={isLoading}
                variant={isSaved ? 'default' : 'outline'}
                className="gap-2"
              >
                <Heart className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
                {isSaved ? 'Saved' : 'Save Event'}
              </Button>

              <Button
                onClick={() => setMessageDialogOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Message Artist
              </Button>

              <Button
                variant="outline"
                className="gap-2 ml-auto"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Artist Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About the Artist</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              {event.artistPhoto && (
                <img
                  src={event.artistPhoto}
                  alt={event.artistName}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{event.artistName}</h3>
                <p className="text-sm text-slate-600">{event.artistGenre}</p>
                {event.artistRating && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm font-semibold">★ {event.artistRating}</span>
                    <span className="text-xs text-slate-500">({event.artistReviews} reviews)</span>
                  </div>
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
      </div>

      {/* Message Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message {event.artistName}</DialogTitle>
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
