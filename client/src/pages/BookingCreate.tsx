import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, DollarSign, Music, Building2, ArrowLeft, Loader2, CheckCircle2, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import PageBreadcrumb from '@/components/PageBreadcrumb';

export default function BookingCreate() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  
  const params = new URLSearchParams(searchParams);
  const artistId = params.get('artistId');
  const isRebook = params.get('rebook') === 'true';
  
  const [formData, setFormData] = useState({
    eventDate: params.get('date') || '',
    eventTime: '',
    eventDetails: '',
    budget: params.get('totalFee') || '',
    notes: isRebook ? 'Rebooking from a previous engagement' : '',
    paymentTermsType: (params.get('paymentTermsType') || 'flat_guarantee') as 'flat_guarantee' | 'door_split' | 'guarantee_vs_percentage',
    doorSplitArtistPercent: params.get('doorSplitArtistPercent') || '80',
    guaranteeAmount: params.get('guaranteeAmount') || '',
  });

  // Get venue profile for the logged-in user
  const { data: venueProfile } = trpc.venue.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'venue',
  });

  // Get artist info to display who we're booking
  const { data: artistProfile } = trpc.artist.getProfile.useQuery(
    { id: Number(artistId) },
    { enabled: !!artistId }
  );

  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // The real booking create mutation
  const createBookingMutation = trpc.booking.create.useMutation({
    onSuccess: () => {
      setBookingConfirmed(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create booking');
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      toast.error('Please sign in to create a booking');
      return;
    }
    if (!artistId) {
      navigate('/browse');
      toast.error('Please select an artist to book');
      return;
    }
    if (user?.role !== 'venue') {
      navigate('/dashboard');
      toast.error('Only venues can create bookings');
      return;
    }
  }, [isAuthenticated, artistId, user?.role]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.eventDate || !formData.eventDetails) {
      toast.error('Please fill in the event date and details');
      return;
    }

    if (!venueProfile) {
      toast.error('Please complete your venue profile first');
      navigate('/onboarding/venue');
      return;
    }

    createBookingMutation.mutate({
      artistId: Number(artistId),
      eventDate: formData.eventDate,
      eventTime: formData.eventTime || undefined,
      venueName: venueProfile.organizationName || 'Unknown Venue',
      venueAddress: venueProfile.location || undefined,
      eventDetails: formData.eventDetails + (formData.notes ? `\n\nAdditional Notes: ${formData.notes}` : ''),
      totalFee: formData.budget ? Number(formData.budget) : undefined,
      paymentTermsType: formData.paymentTermsType,
      doorSplitArtistPercent: formData.paymentTermsType !== 'flat_guarantee' ? Number(formData.doorSplitArtistPercent) || 80 : undefined,
      guaranteeAmount: formData.paymentTermsType === 'guarantee_vs_percentage' ? Number(formData.guaranteeAmount) || undefined : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1 as any)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isRebook ? `Rebook ${artistProfile?.artistName || 'Artist'}` : artistProfile ? `Book ${artistProfile.artistName}` : 'Create Booking'}
            </h1>
            <p className="text-sm text-gray-600">
              {isRebook ? 'Previous payment terms have been pre-filled' : 'Send a booking request to this artist for your event'}
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Dashboard', href: '/venue-dashboard' },
            { label: 'Bookings', href: '/bookings' },
            { label: 'New Booking' },
          ]}
        />

        {/* Booking Confirmation Success Screen */}
        {bookingConfirmed && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="py-12 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-green-900">Booking Request Sent!</h2>
                <p className="text-green-700 max-w-md mx-auto">
                  Your booking request has been sent to <strong>{artistProfile?.artistName || 'the artist'}</strong>. They will review it and respond through the messaging system.
                </p>
              </div>
              <div className="bg-white/60 rounded-lg p-4 max-w-sm mx-auto text-left space-y-2">
                <p className="text-sm text-green-800 font-medium">What happens next:</p>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>1. The artist reviews your request</li>
                  <li>2. They accept, decline, or message you</li>
                  <li>3. Once accepted, you'll receive a confirmation</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Button onClick={() => navigate('/bookings')} className="gap-2">
                  <Calendar className="h-4 w-4" />
                  View My Bookings
                </Button>
                <Button variant="outline" onClick={() => navigate('/messages')} className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Go to Messages
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!bookingConfirmed && (
        <>
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Provide information about your event
              {artistProfile && ` — booking ${artistProfile.artistName}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="eventDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Date *
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventTime" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Time
                </Label>
                <Input
                  id="eventTime"
                  type="time"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventDetails" className="flex items-center gap-2">
                  <Music className="h-4 w-4" />
                  Event Details *
                </Label>
                <Textarea
                  id="eventDetails"
                  name="eventDetails"
                  placeholder="Describe the event, performance type, duration, audience size, etc."
                  value={formData.eventDetails}
                  onChange={handleInputChange}
                  rows={4}
                  required
                />
              </div>

              {/* Payment Terms Section */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment Terms
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="paymentTermsType">Payment Structure</Label>
                  <select
                    id="paymentTermsType"
                    name="paymentTermsType"
                    value={formData.paymentTermsType}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentTermsType: e.target.value as any }))}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="flat_guarantee">Flat Guarantee (fixed fee)</option>
                    <option value="door_split">Door Split (percentage of door revenue)</option>
                    <option value="guarantee_vs_percentage">Guarantee vs. Percentage (whichever is higher)</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    {formData.paymentTermsType === 'flat_guarantee' && 'Artist receives a fixed agreed-upon fee regardless of attendance.'}
                    {formData.paymentTermsType === 'door_split' && 'Artist receives a percentage of the door revenue after the show.'}
                    {formData.paymentTermsType === 'guarantee_vs_percentage' && 'Artist receives whichever is higher: the guarantee or their percentage of door revenue.'}
                  </p>
                </div>

                {formData.paymentTermsType === 'flat_guarantee' && (
                  <div className="space-y-2">
                    <Label htmlFor="budget">Guaranteed Fee (USD)</Label>
                    <Input
                      id="budget"
                      type="number"
                      name="budget"
                      placeholder="e.g. 500"
                      value={formData.budget}
                      onChange={handleInputChange}
                      min="0"
                      step="50"
                    />
                  </div>
                )}

                {formData.paymentTermsType === 'door_split' && (
                  <div className="space-y-2">
                    <Label htmlFor="doorSplitArtistPercent">Artist's Door Split (%)</Label>
                    <Input
                      id="doorSplitArtistPercent"
                      type="number"
                      name="doorSplitArtistPercent"
                      placeholder="80"
                      value={formData.doorSplitArtistPercent}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-gray-500">
                      Venue keeps {100 - (parseInt(formData.doorSplitArtistPercent) || 0)}%
                    </p>
                  </div>
                )}

                {formData.paymentTermsType === 'guarantee_vs_percentage' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="guaranteeAmount">Guarantee (USD)</Label>
                      <Input
                        id="guaranteeAmount"
                        type="number"
                        name="guaranteeAmount"
                        placeholder="e.g. 300"
                        value={formData.guaranteeAmount}
                        onChange={handleInputChange}
                        min="0"
                        step="50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="doorSplitArtistPercent">Door Split (%)</Label>
                      <Input
                        id="doorSplitArtistPercent"
                        type="number"
                        name="doorSplitArtistPercent"
                        placeholder="80"
                        value={formData.doorSplitArtistPercent}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                      />
                    </div>
                    <p className="col-span-2 text-xs text-gray-500">
                      Artist gets whichever is higher: ${formData.guaranteeAmount || '0'} guarantee or {formData.doorSplitArtistPercent || '80'}% of door revenue
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional information or special requests..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1 as any)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createBookingMutation.isPending}
                  className="flex-1"
                >
                  {createBookingMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending Request...
                    </>
                  ) : (
                    'Send Booking Request'
                  )}
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-900">
                  <strong>Next Steps:</strong> After sending your booking request, the artist will review it and respond through the messaging system. You can track the status in your bookings page.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Booking Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>Be specific about your event details</p>
              <p>Include performance duration and requirements</p>
              <p>Mention any special requests or equipment needs</p>
              <p>Set a realistic budget for better response rates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Music className="h-5 w-5" />
                What Happens Next
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>1. Your request is sent to the artist</p>
              <p>2. They review and respond via messages</p>
              <p>3. Negotiate terms and confirm details</p>
              <p>4. Complete payment and finalize booking</p>
            </CardContent>
          </Card>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
