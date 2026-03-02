import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MapPin, Building2, Phone, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface BookingDetailsCardProps {
  booking: {
    id: number;
    venueId: number;
    venueName?: string;
    venueLocation?: string;
    venuePhone?: string;
    eventDate?: string;
    status: string;
    rate?: number;
    notes?: string;
  };
  onViewVenue?: (venueId: number) => void;
}

export function BookingDetailsCard({ booking, onViewVenue }: BookingDetailsCardProps) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{booking.venueName || 'Venue'}</CardTitle>
            <Badge className="mt-2" variant={booking.status === 'confirmed' ? 'default' : 'outline'}>
              {booking.status}
            </Badge>
          </div>
          {onViewVenue && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewVenue(booking.venueId)}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Venue
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {booking.venueLocation && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{booking.venueLocation}</span>
          </div>
        )}
        
        {booking.venuePhone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <a href={`tel:${booking.venuePhone}`} className="text-primary hover:underline">
              {booking.venuePhone}
            </a>
          </div>
        )}
        
        {booking.eventDate && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(booking.eventDate), 'MMMM d, yyyy')}</span>
          </div>
        )}
        
        {booking.rate && (
          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold">Rate: ${booking.rate}</span>
          </div>
        )}
        
        {booking.notes && (
          <div className="text-sm text-muted-foreground pt-2 border-t">
            <p className="font-semibold mb-1">Notes:</p>
            <p>{booking.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
