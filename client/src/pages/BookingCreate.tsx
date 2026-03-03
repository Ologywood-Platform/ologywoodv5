import { useState, useEffect } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, MapPin, DollarSign, Music, Building2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import PageBreadcrumb from '@/components/PageBreadcrumb';

export default function BookingCreate() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const searchParams = useSearch();
  
  // Get artist/venue ID from URL params
  const params = new URLSearchParams(searchParams);
  const artistId = params.get('artistId');
  const venueId = params.get('venueId');
  
  const [formData, setFormData] = useState({
    eventDate: '',
    eventTime: '',
    eventDetails: '',
    budget: '',
    notes: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine booking type based on user role and URL params
  const isArtistBooking = venueId && user?.role !== 'artist';
  const isVenueBooking = artistId && user?.role !== 'venue';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      toast.error('Please sign in to create a booking');
      return;
    }

    // Validate that user is trying to book something
    if (!artistId && !venueId) {
      navigate('/');
      toast.error('Invalid booking request');
      return;
    }
  }, [isAuthenticated, artistId, venueId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.eventDate || !formData.eventTime || !formData.eventDetails) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Replace with actual booking API call
      // For now, we'll simulate the booking creation
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Booking request sent successfully!');
      
      // Redirect to bookings page or messages
      navigate('/bookings');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create booking';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPageTitle = () => {
    if (isArtistBooking) {
      return 'Book This Venue';
    } else if (isVenueBooking) {
      return 'Book This Artist';
    }
    return 'Create Booking';
  };

  const getPageDescription = () => {
    if (isArtistBooking) {
      return 'Send a booking request to this venue for your performance';
    } else if (isVenueBooking) {
      return 'Send a booking request to this artist for your event';
    }
    return 'Create a new booking request';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
            <p className="text-sm text-gray-600">{getPageDescription()}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Bookings', href: '/bookings' },
            { label: 'New Booking' },
          ]}
        />
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Provide information about your event or performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Date */}
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
                  required
                />
              </div>

              {/* Event Time */}
              <div className="space-y-2">
                <Label htmlFor="eventTime" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Event Time *
                </Label>
                <Input
                  id="eventTime"
                  type="time"
                  name="eventTime"
                  value={formData.eventTime}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {/* Event Details */}
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

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Budget (Optional)
                </Label>
                <Input
                  id="budget"
                  type="number"
                  name="budget"
                  placeholder="Enter your budget in USD"
                  value={formData.budget}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any additional information or special requests..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
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
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Sending Request...' : 'Send Booking Request'}
                </Button>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-900">
                  <strong>Next Steps:</strong> After sending your booking request, the {isArtistBooking ? 'venue' : 'artist'} will review it and respond through the messaging system. You can track the status in your bookings page.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Booking Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Be specific about your event details</p>
              <p>• Include performance duration and requirements</p>
              <p>• Mention any special requests or equipment needs</p>
              <p>• Set a realistic budget for better response rates</p>
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
              <p>1. Your request is sent to the {isArtistBooking ? 'venue' : 'artist'}</p>
              <p>2. They review and respond via messages</p>
              <p>3. Negotiate terms and confirm details</p>
              <p>4. Complete payment and finalize booking</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
