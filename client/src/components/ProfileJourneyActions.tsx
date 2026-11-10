import { CalendarPlus, Headphones, ShoppingBag, Ticket, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/FollowButton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

function scrollToSection(id: string, emptyMessage: string) {
  const section = document.getElementById(id);
  if (section) {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  toast.info(emptyMessage);
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
    <TooltipProvider delayDuration={250}>
      <section className="min-w-0 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-fuchsia-50 p-4 dark:border-purple-900/60 dark:from-purple-950/30 dark:to-fuchsia-950/20" aria-labelledby="profile-actions-title">
      <div className="mb-3">
        <h2 id="profile-actions-title" className="font-semibold [overflow-wrap:anywhere] text-slate-950 dark:text-white">What can you do with {artistName}?</h2>
        <p className="text-sm text-muted-foreground">Book, attend, support, and stay connected from this profile.</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,11rem),1fr))] gap-2 [&_button]:min-w-0 [&_button]:h-auto [&_button]:min-h-10 [&_button]:whitespace-normal [&_button]:py-2 [&_button]:[overflow-wrap:anywhere]">
        <Tooltip><TooltipTrigger asChild><Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={onBook}><CalendarPlus className="h-4 w-4" />Book</Button></TooltipTrigger><TooltipContent>Send a booking request to {artistName}</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="outline" className="gap-2 bg-white/80 dark:bg-slate-900/70" onClick={() => scrollToSection('profile-events', 'No upcoming events are posted yet.')}><Ticket className="h-4 w-4" />Attend</Button></TooltipTrigger><TooltipContent>See upcoming events and ticket links</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="outline" className="gap-2 bg-white/80 dark:bg-slate-900/70" onClick={() => scrollToSection(document.getElementById('profile-shop') ? 'profile-shop' : document.getElementById('profile-content') ? 'profile-content' : 'profile-releases', 'There is nothing available to buy yet.')}><ShoppingBag className="h-4 w-4" />Buy</Button></TooltipTrigger><TooltipContent>Browse music, merch, books, and paid content</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><Button variant="outline" className="gap-2 bg-white/80 dark:bg-slate-900/70" onClick={() => scrollToSection('profile-content', 'No music or hosted content is available yet.')}><Headphones className="h-4 w-4" />Watch / Listen</Button></TooltipTrigger><TooltipContent>Preview music and watch hosted content</TooltipContent></Tooltip>
        <div className="[&>button]:w-full"><FollowButton artistUserId={artistUserId} artistName={artistName} showCount={false} /></div>
        <Tooltip><TooltipTrigger asChild><Button variant="outline" className="gap-2 bg-white/80 dark:bg-slate-900/70" onClick={() => scrollToSection('profile-fan-club', 'This creator has not opened a Fan Club yet.')}><Users className="h-4 w-4" />Join</Button></TooltipTrigger><TooltipContent>Join this creator’s Fan Club</TooltipContent></Tooltip>
      </div>
      </section>
    </TooltipProvider>
  );
}
