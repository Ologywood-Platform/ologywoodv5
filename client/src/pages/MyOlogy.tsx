import { useMemo } from 'react';
import { Link } from 'wouter';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  Heart,
  Library,
  Loader2,
  Music2,
  Package,
  Radio,
  ShoppingBag,
  Ticket,
  Users,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { getUnifiedLifecycleLabel, getUnifiedLifecycleStage, getUnifiedLifecycleStyle } from '@/lib/unifiedLifecycle';

export default function MyOlogy() {
  const { user, loading } = useAuth();
  const enabled = !!user;
  const purchases = trpc.release.myPurchases.useQuery(undefined, { enabled, retry: false });
  const tickets = trpc.ticketing.getMyTickets.useQuery({ status: 'upcoming' }, { enabled, retry: false });
  const bookings = trpc.booking.getMyClientBookings.useQuery(undefined, { enabled, retry: false });
  const orders = trpc.merchOrders.myOrders.useQuery(undefined, { enabled, retry: false });
  const following = trpc.follows.getFollowing.useQuery({ userId: user?.id || 0, limit: 100, offset: 0 }, { enabled, retry: false });
  const library = trpc.release.myLibrary.useQuery(undefined, { enabled, retry: false });
  const memberships = trpc.fanClub.listMyMemberships.useQuery(undefined, { enabled, retry: false });
  const liveSessions = trpc.ologyLivePhase2.getMyFanSessions.useQuery({ status: 'upcoming' }, { enabled, retry: false });

  const data = {
    purchases: purchases.data || [],
    tickets: tickets.data || [],
    bookings: bookings.data || [],
    orders: orders.data || [],
    following: following.data || [],
    library: library.data || [],
    memberships: memberships.data || [],
    liveSessions: liveSessions.data || [],
  };

  const isLoading = loading || purchases.isLoading || tickets.isLoading || bookings.isLoading || orders.isLoading || following.isLoading || library.isLoading || memberships.isLoading || liveSessions.isLoading;
  const hasError = purchases.isError || tickets.isError || bookings.isError || orders.isError || following.isError || library.isError || memberships.isError || liveSessions.isError;
  const upcomingBookings = data.bookings.filter((booking: any) => booking.status !== 'cancelled' && new Date(booking.eventDate).getTime() >= Date.now());
  const activeMemberships = data.memberships.filter((membership: any) => membership.status === 'active');

  const latestActivity = useMemo(() => {
    const items = [
      ...data.orders.map((order: any) => ({ id: `order-${order.id}`, date: order.createdAt, title: `Creator Shop order ${order.orderNumber}`, detail: `${order.items?.length || 0} item${order.items?.length === 1 ? '' : 's'}`, href: '/merch-orders', icon: Package, stage: getUnifiedLifecycleStage(order.status, order.paymentStatus) })),
      ...data.purchases.map((purchase: any) => ({ id: `release-${purchase.id}`, date: purchase.purchasedAt, title: purchase.release?.title || 'Release purchase', detail: 'Added to your OlogyWood library', href: '/my-purchases', icon: Music2, stage: getUnifiedLifecycleStage(purchase.status || 'completed', purchase.paymentStatus || 'paid') })),
      ...data.tickets.map((ticket: any) => ({ id: `ticket-${ticket.id}`, date: ticket.createdAt || ticket.event?.date, title: ticket.event?.title || 'Event ticket', detail: `${ticket.ticketCount || ticket.items?.length || 1} ticket${(ticket.ticketCount || ticket.items?.length || 1) === 1 ? '' : 's'}`, href: ticket.orderNumber ? `/tickets/confirmation/${ticket.orderNumber}` : '/my-tickets', icon: Ticket, stage: getUnifiedLifecycleStage(ticket.status, ticket.paymentStatus || 'paid') })),
      ...data.bookings.map((booking: any) => ({ id: `booking-${booking.id}`, date: booking.updatedAt || booking.createdAt || booking.eventDate, title: booking.artistName || 'Talent booking', detail: 'Booking request', href: `/booking/${booking.id}`, icon: CalendarCheck, stage: getUnifiedLifecycleStage(booking.status, booking.paymentStatus) })),
      ...data.liveSessions.map((session: any) => ({ id: `live-${session.id}`, date: session.scheduledAt || session.createdAt, title: session.experienceTitle || 'Ology Live session', detail: session.talentName ? `With ${session.talentName}` : 'Upcoming live experience', href: '/ology-live/my-sessions', icon: Radio, stage: getUnifiedLifecycleStage(session.status, session.amount ? 'paid' : undefined) })),
      ...activeMemberships.map((membership: any) => ({ id: `membership-${membership.id}`, date: membership.startedAt, title: membership.tierName || 'Fan Club membership', detail: 'Active creator membership', href: '/fan-club-discovery', icon: Users, stage: getUnifiedLifecycleStage(membership.status) })),
    ];
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [activeMemberships, data.bookings, data.liveSessions, data.orders, data.purchases, data.tickets]);

  if (loading) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><SiteHeader /><div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><SiteHeader /><main className="container flex min-h-[60vh] items-center justify-center py-12"><Card className="max-w-lg text-center"><CardContent className="p-8"><Library className="mx-auto h-11 w-11 text-purple-600" /><h1 className="mt-4 text-2xl font-bold">My Ology keeps everything you own together</h1><p className="mt-2 text-muted-foreground">Sign in to see tickets, purchases, bookings, downloads, live sessions, and the people you follow.</p><Link href="/"><Button className="mt-6">Return home to sign in</Button></Link></CardContent></Card></main></div>
    );
  }

  const sections = [
    { label: 'Upcoming tickets', count: data.tickets.length, description: 'QR tickets and event details', href: '/my-tickets', icon: Ticket, accent: 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300' },
    { label: 'Bookings', count: upcomingBookings.length, description: 'Requests, payments, and confirmations', href: '/my-bookings', icon: CalendarCheck, accent: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' },
    { label: 'Shop orders', count: data.orders.length, description: 'Merch, Books, eBooks, and delivery', href: '/merch-orders', icon: ShoppingBag, accent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' },
    { label: 'Release purchases', count: data.purchases.length, description: 'Paid releases and downloads', href: '/my-purchases', icon: BookOpen, accent: 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300' },
    { label: 'Music library', count: data.library.length, description: 'Your playable purchased tracks', href: '/my-music', icon: Music2, accent: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' },
    { label: 'Ology Live sessions', count: data.liveSessions.length, description: 'Upcoming virtual experiences and join details', href: '/ology-live/my-sessions', icon: Radio, accent: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300' },
    { label: 'Fan Club memberships', count: activeMemberships.length, description: 'Active communities and member access', href: '/fan-club-discovery', icon: Users, accent: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/50 dark:text-fuchsia-300' },
    { label: 'Following', count: data.following.length, description: 'Creators and venues you care about', href: '/following', icon: Heart, accent: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SiteHeader />
      <main className="container py-8 sm:py-10">
        <div className="max-w-3xl"><Badge className="bg-purple-600">My Ology</Badge><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Everything you book, buy, and follow—together</h1><p className="mt-3 text-slate-600 dark:text-slate-300">This is your personal OlogyWood home. Seller tools stay in Workspace; the things you own and attend stay here.</p></div>

        {isLoading ? (
          <div className="mt-10 flex items-center gap-2 rounded-2xl border bg-white p-6 text-sm text-muted-foreground dark:bg-slate-900"><Loader2 className="h-4 w-4 animate-spin" />Loading your Ology…</div>
        ) : (
          <>
            {hasError && <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">Some activity could not be loaded. The available sections below are still safe to use; refresh to retry the missing area.</div>}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {sections.map((section) => {
                const Icon = section.icon;
                return <Link key={section.label} href={section.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between"><div className={`rounded-xl p-3 ${section.accent}`}><Icon className="h-5 w-5" /></div><span className="text-3xl font-bold text-slate-950 dark:text-white">{section.count}</span></div><h2 className="mt-4 font-semibold text-slate-950 dark:text-white">{section.label}</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{section.description}</p><span className="mt-4 inline-flex items-center text-sm font-medium text-purple-600">Open <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" /></span></Link>;
              })}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.65fr)]">
              <Card><CardHeader><CardTitle>Recent activity</CardTitle></CardHeader><CardContent>{latestActivity.length === 0 ? <div className="py-8 text-center"><Library className="mx-auto h-9 w-9 text-slate-400" /><p className="mt-3 font-medium">Your activity will collect here</p><p className="mt-1 text-sm text-muted-foreground">Browse creators, events, shops, and live sessions to get started.</p><Link href="/discover"><Button variant="outline" className="mt-4">Start discovering</Button></Link></div> : <div className="space-y-3">{latestActivity.map((item) => { const Icon = item.icon; return <Link key={item.id} href={item.href} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"><Icon className="mt-0.5 h-5 w-5 text-purple-600" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-medium">{item.title}</p><Badge variant="outline" className={getUnifiedLifecycleStyle(item.stage)}>{getUnifiedLifecycleLabel(item.stage)}</Badge></div><p className="text-sm text-muted-foreground">{item.detail}</p></div><ArrowRight className="mt-1 h-4 w-4 text-slate-400" /></Link>; })}</div>}</CardContent></Card>
              <Card className="bg-gradient-to-br from-purple-950 to-indigo-950 text-white"><CardHeader><CardTitle>What is next?</CardTitle></CardHeader><CardContent className="space-y-3"><Link href="/experiences" className="flex items-center justify-between rounded-xl bg-white/10 p-3 hover:bg-white/15"><span className="flex items-center gap-2"><Radio className="h-4 w-4" />Find an experience</span><ArrowRight className="h-4 w-4" /></Link><Link href="/shop" className="flex items-center justify-between rounded-xl bg-white/10 p-3 hover:bg-white/15"><span className="flex items-center gap-2"><ShoppingBag className="h-4 w-4" />Support a creator</span><ArrowRight className="h-4 w-4" /></Link><Link href="/community" className="flex items-center justify-between rounded-xl bg-white/10 p-3 hover:bg-white/15"><span className="flex items-center gap-2"><Heart className="h-4 w-4" />Visit your community</span><ArrowRight className="h-4 w-4" /></Link></CardContent></Card>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
