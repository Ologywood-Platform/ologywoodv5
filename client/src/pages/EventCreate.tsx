import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { EventForm } from '@/components/EventForm';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function EventCreate() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createEventMutation = trpc.events.create.useMutation();

  // Verify user is an artist (after all hooks)
  if (user?.role !== 'artist') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only artists can create events.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Strip currency formatting from rate string (e.g., "$5,000" -> "5000")
  const cleanRate = (rate: string | undefined): string | undefined => {
    if (!rate) return undefined;
    const cleaned = rate.replace(/[^0-9.]/g, '');
    return cleaned || undefined;
  };

  const handleEventCreate = async (eventData: any) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await createEventMutation.mutateAsync({
        eventTitle: eventData.eventTitle,
        eventType: eventData.eventType,
        eventDate: eventData.eventDate,
        eventTime: eventData.eventTime || undefined,
        eventEndTime: eventData.eventEndTime || undefined,
        location: eventData.location,
        capacity: eventData.capacity,
        audienceType: eventData.audienceType || undefined,
        rate: cleanRate(eventData.rate),
        description: eventData.description || undefined,
        isPublic: eventData.isPublic,
      });
      
      toast.success('Event created successfully!');
      // Redirect to event detail page
      navigate(`/events/${result.event.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create event';
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Create Event</h1>
            <p className="text-sm text-slate-600">Post a new event to attract venues and bookings</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-sm text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        <EventForm 
          onSubmit={handleEventCreate}
          isLoading={isSubmitting || createEventMutation.isPending}
        />
      </div>
    </div>
  );
}
