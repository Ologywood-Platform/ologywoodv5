import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { formatEventTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, DollarSign, Clock, Camera } from 'lucide-react';
import { toast } from 'sonner';
import BookingMessages from '@/components/BookingMessages';
import { ReviewForm } from '@/components/ReviewForm';
import { VenueReviewForm } from '@/components/VenueReviewForm';
import ArtistReviewForm from '@/components/ArtistReviewForm';
import PaymentSection from '@/components/PaymentSection';
import TestModeBadge from '@/components/TestModeBadge';
import { RiderContractSigning } from '@/components/RiderContractSigning';
import { RiderAttach } from '@/components/RiderAttach';
import { RiderRevisionPanel } from '@/components/RiderRevisionPanel';
import { VenueContractSection } from '@/components/VenueContractSection';
import { Star } from 'lucide-react';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookingDetailSkeleton } from '@/components/SkeletonLoader';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import ReportIssueDialog from '@/components/ReportIssueDialog';
import { useParams, useLocation } from 'wouter';
import { useEffect, useRef } from 'react';

export default function BookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const bookingId = id ? parseInt(id, 10) : 0;
  const paymentVerified = useRef(false);

  const { data: booking, isLoading, refetch } = trpc.booking.getById.useQuery({ id: bookingId }, { enabled: bookingId > 0 });
  const verifyPayment = trpc.payment.verifyPayment.useMutation();

  // Auto-verify payment when returning from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success' && bookingId > 0 && !paymentVerified.current) {
      paymentVerified.current = true;
      toast.info('Verifying your payment...');
      verifyPayment.mutateAsync({ bookingId }).then((result) => {
        if (result.updated) {
          toast.success(result.status === 'deposit_paid' 
            ? 'Deposit payment confirmed! The booking has been updated.' 
            : 'Payment confirmed! The booking is now fully paid.');
          refetch();
        } else if (result.status !== 'unpaid') {
          toast.success('Payment already recorded.');
          refetch();
        } else {
          toast.info('Payment is being processed. It may take a moment to update.');
          // Retry after a short delay
          setTimeout(() => {
            verifyPayment.mutateAsync({ bookingId }).then((retryResult) => {
              if (retryResult.updated) {
                toast.success('Payment confirmed!');
                refetch();
              }
            }).catch(() => {});
          }, 5000);
        }
        // Clean up URL
        window.history.replaceState({}, '', `/booking/${bookingId}`);
      }).catch(() => {
        toast.error('Could not verify payment. Please refresh the page.');
      });
    }
  }, [bookingId]);
  const { data: existingReview } = trpc.review.getByBooking.useQuery({ bookingId }, { enabled: bookingId > 0 });
  const { data: existingVenueReview } = trpc.venueReview.getByBooking.useQuery({ bookingId }, { enabled: bookingId > 0 });
  const { data: existingArtistReview } = trpc.artistReview.getByBooking.useQuery({ bookingId }, { enabled: bookingId > 0 });
  const updateStatusMutation = trpc.booking.updateStatus.useMutation({
    onSuccess: () => {
      toast.success('Booking status updated');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update booking');
    },
  });

  if (!bookingId || bookingId === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Invalid booking ID</p>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BookingDetailSkeleton />
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

  const isArtist = booking.bookingRole === 'artist';
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
        <PageBreadcrumb
          className="mb-6"
          segments={[
            { label: 'Dashboard', href: user?.role === 'venue' ? '/venue-dashboard' : '/dashboard' },
            { label: 'Bookings', href: '/bookings' },
            { label: `Booking #${id}` },
          ]}
        />

        <div className="space-y-6">
          {/* Booking Header */}
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <a href={`/venue/${booking.venueId}`} className="hover:underline cursor-pointer">
                  <h1 className="text-3xl font-bold mb-2">Event Booking</h1>
                </a>
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
                    <p className="font-medium">{formatEventTime(booking.eventTime)}</p>
                  </div>
                </div>
              )}

              {booking.eventDetails && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Event Details</p>
                    <p className="font-medium">{booking.eventDetails}</p>
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

            {/* Payment Terms */}
            {(booking as any).paymentTermsType && (booking as any).paymentTermsType !== 'flat_guarantee' && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Terms
                </h3>
                <div className="text-sm text-slate-600 space-y-1">
                  {(booking as any).paymentTermsType === 'door_split' && (
                    <>
                      <p className="font-medium text-slate-800">Door Split</p>
                      <p>Artist receives {(booking as any).doorSplitArtistPercent || 80}% of door revenue</p>
                      <p>Venue retains {100 - ((booking as any).doorSplitArtistPercent || 80)}% of door revenue</p>
                    </>
                  )}
                  {(booking as any).paymentTermsType === 'guarantee_vs_percentage' && (
                    <>
                      <p className="font-medium text-slate-800">Guarantee vs. Percentage</p>
                      <p>Minimum guarantee: ${(booking as any).guaranteeAmount || '0'}</p>
                      <p>OR {(booking as any).doorSplitArtistPercent || 80}% of door — whichever is higher</p>
                    </>
                  )}
                </div>
              </div>
            )}

            {(booking as any).paymentTermsType === 'flat_guarantee' && booking.totalFee && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Terms
                </h3>
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-800">Flat Guarantee</p>
                  <p>Artist receives ${booking.totalFee} regardless of door revenue</p>
                </div>
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
              <div className="mt-6 flex items-center gap-3">
                <Button
                  variant="destructive"
                  onClick={() => handleStatusUpdate('cancelled')}
                  disabled={updateStatusMutation.isPending}
                >
                  Cancel Booking
                </Button>
                <ReportIssueDialog bookingId={bookingId} onDisputeFiled={() => refetch()} />
              </div>
            )}

            {/* Report Issue - available on completed or cancelled bookings */}
            {(booking.status === 'completed' || booking.status === 'cancelled') && (
              <div className="mt-6 flex items-center gap-3">
                <ReportIssueDialog bookingId={bookingId} onDisputeFiled={() => refetch()} />
                {/* Rebook shortcut for venues */}
                {booking.bookingRole === 'venue' && (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      const params = new URLSearchParams({
                        artistId: booking.artistId?.toString() || '',
                        paymentTermsType: (booking as any).paymentTermsType || 'flat_guarantee',
                        ...(booking.totalFee ? { totalFee: booking.totalFee } : {}),
                        ...((booking as any).doorSplitArtistPercent ? { doorSplitArtistPercent: (booking as any).doorSplitArtistPercent.toString() } : {}),
                        ...((booking as any).guaranteeAmount ? { guaranteeAmount: (booking as any).guaranteeAmount } : {}),
                      });
                      navigate(`/booking/create?rebook=true&${params.toString()}`);
                    }}
                  >
                    <Calendar className="h-4 w-4" />
                    Rebook Artist
                  </Button>
                )}
              </div>
            )}
          </Card>
          
          {/* Test Mode Notice */}
          <TestModeBadge showTestCard />

          {/* Payment Section */}
          <PaymentSection
            bookingId={bookingId}
            totalFee={booking.totalFee ? Number(booking.totalFee) : undefined}
            depositAmount={booking.depositAmount ? Number(booking.depositAmount) : undefined}
            paymentStatus={booking.paymentStatus || 'unpaid'}
            isVenue={booking.bookingRole === 'venue'}
            bookingStatus={booking.status}
            depositPaidAt={(booking as any).depositPaidAt || null}
            finalPaidAt={(booking as any).finalPaidAt || null}
          />

          {/* Rider Attach (for artists without a rider on this booking) */}
          <RiderAttach
            bookingId={bookingId}
            currentUserRole={booking.bookingRole === 'venue' ? 'venue' : 'artist'}
            hasRider={!!booking.riderTemplateId}
            onRiderAttached={() => refetch()}
          />

          {/* Rider Contract & E-Signature */}
          {booking.riderTemplateId && (
            <RiderContractSigning
              bookingId={bookingId}
              currentUserRole={booking.bookingRole === 'venue' ? 'venue' : 'artist'}
              onSigningComplete={() => refetch()}
            />
          )}

          {/* Rider Revision Panel - propose/review changes before signing */}
          {booking.riderTemplateId && (
            <RiderRevisionPanel
              bookingId={bookingId}
              currentUserRole={booking.bookingRole === 'venue' ? 'venue' : 'artist'}
              riderData={{}}
              contractStatus={booking.riderStatus === 'signed' ? 'fully_signed' : undefined}
            />
          )}

          {/* Venue Agreement / Contract */}
          <VenueContractSection
            bookingId={bookingId}
            currentUserRole={booking.bookingRole === 'venue' ? 'venue' : 'artist'}
            onContractChange={() => refetch()}
          />

          {/* Add to Portfolio - Only show for artists on completed bookings */}
          {booking.bookingRole === 'artist' && booking.status === 'completed' && (
            <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
              <CardContent className="py-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Add to Your Portfolio</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Showcase this performance in your portfolio with photos and details
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 shrink-0"
                  onClick={() => {
                    const params = new URLSearchParams({
                      eventName: booking.eventDetails || 'Performance',
                      eventDate: booking.eventDate ? new Date(booking.eventDate).toISOString().split('T')[0] : '',
                      bookingId: bookingId.toString(),
                    });
                    navigate(`/artists/${booking.artistId}/history?addFromBooking=true&${params.toString()}`);
                  }}
                >
                  <Camera className="h-4 w-4" />
                  Add to Portfolio
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Artist Review of Venue - Only show for artists on completed bookings */}
          {booking.bookingRole === 'artist' && booking.status === 'completed' && (
            <div>
              {existingVenueReview ? (
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle>Your Review of the Venue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= existingVenueReview.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    {existingVenueReview.comment && (
                      <p className="text-muted-foreground">{existingVenueReview.comment}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      Submitted on {new Date(existingVenueReview.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <VenueReviewForm
                  bookingId={bookingId}
                  venueId={booking.venueId}
                  venueName="Venue"
                  onReviewSubmitted={() => refetch()}
                />
              )}
            </div>
          )}

          {/* Venue Review of Artist - Only show for venues on completed bookings */}
          {booking.bookingRole === 'venue' && booking.status === 'completed' && (
            <div>
              {existingArtistReview ? (
                <Card className="p-6">
                  <CardHeader>
                    <CardTitle>Your Artist Review</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (existingArtistReview.rating ?? 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    {existingArtistReview.comment && (
                      <p className="text-muted-foreground">{existingArtistReview.comment}</p>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">
                      Submitted on {new Date(existingArtistReview.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <ArtistReviewForm
                  bookingId={bookingId}
                  artistId={booking.artistId}
                  artistName={(booking as any).artistName || 'this artist'}
                  onSuccess={() => refetch()}
                />
              )}
            </div>
          )}

          {/* Messages */}
          <BookingMessages bookingId={bookingId} currentUserId={user.id} />
        </div>
      </div>
    </div>
  );
}
