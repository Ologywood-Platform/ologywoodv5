import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Calendar, MapPin, Users, DollarSign, Heart, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { EventBookingFlow } from '@/components/EventBookingFlow';

interface EventCardProps {
  id: number;
  eventTitle: string;
  eventType: string;
  eventDate: Date | string;
  eventTime?: string;
  location: string;
  capacity?: number;
  rate?: string;
  artistName: string;
  artistId: number;
  artistPhoto?: string;
  isPublic: boolean;
  status: 'available' | 'booked' | 'cancelled';
  onSave?: (eventId: number) => void;
  onMessage?: (artistId: number, artistName: string) => void;
  onBook?: (eventId: number, eventData: any) => void;
  isSaved?: boolean;
  showActions?: boolean;
}

export function EventCard({
  id,
  eventTitle,
  eventType,
  eventDate,
  eventTime,
  location,
  capacity,
  rate,
  artistName,
  artistId,
  artistPhoto,
  status,
  onSave,
  onMessage,
  onBook,
  isSaved = false,
  showActions = true,
}: EventCardProps) {
  const [, navigate] = useLocation();
  const [saved, setSaved] = useState(isSaved);
  const [showBookingFlow, setShowBookingFlow] = useState(false);

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSave) {
      onSave(id);
      setSaved(!saved);
      toast.success(saved ? 'Event removed from saved' : 'Event saved');
    }
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMessage) {
      onMessage(artistId, artistName);
    }
  };

  const handleBookingComplete = async (bookingData: any) => {
    try {
      if (onBook) {
        await onBook(id, {
          eventId: id,
          eventTitle,
          eventDate,
          eventTime,
          location,
          capacity,
          rate,
          artistId,
          artistName,
          ...bookingData,
        });
      }
      setShowBookingFlow(false);
    } catch (error) {
      console.error('Booking failed:', error);
    }
  };

  const handleCardClick = () => {
    navigate(`/events/${id}`);
  };

  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{eventTitle}</CardTitle>
            <CardDescription className="text-sm mt-1">{eventType}</CardDescription>
          </div>
          <Badge className={getStatusColor(status)} variant="outline">
            {status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3 pb-3">
        {/* Artist Info */}
        <div className="flex items-center gap-2">
          {artistPhoto ? (
            <img
              src={artistPhoto}
              alt={artistName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
          )}
          <span className="text-sm font-medium truncate">{artistName}</span>
        </div>

        {/* Event Details */}
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {formatDate(eventDate)} {eventTime && `at ${eventTime}`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </div>

          {capacity && (
            <div className="flex items-center gap-2 text-slate-600">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span>Capacity: {capacity}</span>
            </div>
          )}

          {rate && (
            <div className="flex items-center gap-2 text-slate-600">
              <DollarSign className="h-4 w-4 flex-shrink-0" />
              <span>{rate}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 mt-auto pt-2">
            {status === 'available' && (
              <Dialog open={showBookingFlow} onOpenChange={setShowBookingFlow}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Book Now
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md p-0 border-0">
                  <DialogTitle className="sr-only">Book Event</DialogTitle>
                  <DialogDescription className="sr-only">Complete your booking for this event</DialogDescription>
                  <EventBookingFlow
                    eventData={{
                      eventId: id,
                      eventTitle,
                      eventDate,
                      eventTime,
                      location,
                      capacity,
                      rate,
                      artistId,
                      artistName,
                    }}
                    onBookingComplete={handleBookingComplete}
                  />
                </DialogContent>
              </Dialog>
            )}
            <Button
              size="sm"
              variant="outline"
              className={status === 'available' ? '' : 'flex-1'}
              onClick={handleMessage}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
            >
              <Heart
                className={`h-4 w-4 ${saved ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
