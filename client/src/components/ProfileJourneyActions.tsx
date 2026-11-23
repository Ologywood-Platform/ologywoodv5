import { useState } from 'react';
import { CalendarPlus, ChevronDown, Headphones, ShoppingBag, Ticket, Users } from 'lucide-react';
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

type JourneyAction = 'book' | 'attend' | 'buy' | 'watch' | 'join';

const actionDetails: Record<JourneyAction, { description: string; cta: string }> = {
  book: {
    description: 'Request a performance, appearance, or collaboration and review the booking details.',
    cta: 'Request Booking',
  },
  attend: {
    description: 'See upcoming events featuring this talent and purchase tickets when they are available.',
    cta: 'View Events',
  },
  buy: {
    description: 'Browse music, merch, books, and other releases available from this profile.',
    cta: 'Visit Shop',
  },
  watch: {
    description: 'Preview music, videos, performances, and other content shared by this talent.',
    cta: 'Explore Content',
  },
  join: {
    description: 'Follow this talent and stay updated on new releases, events, and announcements.',
    cta: 'Join the Fan Club',
  },
};

export function ProfileJourneyActions({
  artistUserId,
  artistName,
  onBook,
}: {
  artistUserId: number;
  artistName: string;
  onBook: () => void;
}) {
  const [expandedAction, setExpandedAction] = useState<JourneyAction | null>(null);
  const details = expandedAction ? actionDetails[expandedAction] : null;

  const toggleAction = (action: JourneyAction) => {
    setExpandedAction((current) => (current === action ? null : action));
  };

  const handleActionCta = () => {
    if (!expandedAction) return;
    if (expandedAction === 'book') {
      onBook();
      return;
    }
    if (expandedAction === 'attend') {
      scrollToSection('profile-events', 'No upcoming events are posted yet.');
      return;
    }
    if (expandedAction === 'buy') {
      scrollToSection(
        document.getElementById('profile-shop')
          ? 'profile-shop'
          : document.getElementById('profile-content')
            ? 'profile-content'
            : 'profile-releases',
        'There is nothing available to buy yet.',
      );
      return;
    }
    if (expandedAction === 'watch') {
      scrollToSection('profile-content', 'No music or hosted content is available yet.');
      return;
    }
    scrollToSection('profile-fan-club', 'This creator has not opened a Fan Club yet.');
  };

  return (
    <TooltipProvider delayDuration={250}>
      <section
        className="min-w-0 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50 to-fuchsia-50 p-4 dark:border-purple-900/60 dark:from-purple-950/30 dark:to-fuchsia-950/20"
        aria-labelledby="profile-actions-title"
      >
        <div className="mb-3">
          <h2 id="profile-actions-title" className="font-semibold [overflow-wrap:anywhere] text-slate-950 dark:text-white">
            What can you do with {artistName}?
          </h2>
          <p className="text-sm text-muted-foreground">Book, attend, support, and stay connected from this profile.</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5 [&_button]:min-w-0 [&_button]:h-auto [&_button]:min-h-10 [&_button]:whitespace-normal [&_button]:py-2 [&_button]:[overflow-wrap:anywhere]">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="gap-2 bg-purple-600 hover:bg-purple-700"
                onClick={() => toggleAction('book')}
                aria-expanded={expandedAction === 'book'}
                aria-controls="profile-action-guidance"
              >
                <CalendarPlus className="h-4 w-4" />Book<ChevronDown className={`h-4 w-4 transition-transform ${expandedAction === 'book' ? 'rotate-180' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Learn how booking works with {artistName}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 bg-white/80 dark:bg-slate-900/70"
                onClick={() => toggleAction('attend')}
                aria-expanded={expandedAction === 'attend'}
                aria-controls="profile-action-guidance"
              >
                <Ticket className="h-4 w-4" />Attend<ChevronDown className={`h-4 w-4 transition-transform ${expandedAction === 'attend' ? 'rotate-180' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Learn how to find events and tickets</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 bg-white/80 dark:bg-slate-900/70"
                onClick={() => toggleAction('buy')}
                aria-expanded={expandedAction === 'buy'}
                aria-controls="profile-action-guidance"
              >
                <ShoppingBag className="h-4 w-4" />Buy<ChevronDown className={`h-4 w-4 transition-transform ${expandedAction === 'buy' ? 'rotate-180' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Learn what you can buy from this profile</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 bg-white/80 dark:bg-slate-900/70"
                onClick={() => toggleAction('watch')}
                aria-expanded={expandedAction === 'watch'}
                aria-controls="profile-action-guidance"
              >
                <Headphones className="h-4 w-4" />Watch / Listen<ChevronDown className={`h-4 w-4 transition-transform ${expandedAction === 'watch' ? 'rotate-180' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Learn where to preview music and content</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 bg-white/80 dark:bg-slate-900/70"
                onClick={() => toggleAction('join')}
                aria-expanded={expandedAction === 'join'}
                aria-controls="profile-action-guidance"
              >
                <Users className="h-4 w-4" />Join<ChevronDown className={`h-4 w-4 transition-transform ${expandedAction === 'join' ? 'rotate-180' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Learn how to follow and stay connected</TooltipContent>
          </Tooltip>
        </div>
        {details && (
          <div id="profile-action-guidance" className="mt-3 rounded-xl border border-purple-200 bg-white/85 p-3 dark:border-purple-800/70 dark:bg-slate-950/60" role="region" aria-live="polite">
            <p className="text-sm text-slate-700 dark:text-slate-200">{details.description}</p>
            <Button type="button" size="sm" className="mt-3 gap-2" onClick={handleActionCta}>
              {expandedAction === 'book' ? <CalendarPlus className="h-4 w-4" /> : expandedAction === 'attend' ? <Ticket className="h-4 w-4" /> : expandedAction === 'buy' ? <ShoppingBag className="h-4 w-4" /> : expandedAction === 'watch' ? <Headphones className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              {details.cta}
            </Button>
          </div>
        )}
        <div className="mt-2 border-t border-purple-100/80 pt-2 dark:border-purple-900/50 [&_button]:min-h-10 [&_button]:whitespace-normal [&_button]:py-2 [&_button]:[overflow-wrap:anywhere]">
          <FollowButton artistUserId={artistUserId} artistName={artistName} showCount={false} />
        </div>
      </section>
    </TooltipProvider>
  );
}
