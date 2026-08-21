import { toSlug } from '@/lib/slugify';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Sparkles } from 'lucide-react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { formatEventTime } from '@/lib/utils';

interface SimilarEventsProps {
  eventId: number;
  limit?: number;
}

function formatEventDate(date: string | Date | null): string {
  if (!date) return 'TBD';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getEventTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    wedding: 'Wedding',
    corporate: 'Corporate',
    festival: 'Festival',
    bar_gig: 'Bar Gig',
    private_party: 'Private Party',
    concert: 'Concert',
    other: 'Other',
  };
  return labels[type] || type;
}

function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    wedding: 'bg-pink-100 text-pink-800',
    corporate: 'bg-blue-100 text-blue-800',
    festival: 'bg-purple-100 text-purple-800',
    bar_gig: 'bg-amber-100 text-amber-800',
    private_party: 'bg-emerald-100 text-emerald-800',
    concert: 'bg-indigo-100 text-indigo-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

export function SimilarEvents({ eventId, limit = 6 }: SimilarEventsProps) {
  const { data: similarEvents, isLoading } = trpc.events.getSimilar.useQuery(
    { eventId, limit },
    { enabled: eventId > 0 }
  );

  if (isLoading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          Similar Events
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-5 bg-slate-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-4 bg-slate-200 rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!similarEvents || similarEvents.length === 0) {
    return null; // Don't show the section if no similar events found
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-500" />
        Similar Events
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {similarEvents.map((event) => (
          <Link
            key={event.id}
            href={`/events/${toSlug(event.eventTitle || '')}`}
            className="no-underline"
          >
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-slate-200 hover:border-slate-300">
              <CardContent className="p-4 space-y-3">
                {/* Event type badge */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className={`text-xs ${getEventTypeColor(event.eventType)}`}
                  >
                    {getEventTypeLabel(event.eventType)}
                  </Badge>
                  {event.status === 'available' && (
                    <Badge variant="outline" className="text-xs text-green-700 border-green-300 bg-green-50">
                      Available
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-semibold text-base text-slate-900 line-clamp-2 leading-tight">
                  {event.eventTitle}
                </h3>

                {/* Artist name */}
                {event.artistName && (
                  <p className="text-sm text-slate-500">
                    by {event.artistName}
                  </p>
                )}

                {/* Date */}
                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{formatEventDate(event.eventDate)}</span>
                  {event.eventTime && (
                    <span className="text-slate-400">at {formatEventTime(event.eventTime)}</span>
                  )}
                </div>

                {/* Location */}
                {event.location && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}

                {/* Capacity */}
                {event.capacity && (
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Users className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>{event.capacity} capacity</span>
                  </div>
                )}

                {/* Rate */}
                {event.rate && (
                  <p className="text-sm font-semibold text-slate-900 pt-1 border-t border-slate-100">
                    ${parseFloat(event.rate).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
