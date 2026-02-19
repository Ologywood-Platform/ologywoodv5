import { useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { ArrowLeft, Calendar, Clock, MapPin, Music, Users, DollarSign } from 'lucide-react';

export default function EventDetail() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [, params] = useRoute('/events/:id');
  const eventId = params?.id ? parseInt(params.id) : 0;

  const [showBookingForm, setShowBookingForm] = useState(false);

  const { data: event, isLoading } = trpc.events.getById.useQuery({ id: eventId }, { enabled: !!eventId });

  const handleBookingClick = () => {
    navigate(`/bookings/create?eventId=${eventId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-8 px-4 flex items-center justify-center">
        <p className="text-gray-600">Loading event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => navigate('/events')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </button>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">Event not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isOwnEvent = event.artistId === user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate('/events')}
          className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Events
        </button>

        {/* Event Details Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{event.eventTitle}</CardTitle>
                <CardDescription className="text-base">{event.eventType}</CardDescription>
              </div>
              {isOwnEvent && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  Your Event
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Key Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div className="flex items-start gap-4">
                <Calendar className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="text-lg font-semibold text-gray-900">{formatDate(event.eventDate)}</p>
                </div>
              </div>

              {/* Time */}
              {event.eventTime && (
                <div className="flex items-start gap-4">
                  <Clock className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatTime(event.eventTime)}
                      {event.eventEndTime && ` - ${formatTime(event.eventEndTime)}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="text-lg font-semibold text-gray-900">{event.location}</p>
                  </div>
                </div>
              )}

              {/* Capacity */}
              {event.capacity && (
                <div className="flex items-start gap-4">
                  <Users className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="text-lg font-semibold text-gray-900">{event.capacity} people</p>
                  </div>
                </div>
              )}

              {/* Rate */}
              {event.rate && (
                <div className="flex items-start gap-4">
                  <DollarSign className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Rate</p>
                    <p className="text-lg font-semibold text-gray-900">{event.rate}</p>
                  </div>
                </div>
              )}

              {/* Audience Type */}
              {event.audienceType && (
                <div className="flex items-start gap-4">
                  <Music className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">Audience</p>
                    <p className="text-lg font-semibold text-gray-900">{event.audienceType}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            {event.description && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About This Event</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Status:</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'available' ? 'bg-green-100 text-green-700' :
                event.status === 'booked' ? 'bg-blue-100 text-blue-700' :
                event.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                'bg-red-100 text-red-700'
              }`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
            </div>

            {/* Booking Button */}
            {!isOwnEvent && event.status === 'available' && (
              <Button
                onClick={handleBookingClick}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                Request Booking for This Event
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
