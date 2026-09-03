import { CalendarPlus, MessageSquare, ShoppingBag, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FollowVenueButton } from '@/components/FollowVenueButton';

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function VenueJourneyActions({
  venueUserId,
  venueName,
  onContact,
}: {
  venueUserId: number;
  venueName: string;
  onContact: () => void;
}) {
  return (
    <section className="mb-6 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-fuchsia-50 p-4 dark:border-purple-900/60 dark:from-purple-950/30 dark:to-fuchsia-950/20" aria-labelledby="venue-actions-title">
      <div className="mb-3">
        <h2 id="venue-actions-title" className="font-semibold text-slate-950 dark:text-white">What can you do with {venueName}?</h2>
        <p className="text-sm text-muted-foreground">Book the venue, attend an event, support its offers, or start a relationship.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={onContact}><CalendarPlus className="h-4 w-4" />Book venue</Button>
        <Button variant="outline" className="gap-2 bg-white/80 dark:bg-slate-900/70" onClick={() => scrollToSection('venue-events')}><Ticket className="h-4 w-4" />Attend</Button>
        <Button variant="outline" className="gap-2 bg-white/80 dark:bg-slate-900/70" onClick={() => scrollToSection('venue-shop')}><ShoppingBag className="h-4 w-4" />Shop</Button>
        <div className="[&>button]:w-full"><FollowVenueButton venueUserId={venueUserId} venueName={venueName} size="default" showCount={false} /></div>
        <Button variant="outline" className="gap-2 bg-white/80 dark:bg-slate-900/70" onClick={onContact}><MessageSquare className="h-4 w-4" />Message</Button>
      </div>
    </section>
  );
}

