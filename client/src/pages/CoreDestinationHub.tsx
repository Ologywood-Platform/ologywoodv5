import { Link } from 'wouter';
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clapperboard,
  Compass,
  Heart,
  MapPin,
  MessageCircle,
  Music2,
  Radio,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Ticket,
  Users,
  Video,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { Button } from '@/components/ui/button';

type HubKind = 'discover' | 'experiences' | 'shop' | 'community';

const HUBS = {
  discover: {
    eyebrow: 'Find your next opportunity',
    title: 'Discover the people, places, and experiences shaping OlogyWood',
    description: 'Start with what you are looking for. Search talent, explore venues, see upcoming events, or find a live experience—without learning separate platform systems.',
    icon: Compass,
    primary: { label: 'Search all talent', href: '/browse' },
    cards: [
      { title: 'Talent', description: 'Artists, athletes, filmmakers, visual artists, authors, entertainers, creators, and influencers.', href: '/browse', icon: Search },
      { title: 'Venues', description: 'Find spaces by location, type, capacity, and amenities.', href: '/venues', icon: MapPin },
      { title: 'Events', description: 'Explore concerts, arts and culture, sports, screenings, and community events.', href: '/events', icon: CalendarDays },
      { title: 'Live sessions', description: 'Join paid or free virtual experiences hosted by talent.', href: '/ology-live', icon: Radio },
    ],
  },
  experiences: {
    eyebrow: 'Book it. Attend it. Remember it.',
    title: 'Experiences bring bookings, tickets, and live access together',
    description: 'Whether you are hiring talent, attending an event, or joining a live session, every experience follows one clear path from discovery to confirmation.',
    icon: Sparkles,
    primary: { label: 'Browse experiences', href: '/events' },
    cards: [
      { title: 'Book talent', description: 'Send a professional request for a performance, appearance, speaking engagement, NIL opportunity, or creative service.', href: '/browse', icon: Users },
      { title: 'Event tickets', description: 'Discover events, purchase tickets, and keep QR access inside My Ology.', href: '/events', icon: Ticket },
      { title: 'Ology Live', description: 'Book or join virtual Q&As, workshops, listening sessions, coaching, and more.', href: '/ology-live', icon: Video },
      { title: 'Your experiences', description: 'See upcoming tickets and bookings together in My Ology.', href: '/my-ology', icon: CalendarDays },
    ],
  },
  shop: {
    eyebrow: 'Support creators directly',
    title: 'One place to discover what OlogyWood creators sell',
    description: 'Shop through creator profiles for merchandise, physical Books, secure eBooks, music, and paid releases. Your purchases stay organized in My Ology.',
    icon: Store,
    primary: { label: 'Discover creator shops', href: '/browse' },
    cards: [
      { title: 'Creator Shop', description: 'Find merchandise and creator-made products on talent and venue profiles.', href: '/browse', icon: ShoppingBag },
      { title: 'Books and eBooks', description: 'Buy physical editions or access protected digital books after purchase.', href: '/browse', icon: BookOpen },
      { title: 'Music and releases', description: 'Support hosted releases and keep eligible downloads in your library.', href: '/my-music', icon: Music2 },
      { title: 'Your purchases', description: 'Find orders, downloads, release access, and receipts in My Ology.', href: '/my-ology', icon: Clapperboard },
    ],
  },
  community: {
    eyebrow: 'Relationships beyond the transaction',
    title: 'Follow the people you support and stay connected to what is next',
    description: 'Community brings follows, Sandbox Posts, Fan Clubs, creator updates, and direct conversations into one understandable relationship layer.',
    icon: Heart,
    primary: { label: 'See who you follow', href: '/following' },
    cards: [
      { title: 'Following', description: 'Keep up with artists, talent, and venues you care about.', href: '/following', icon: Heart },
      { title: 'Sandbox Posts', description: 'See the current playful update directly beneath a creator’s bio.', href: '/browse', icon: Sparkles },
      { title: 'Fan Clubs', description: 'Join recurring creator communities and access member benefits.', href: '/browse', icon: Users },
      { title: 'Messages', description: 'Continue booking and relationship conversations in one inbox.', href: '/messages', icon: MessageCircle },
    ],
  },
} satisfies Record<HubKind, any>;

export function CoreDestinationHub({ kind }: { kind: HubKind }) {
  const hub = HUBS[kind];
  const HubIcon = hub.icon;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SiteHeader />
      <main>
        <section className="border-b border-purple-100 dark:border-purple-900/40 bg-gradient-to-br from-purple-950 via-indigo-950 to-slate-950 text-white">
          <div className="container py-14 sm:py-20">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm text-purple-100">
                <HubIcon className="h-4 w-4" />
                {hub.eyebrow}
              </div>
              <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">{hub.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-purple-100 sm:text-lg">{hub.description}</p>
              <Link href={hub.primary.href}>
                <Button size="lg" className="mt-7 bg-white text-purple-950 hover:bg-purple-50">
                  {hub.primary.label}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="container py-10 sm:py-14">
          <div className="grid gap-5 md:grid-cols-2">
            {hub.cards.map((card: any) => {
              const Icon = card.icon;
              return (
                <Link key={card.title} href={card.href} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-700">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-purple-100 p-3 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold text-slate-950 dark:text-white">{card.title}</h2>
                        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-purple-600" />
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{card.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="mt-8 rounded-2xl border border-dashed border-purple-300 bg-purple-50 p-5 text-sm text-purple-950 dark:border-purple-800 dark:bg-purple-950/30 dark:text-purple-100">
            <strong>One ecosystem:</strong> Anything you book, buy, follow, or unlock appears in <Link href="/my-ology" className="font-semibold underline underline-offset-2">My Ology</Link>. Creators and venues manage their side in <Link href="/workspace" className="font-semibold underline underline-offset-2">Workspace</Link>.
          </div>
        </section>
      </main>
    </div>
  );
}

export const DiscoverHub = () => <CoreDestinationHub kind="discover" />;
export const ExperiencesHub = () => <CoreDestinationHub kind="experiences" />;
export const ShopHub = () => <CoreDestinationHub kind="shop" />;
export const CommunityHub = () => <CoreDestinationHub kind="community" />;

