import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, Users, DollarSign, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface EventBookingFlowProps {
  eventData: {
    eventId: number;
    eventTitle: string;
    eventDate: string | Date;
    eventTime?: string;
    location: string;
    capacity?: number;
    rate?: string;
    artistId: number;
    artistName: string;
  };
  onBookingComplete: (bookingData: any) => void;
  isLoading?: boolean;
}

export function EventBookingFlow({
  eventData,
  onBookingComplete,
  isLoading = false,
}: EventBookingFlowProps) {
  const [step, setStep] = useState<'confirm' | 'details' | 'complete'>('confirm');
  const [formData, setFormData] = useState({
    venueNotes: '',
    specialRequests: '',
  });

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleConfirm = () => {
    setStep('details');
  };

  const handleSubmit = async () => {
    try {
      await onBookingComplete({
        eventId: eventData.eventId,
        artistId: eventData.artistId,
        venueNotes: formData.venueNotes,
        specialRequests: formData.specialRequests,
      });
      setStep('complete');
      toast.success('Booking confirmed! The artist will review your request.');
    } catch (error) {
      toast.error('Failed to complete booking');
    }
  };

  if (step === 'confirm') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Confirm Event Booking</CardTitle>
          <CardDescription>Review the event details before sending your booking request</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Summary */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg">{eventData.eventTitle}</h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(eventData.eventDate)} {eventData.eventTime && `at ${eventData.eventTime}`}</span>
              </div>
              
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="h-4 w-4" />
                <span>{eventData.location}</span>
              </div>
              
              {eventData.capacity && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Users className="h-4 w-4" />
                  <span>Capacity: {eventData.capacity}</span>
                </div>
              )}
              
              {eventData.rate && (
                <div className="flex items-center gap-2 text-slate-600">
                  <DollarSign className="h-4 w-4" />
                  <span>Rate: {eventData.rate}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm"><span className="font-medium">Artist:</span> {eventData.artistName}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <p className="text-xs text-muted-foreground">
            This sends a booking request — the artist will review and accept or message you to discuss details.
          </p>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.history.back()}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirm}
            >
              Continue <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'details') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Add Booking Details</CardTitle>
          <CardDescription>Tell the artist about your event and any special requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venueNotes">Event Details (Optional)</Label>
            <Textarea
              id="venueNotes"
              placeholder="Tell the artist about your venue, audience, and event atmosphere..."
              value={formData.venueNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, venueNotes: e.target.value }))}
              className="min-h-24"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialRequests">Special Requests (Optional)</Label>
            <Textarea
              id="specialRequests"
              placeholder="Any specific songs, technical requirements, or setup preferences?"
              value={formData.specialRequests}
              onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
              className="min-h-24"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setStep('confirm')}
            >
              Back
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? 'Booking...' : 'Complete Booking'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-green-600">Booking Confirmed! ✓</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <p className="text-sm text-slate-600">
            Your booking request has been sent to <span className="font-semibold">{eventData.artistName}</span>
          </p>
          <p className="text-sm text-slate-600">
            They'll review your request and get back to you within 24 hours.
          </p>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg text-sm">
          <p className="text-blue-900">
            <span className="font-semibold">What happens next?</span><br />
            Check your messages for updates on this booking.
          </p>
        </div>

        <Button
          className="w-full"
          onClick={() => window.location.href = '/'}
        >
          Back to Home
        </Button>
      </CardContent>
    </Card>
  );
}
