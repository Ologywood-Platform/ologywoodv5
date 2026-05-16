import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, ScanLine, Settings2, BarChart3, Tag } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { TicketTierManager } from '@/components/TicketTierManager';
import { TicketAnalytics } from '@/components/TicketAnalytics';
import { PromoCodeManager } from '@/components/PromoCodeManager';
import SiteHeader from '@/components/SiteHeader';

export default function EventTickets() {
  const { id: idParam } = useParams();
  const eventId = idParam ? parseInt(idParam) : 0;
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'manage' | 'promos' | 'analytics'>('manage');

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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-bold">Tickets</h1>
              <p className="text-sm text-muted-foreground">{event.eventTitle}</p>
            </div>
          </div>
          <Button
            onClick={() => navigate(`/events/${eventId}/check-in`)}
            className="gap-2 bg-slate-900 hover:bg-slate-800"
          >
            <ScanLine className="h-4 w-4" />
            <span className="hidden sm:inline">Door</span> Check-In
          </Button>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg mb-6">
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'manage'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings2 className="h-4 w-4" />
            Tiers
          </button>
          <button
            onClick={() => setActiveTab('promos')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'promos'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Tag className="h-4 w-4" />
            Promos
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </button>
        </div>

        {/* Content */}
        {activeTab === 'manage' ? (
          <TicketTierManager eventId={eventId} eventTitle={event.eventTitle} />
        ) : activeTab === 'promos' ? (
          <PromoCodeManager eventId={eventId} />
        ) : (
          <TicketAnalytics eventId={eventId} />
        )}
      </div>

    </div>
  );
}
