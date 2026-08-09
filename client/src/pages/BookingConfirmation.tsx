import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Calendar, MapPin, DollarSign, MessageSquare, ArrowRight } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { SiteHeader } from "@/components/SiteHeader";

export default function BookingConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const bookingId = id ? parseInt(id, 10) : 0;

  const { data: booking, isLoading } = trpc.booking.getById.useQuery(
    { id: bookingId },
    { enabled: bookingId > 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <SiteHeader />
        <p className="text-gray-600">Loading booking details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <p className="text-gray-600">Booking not found</p>
      </div>
    );
  }

  const eventDate = new Date(booking.eventDate);
  const isArtist = user?.role === 'artist';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <PageBreadcrumb
          className="mb-6"
          segments={[
            { label: 'Dashboard', href: user?.role === 'venue' ? '/venue-dashboard' : '/dashboard' },
            { label: 'Bookings', href: '/bookings' },
            { label: 'Confirmation' },
          ]}
        />
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Request Sent!</h1>
          <p className="text-gray-600">
            {isArtist
              ? 'Your booking request has been sent to the venue. They will review and respond soon.'
              : 'Your booking request has been sent to the artist. They will review and respond soon.'}
          </p>
        </div>

        {/* Booking Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {isArtist ? 'Venue' : 'Artist'}
                </p>
                <p className="font-semibold text-gray-900">
                  {isArtist ? `Venue #${booking.venueId}` : 'Artist'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Booking Status</p>
                <p className="font-semibold text-yellow-600">Pending Review</p>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-600">Event Date</p>
                  <p className="font-semibold text-gray-900">
                    {eventDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {booking.totalFee && (
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Fee</p>
                    <p className="font-semibold text-gray-900">
                      ${typeof booking.totalFee === 'string' ? parseFloat(booking.totalFee).toFixed(2) : (booking.totalFee as number).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {booking.eventDetails && (
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Event Details</p>
                <p className="text-gray-900">{booking.eventDetails}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Review Period</p>
                  <p className="text-sm text-gray-600">
                    The {isArtist ? 'venue' : 'artist'} will review your booking request and respond within 24-48 hours.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-semibold text-blue-600">2</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Confirmation</p>
                  <p className="text-sm text-gray-600">
                    Once they accept, you'll receive a confirmation and can proceed with payment or further details.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-semibold text-blue-600">3</span>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Communication</p>
                  <p className="text-sm text-gray-600">
                    You can message directly through the booking to discuss details, requirements, or any questions.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={() => navigate(`/booking/${bookingId}`)}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            View Booking & Message
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/bookings')}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Back to Bookings
          </Button>
        </div>
      </div>
    </div>
  );
}
