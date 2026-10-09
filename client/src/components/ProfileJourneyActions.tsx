import { CalendarPlus, Headphones, ShoppingBag, Ticket, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/FollowButton';

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function ProfileJourneyActions({
  artistUserId,
  artistName,
  onBook,
}: {
  artistUserId: number;
  artistName: string;
  onBook: () => void;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-fuchsia-50 p-4 dark:border-purple-900/60 dark:from-purple-950/30 dark:to-fuchsia-950/20" aria-labelledby="profile-actions-title">
      <div className="mb-3">
        <h2 id="profile-actions-title" className="font-semibold [overflow-wrap:anywhere] text-slate-950 dark:text-white">What can you do with {artistName}?</h2>
        <p className="text-sm text-muted-foreground">Book, attend, support, and stay connected from this profile.</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] gap-2 [&_button]:min-w-0 [&_button]:h-auto [&_button]:min-h-10 [&_button]:whitespace-normal [&_button]:py-2 [&_button]:[overflow-wrap:anywhere]">
        <Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={onBook}><CalendarPlus className="h-4 w-4" />Book</Button>
        <Button variant="outline" className="gap-2 bg-white/80 dark:bg-slate-900/70" onClick={() => scrollToSection('profile-events')}><Ticket className="h-4 w-4" />Attend</Button>
        <Button variant="outline" className="gap-2 bg-white/80 dark:bg-slate-900/70" onClick={() => scrollToSection(document.getElementById('profile-content') ? 'profile-content' : document.getElementById('profile-releases') ? 'profile-releases' : 'profile-shop')}><ShoppingBag className="h-4 w-4" />Buy</Button>
        <Button variant="outline" className="gap-2 bg-white/80 dark:bg-slate-900/70" onClick={() => scrollToSection('profile-content')}><Headphones className="h-4 w-4" />Watch / Listen</Button>
        <div className="[&>button]:w-full"><FollowButton artistUserId={artistUserId} artistName={artistName} showCount={false} /></div>
        <Button variant="outline" className="gap-2 bg-white/80 dark:bg-slate-900/70" onClick={() => scrollToSection('profile-fan-club')}><Users className="h-4 w-4" />Join</Button>
      </div>
    </section>
  );
}
