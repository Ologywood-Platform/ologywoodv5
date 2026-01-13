import { useParams, useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';
import BookingMessages from '@/components/BookingMessages';

export default function BookingDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const bookingId = parseInt(params.id || '0');

  const { data: booking, isLoading, refetch } = trpc.booking.getById.useQuery({ id: bookingId });
  const updateStatusMutation = trpc.booking.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Booking status updated');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update booking');
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!booking || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Booking not found</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const isArtist = user.role === 'artist';
  const canUpdateStatus = isArtist;

  const handleStatusUpdate = (status: 'confirmed' | 'cancelled') => {
    if (window.confirm(`Are you sure you want to ${status === 'confirmed' ? 'confirm' : 'cancel'} this booking?`)) {
      updateStatusMutation.mutate({ id: bookingId, status });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const eventDate = booking.eventDate instanceof Date 
    ? booking.eventDate 
    : new Date(booking.eventDate);

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-teal-50 py-12">
      <div className="container max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/dashboard')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          {/* Booking Header */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{booking.venueName}</h1>
                <Badge className={getStatusColor(booking.status)}>
                  {booking.status.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Event Date</p>
                  <p className="font-medium">
                    {eventDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>

              {booking.eventTime && (
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Event Time</p>
                    <p className="font-medium">{booking.eventTime}</p>
                  </div>
                </div>
              )}

              {booking.venueAddress && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Venue Address</p>
                    <p className="font-medium">{booking.venueAddress}</p>
                  </div>
                </div>
              )}

              {booking.totalFee && (
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Fee</p>
                    <p className="font-medium">${booking.totalFee}</p>
                  </div>
                </div>
              )}
            </div>

            {booking.eventDetails && (
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-2">Event Details</p>
                <p className="text-sm">{booking.eventDetails}</p>
              </div>
            )}

            {/* Action Buttons */}
            {canUpdateStatus && booking.status === 'pending' && (
              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1"
                >
                  Confirm Booking
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1"
                >
                  Decline Booking
                </Button>
              </div>
            )}

            {booking.status === 'confirmed' && canUpdateStatus && (
              <div className="mt-6">
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updateStatusMutation.isPending}
                >
                  Cancel Booking
                </Button>
              </div>
            )}
          </Card>

          {/* Messages */}
          <BookingMessages bookingId={bookingId} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
