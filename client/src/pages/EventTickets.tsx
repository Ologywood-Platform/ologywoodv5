import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { TicketTierManager } from '@/components/TicketTierManager';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';

export default function EventTickets() {
  const { id: idParam } = useParams();
  const eventId = idParam ? parseInt(idParam) : 0;
  const [, navigate] = useLocation();

  const { data: event, isLoading } = trpc.events.getById.useQuery(
    { id: eventId },
    { enabled: eventId > 0 }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SiteHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SiteHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Button onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <div>
            <h1 className="text-xl font-bold">Manage Tickets</h1>
            <p className="text-sm text-muted-foreground">{event.eventTitle}</p>
          </div>
        </div>

        {/* Ticket Tier Manager */}
        <TicketTierManager eventId={eventId} eventTitle={event.eventTitle} />
      </div>
      <Footer />
    </div>
  );
}
