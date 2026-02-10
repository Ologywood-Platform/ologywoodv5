import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';

export function BookingRequests() {
  const [selectedBooking, setSelectedBooking] = useState<number | null>(null);

  // Fetch artist's bookings
  const { data: bookings, isLoading } = useQuery({
    queryKey: ['booking', 'getMyArtistBookings'],
    queryFn: async () => {
      const result = await trpc.booking.getMyArtistBookings.query();
      return result;
    },
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: number; status: 'confirmed' | 'cancelled' | 'completed' }) => {
      return await trpc.booking.updateStatus.mutate({ id: bookingId, status });
    },
    onSuccess: () => {
      // Refetch bookings after status update
      window.location.reload();
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? <Badge className={config.color}>{status}</Badge> : null;
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const statusConfig = {
      unpaid: { color: 'bg-gray-100 text-gray-800' },
      deposit_paid: { color: 'bg-blue-100 text-blue-800' },
      fully_paid: { color: 'bg-green-100 text-green-800' },
      refunded: { color: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[paymentStatus as keyof typeof statusConfig];
    return config ? <Badge className={config.color}>{paymentStatus.replace('_', ' ')}</Badge> : null;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading booking requests...</div>;
  }

  const pendingBookings = bookings?.filter((b) => b.status === 'pending') || [];
  const confirmedBookings = bookings?.filter((b) => b.status === 'confirmed') || [];
  const completedBookings = bookings?.filter((b) => b.status === 'completed') || [];
  const cancelledBookings = bookings?.filter((b) => b.status === 'cancelled') || [];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Booking Requests</h1>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600">{pendingBookings.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Confirmed</div>
          <div className="text-2xl font-bold text-green-600">{confirmedBookings.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-blue-600">{completedBookings.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Cancelled</div>
          <div className="text-2xl font-bold text-red-600">{cancelledBookings.length}</div>
        </Card>
      </div>

      {/* Pending Bookings */}
      {pendingBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Pending Requests</h2>
          <div className="space-y-4">
            {pendingBookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{booking.venueName}</h3>
                    <p className="text-gray-600">
                      {new Date(booking.eventDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {booking.eventTime && ` at ${booking.eventTime}`}
                    </p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>

                {booking.eventDetails && (
                  <p className="text-gray-700 mb-4">{booking.eventDetails}</p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {booking.totalFee && (
                    <div>
                      <span className="text-sm text-gray-600">Total Fee:</span>
                      <p className="text-lg font-semibold">${booking.totalFee}</p>
                    </div>
                  )}
                  {booking.depositAmount && (
                    <div>
                      <span className="text-sm text-gray-600">Deposit:</span>
                      <p className="text-lg font-semibold">${booking.depositAmount}</p>
                    </div>
                  )}
                </div>

                {booking.paymentStatus && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Payment Status:</span>
                    <div className="mt-1">{getPaymentStatusBadge(booking.paymentStatus)}</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: 'confirmed' })}
                    disabled={updateStatusMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => updateStatusMutation.mutate({ bookingId: booking.id, status: 'cancelled' })}
                    disabled={updateStatusMutation.isPending}
                    variant="outline"
                  >
                    Decline
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Confirmed Bookings */}
      {confirmedBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Confirmed Bookings</h2>
          <div className="space-y-4">
            {confirmedBookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{booking.venueName}</h3>
                    <p className="text-gray-600">
                      {new Date(booking.eventDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                      {booking.eventTime && ` at ${booking.eventTime}`}
                    </p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Completed Bookings */}
      {completedBookings.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Completed Bookings</h2>
          <div className="space-y-4">
            {completedBookings.map((booking) => (
              <Card key={booking.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{booking.venueName}</h3>
                    <p className="text-gray-600">
                      {new Date(booking.eventDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {getStatusBadge(booking.status)}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!bookings || bookings.length === 0 && (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">No booking requests yet. Start by browsing venues!</p>
        </Card>
      )}
    </div>
  );
}

export default BookingRequests;
