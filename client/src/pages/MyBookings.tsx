import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { useAuth } from '../_core/hooks/useAuth';
import { Calendar, MapPin, DollarSign, Clock, Music, ChevronRight, Inbox, MessageCircle, CreditCard, Loader2 } from 'lucide-react';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Pending' },
  confirmed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Confirmed' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', label: 'Cancelled' },
  completed: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Completed' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: 'Wedding',
  corporate: 'Corporate Event',
  birthday: 'Birthday Party',
  church: 'Church / Religious',
  festival: 'Festival',
  house_party: 'House Party',
  restaurant: 'Restaurant / Bar',
  other: 'Other',
};

export default function MyBookings() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [payingBookingId, setPayingBookingId] = useState<number | null>(null);

  const { data: bookings, isLoading } = trpc.booking.getMyClientBookings.useQuery(
    undefined,
    { enabled: !!user }
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Music className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign In</h2>
          <p className="text-gray-600 mb-6">Sign in to view your bookings.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const sortedBookings = [...(bookings || [])].sort((a, b) => {
    const dateA = new Date(a.eventDate).getTime();
    const dateB = new Date(b.eventDate).getTime();
    return dateB - dateA;
  });

  const upcomingBookings = sortedBookings.filter(b => {
    const eventDate = new Date(b.eventDate);
    return eventDate >= new Date() && b.status !== 'cancelled';
  });

  const pastBookings = sortedBookings.filter(b => {
    const eventDate = new Date(b.eventDate);
    return eventDate < new Date() || b.status === 'cancelled';
  });

  const formatDate = (date: string | Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handlePayDeposit = async (bookingId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPayingBookingId(bookingId);
    try {
      const response = await fetch('/api/booking-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId, paymentType: 'deposit' }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('[MyBookings] No checkout URL returned:', data.error);
        alert(data.error || 'Failed to start payment. Please try again.');
      }
    } catch (err) {
      console.error('[MyBookings] Payment error:', err);
      alert('Failed to start payment. Please try again.');
    } finally {
      setPayingBookingId(null);
    }
  };

  const handlePayFinal = async (bookingId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPayingBookingId(bookingId);
    try {
      const response = await fetch('/api/booking-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bookingId, paymentType: 'final' }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('[MyBookings] No checkout URL returned:', data.error);
        alert(data.error || 'Failed to start payment. Please try again.');
      }
    } catch (err) {
      console.error('[MyBookings] Payment error:', err);
      alert('Failed to start payment. Please try again.');
    } finally {
      setPayingBookingId(null);
    }
  };

  const BookingCard = ({ booking }: { booking: any }) => {
    const status = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
    const eventType = EVENT_TYPE_LABELS[booking.eventType] || booking.eventType || 'Booking';
    const hasFee = booking.totalFee && parseFloat(booking.totalFee) > 0;
    const isConfirmed = booking.status === 'confirmed';
    const isPending = booking.status === 'pending';
    const isPayable = hasFee && (isConfirmed || isPending);
    const isPaying = payingBookingId === booking.id;

    // Payment status display
    const paymentStatusLabel = (() => {
      switch (booking.paymentStatus) {
        case 'fully_paid': return 'Paid in Full';
        case 'deposit_paid': return 'Deposit Paid';
        case 'refunded': return 'Refunded';
        default: return null;
      }
    })();

    const paymentStatusStyle = (() => {
      switch (booking.paymentStatus) {
        case 'fully_paid':
        case 'deposit_paid':
          return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
        case 'refunded':
          return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
        default:
          return '';
      }
    })();

    return (
      <div
        onClick={() => navigate(`/booking/${booking.id}`)}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md hover:border-purple-300 dark:hover:border-purple-700 transition cursor-pointer"
      >
        <div className="flex items-start gap-4">
          {/* Artist Photo */}
          {booking.artistPhoto ? (
            <img
              src={booking.artistPhoto}
              alt={booking.artistName}
              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <Music className="w-6 h-6 text-purple-600" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-bold text-gray-900 dark:text-white truncate">{booking.artistName}</h3>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-2">{eventType}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(booking.eventDate)}
              </span>
              {booking.eventTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {booking.eventTime}
                </span>
              )}
              {(booking.venueName || booking.venueAddress) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {booking.venueName}{booking.venueAddress ? `, ${booking.venueAddress}` : ''}
                </span>
              )}
              {hasFee && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  ${parseFloat(booking.totalFee).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/messages?bookingId=${booking.id}`);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/20 px-3 py-1.5 rounded-lg transition"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Message Artist
          </button>

          {/* Payment status badge */}
          {paymentStatusLabel && (
            <span className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${paymentStatusStyle}`}>
              <CreditCard className="w-3.5 h-3.5" />
              {paymentStatusLabel}
            </span>
          )}

          {/* Pay Deposit button — show when fee exists, booking is confirmed, and no deposit paid yet */}
          {isPayable && booking.paymentStatus === 'unpaid' && (
            <button
              onClick={(e) => handlePayDeposit(booking.id, e)}
              disabled={isPaying}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
            >
              {isPaying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              Pay Deposit (50%)
            </button>
          )}

          {/* Pay Remaining button — show when deposit is paid but not fully paid */}
          {isPayable && booking.paymentStatus === 'deposit_paid' && (
            <button
              onClick={(e) => handlePayFinal(booking.id, e)}
              disabled={isPaying}
              className="flex items-center gap-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition"
            >
              {isPaying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              Pay Remaining Balance
            </button>
          )}

          <span className="flex-1" />
          <span className="text-xs text-gray-400 dark:text-gray-500">View Details →</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Bookings</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track your artist booking requests</p>
          </div>
          <button
            onClick={() => navigate('/browse')}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
          >
            Browse Artists
          </button>
        </div>

        {sortedBookings.length === 0 ? (
          <div className="text-center py-16">
            <Inbox className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bookings yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              Browse artists and book them for your next event — weddings, parties, corporate events, and more.
            </p>
            <button
              onClick={() => navigate('/browse')}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              Find an Artist
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Upcoming */}
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Upcoming ({upcomingBookings.length})
                </h2>
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}

            {/* Past */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                  Past & Cancelled ({pastBookings.length})
                </h2>
                <div className="space-y-3">
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
