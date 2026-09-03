import { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import {
  AlertCircle,
  ArrowRight,
  BadgeDollarSign,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Loader2,
  MessageCircle,
  PackageCheck,
  Settings,
  Store,
  UserRound,
  Users,
} from 'lucide-react';
import { SiteHeader } from '@/components/SiteHeader';
import { CreateActionDialog } from '@/components/CreateActionDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { getWorkspaceRole } from '@/lib/ecosystemNavigation';
import { toSlug } from '@/lib/slugify';

type AttentionItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  priority: 'urgent' | 'soon' | 'setup';
  icon: typeof AlertCircle;
};

const roleCopy = {
  creator: { title: 'Creator Workspace', subtitle: 'Run your profile, opportunities, sales, audience, and earnings from one home.' },
  venue: { title: 'Venue Workspace', subtitle: 'Manage bookings, events, talent relationships, and venue operations together.' },
  admin: { title: 'Admin Workspace', subtitle: 'Manage people, commerce, content, trust, and platform operations.' },
  blogger: { title: 'Blogger Workspace', subtitle: 'Create, publish, and measure OlogyWood editorial content.' },
  team: { title: 'Team Workspace', subtitle: 'Support the creator account you were invited to manage.' },
  fan: { title: 'Your Workspace', subtitle: 'Your OlogyWood activity belongs in My Ology.' },
  guest: { title: 'Workspace', subtitle: 'Sign in to manage your OlogyWood activity.' },
} as const;

export default function Workspace() {
  const { user, loading } = useAuth();
  const [location, navigate] = useLocation();
  const baseRole = getWorkspaceRole(user as any);
  const requestedWorkspaceView = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('view') : null;
  const canSwitchToCreator = !!user?.isAdmin && user?.role === 'artist';
  const teamContextQuery = trpc.team.getMyWorkspaceContext.useQuery(undefined, { enabled: !!user, retry: false });
  const hasCollaboratorWorkspace = !!teamContextQuery.data
    && teamContextQuery.data.role !== 'owner'
    && !['admin', 'venue', 'blogger'].includes(baseRole);
  const selectedBaseRole = canSwitchToCreator && requestedWorkspaceView === 'admin' ? 'admin' as const : baseRole;
  const role = hasCollaboratorWorkspace ? 'team' as const : selectedBaseRole;
  const isCreator = role === 'creator';
  const isVenue = role === 'venue';

  useEffect(() => {
    if (!loading && role === 'fan') navigate('/my-ology', { replace: true });
  }, [loading, navigate, role]);

  const profileQuery = trpc.artist.getMyProfile.useQuery(undefined, { enabled: !!user && isCreator, retry: false });
  const venueProfileQuery = trpc.venue.getMyProfile.useQuery(undefined, { enabled: !!user && isVenue, retry: false });
  const artistBookingsQuery = trpc.booking.getMyArtistBookings.useQuery(undefined, { enabled: !!user && isCreator, retry: false });
  const venueBookingsQuery = trpc.booking.getMyVenueBookings.useQuery(undefined, { enabled: !!user && isVenue, retry: false });
  const sellerOrdersQuery = trpc.merchOrders.sellerOrders.useQuery(undefined, { enabled: !!user && (isCreator || isVenue), retry: false });
  const eventsQuery = trpc.events.getMyEvents.useQuery({}, { enabled: !!user && isCreator, retry: false });
  const payoutQuery = trpc.stripeConnect.getAccountStatus.useQuery(undefined, { enabled: !!user && isCreator, retry: false });
  const incompleteProfilesQuery = trpc.admin.getIncompleteProfiles.useQuery(undefined, { enabled: !!user && role === 'admin', retry: false });
  const flaggedVideosQuery = trpc.admin.getFlaggedVideoCount.useQuery(undefined, { enabled: !!user && role === 'admin', retry: false });
  const draftPostsQuery = trpc.blog.adminList.useQuery({ status: 'draft', limit: 1 }, { enabled: !!user && (role === 'admin' || role === 'blogger'), retry: false });

  const profile: any = isVenue ? venueProfileQuery.data : profileQuery.data;
  const bookings: any[] = (isVenue ? venueBookingsQuery.data : artistBookingsQuery.data) || [];
  const orders: any[] = sellerOrdersQuery.data || [];
  const events: any[] = eventsQuery.data || [];
  const profileSlug = isCreator && profile?.artistName ? toSlug(profile.artistName) : null;

  const attentionItems = useMemo<AttentionItem[]>(() => {
    if (!user) return [];
    const items: AttentionItem[] = [];
    const pendingBookings = bookings.filter((booking) => booking.status === 'pending');
    const openOrders = orders.filter((order) => order.paymentStatus === 'paid' && !['completed', 'cancelled', 'refunded'].includes(order.status));

    if ((isCreator || isVenue) && !profile) {
      items.push({ id: 'profile-missing', title: 'Finish your public profile', description: 'Complete the profile people use to discover, trust, and contact you.', href: isVenue ? '/venue-dashboard' : '/profile/edit', priority: 'urgent', icon: UserRound });
    } else if (profile && (!profile.bio || !profile.profilePhotoUrl || !profile.location)) {
      items.push({ id: 'profile-incomplete', title: 'Strengthen your public profile', description: 'Add your bio, profile photo, and location so visitors can evaluate you quickly.', href: isVenue ? '/venue-dashboard' : '/profile/edit', priority: 'setup', icon: UserRound });
    }

    if (pendingBookings.length > 0) {
      items.push({ id: 'pending-bookings', title: `${pendingBookings.length} booking ${pendingBookings.length === 1 ? 'request needs' : 'requests need'} a response`, description: 'Review the date, terms, and message before the requester moves on.', href: isVenue ? '/venue-dashboard' : '/dashboard', priority: 'urgent', icon: CalendarClock });
    }

    if (openOrders.length > 0) {
      items.push({ id: 'open-orders', title: `${openOrders.length} paid ${openOrders.length === 1 ? 'order needs' : 'orders need'} fulfillment`, description: 'Update preparation, shipping, pickup, or digital delivery status.', href: '/merch-orders', priority: 'urgent', icon: PackageCheck });
    }

    if (isCreator && payoutQuery.data && !(payoutQuery.data.chargesEnabled && payoutQuery.data.payoutsEnabled)) {
      items.push({ id: 'payout-setup', title: 'Complete payout setup', description: 'Finish Stripe verification before accepting native payments.', href: '/earnings', priority: 'setup', icon: BadgeDollarSign });
    }

    if (isCreator && events.length === 0) {
      items.push({ id: 'event-empty', title: 'Publish what is next', description: 'Add an event, release, live session, or Sandbox Post so visitors have a next action.', href: '/events/create', priority: 'soon', icon: Store });
    }

    const incompleteProfileCount = incompleteProfilesQuery.data?.count || 0;
    if (role === 'admin' && incompleteProfileCount > 0) {
      items.push({ id: 'incomplete-profiles', title: `${incompleteProfileCount} ${incompleteProfileCount === 1 ? 'profile needs' : 'profiles need'} completion follow-up`, description: 'Review incomplete creator and venue accounts and send reminders where appropriate.', href: '/admin', priority: 'soon', icon: Users });
    }

    const flaggedVideoCount = Number(flaggedVideosQuery.data || 0);
    if (role === 'admin' && flaggedVideoCount > 0) {
      items.push({ id: 'flagged-videos', title: `${flaggedVideoCount} flagged ${flaggedVideoCount === 1 ? 'video needs' : 'videos need'} review`, description: 'Review moderation evidence before keeping or removing public media.', href: '/admin', priority: 'urgent', icon: AlertCircle });
    }

    const draftPostCount = Number(draftPostsQuery.data?.counts?.drafts || 0);
    if ((role === 'admin' || role === 'blogger') && draftPostCount > 0) {
      items.push({ id: 'draft-posts', title: `${draftPostCount} Blog ${draftPostCount === 1 ? 'draft is' : 'drafts are'} waiting`, description: 'Review, edit, or publish current editorial work.', href: '/admin/blog', priority: 'soon', icon: ClipboardList });
    }

    if (role === 'team' && teamContextQuery.data) {
      items.push({ id: 'team-context', title: `You are supporting ${teamContextQuery.data.artistName}`, description: 'Open the creator profile or review your granted permissions before making changes.', href: '/team', priority: 'setup', icon: Users });
    }

    return items.slice(0, 5);
  }, [bookings, draftPostsQuery.data?.counts?.drafts, events.length, flaggedVideosQuery.data, incompleteProfilesQuery.data?.count, isCreator, isVenue, orders, payoutQuery.data, profile, role, teamContextQuery.data, user]);

  const workspaceLinks = role === 'creator' ? [
    { label: 'Profile', description: 'Identity, portfolio, Sandbox Post, and public storefront', href: profileSlug ? `/artist/${profileSlug}` : '/profile/edit', icon: UserRound },
    { label: 'Sell', description: 'Bookings, events, Creator Shop, Books, releases, and Fan Club', href: '/merch', icon: Store },
    { label: 'Deliver', description: 'Bookings, orders, contracts, riders, and messages', href: '/dashboard', icon: ClipboardList },
    { label: 'Grow', description: 'Followers, promotions, sponsors, and analytics', href: '/promote', icon: BarChart3 },
    { label: 'Money', description: 'Earnings, payouts, fees, and tax reporting', href: '/earnings', icon: CircleDollarSign },
    { label: 'Settings', description: 'Team, account, security, and preferences', href: '/settings', icon: Settings },
  ] : role === 'venue' ? [
    { label: 'Venue profile', description: 'Public identity, capacity, amenities, gallery, and details', href: '/venue-dashboard', icon: Store },
    { label: 'Discover talent', description: 'Find, follow, and contact talent for your events', href: '/browse', icon: Users },
    { label: 'Bookings', description: 'Requests, contracts, riders, and messages', href: '/venue-dashboard', icon: CalendarClock },
    { label: 'Events', description: 'Create events, sell tickets, and manage check-in', href: '/venue/events/create', icon: ClipboardList },
    { label: 'Money', description: 'Invoices, payments, and transaction history', href: '/venue-invoices', icon: CircleDollarSign },
    { label: 'Settings', description: 'Account, security, and team preferences', href: '/settings', icon: Settings },
  ] : role === 'admin' ? [
    { label: 'People', description: 'Users, profiles, completion, and verification', href: '/admin', icon: Users },
    { label: 'Commerce', description: 'Payouts, subscriptions, disputes, and platform revenue', href: '/admin/payouts', icon: CircleDollarSign },
    { label: 'Content', description: 'Blog, events, media, and moderation', href: '/admin/blog', icon: ClipboardList },
    { label: 'Trust & safety', description: 'Reports, disputes, verification, and platform health', href: '/admin', icon: CheckCircle2 },
  ] : role === 'blogger' ? [
    { label: 'Blog Management', description: 'Draft, publish, archive, and edit posts', href: '/admin/blog', icon: ClipboardList },
    { label: 'Live Blog', description: 'Review the public reader experience', href: '/blog', icon: ArrowRight },
  ] : role === 'team' ? [
    { label: `${teamContextQuery.data?.artistName || 'Creator'} profile`, description: 'Open the public profile connected to your team access', href: teamContextQuery.data?.artistName ? `/artist/${toSlug(teamContextQuery.data.artistName)}` : '/team', icon: UserRound },
    { label: 'Messages', description: 'Continue conversations for the creator account you support', href: '/messages', icon: MessageCircle },
    { label: 'Team access', description: 'Review your membership and the permissions the account owner granted', href: '/team', icon: Users },
  ] : [
    { label: 'My Ology', description: 'Open your tickets, purchases, bookings, library, and follows', href: '/my-ology', icon: UserRound },
  ];

  const workspaceSections = role === 'creator'
    ? [
        { label: 'Overview', href: '/workspace' },
        { label: 'Profile', href: workspaceLinks[0]?.href || '/profile/edit' },
        { label: 'Sell', href: '/merch' },
        { label: 'Deliver', href: '/dashboard' },
        { label: 'Grow', href: '/promote' },
        { label: 'Money', href: '/earnings' },
      ]
    : role === 'venue'
      ? [
          { label: 'Overview', href: '/workspace' },
          { label: 'Discover', href: '/browse' },
          { label: 'Bookings', href: '/venue-dashboard' },
          { label: 'Events', href: '/venue/events/create' },
          { label: 'Money', href: '/venue-invoices' },
          { label: 'Profile', href: '/venue-dashboard' },
        ]
      : role === 'admin'
        ? [
            { label: 'Overview', href: '/workspace' },
            { label: 'People', href: '/admin' },
            { label: 'Commerce', href: '/admin/payouts' },
            { label: 'Content', href: '/admin/blog' },
            { label: 'Trust', href: '/admin' },
            { label: 'System', href: '/admin' },
          ]
        : role === 'blogger'
          ? [
              { label: 'Overview', href: '/workspace' },
              { label: 'Content', href: '/admin/blog' },
              { label: 'Audience', href: '/blog' },
              { label: 'Activity', href: '/admin/blog' },
            ]
          : role === 'team'
            ? [
                { label: 'Overview', href: '/workspace' },
                { label: 'Creator', href: workspaceLinks[0]?.href || '/team' },
                { label: 'Messages', href: '/messages' },
                { label: 'Permissions', href: '/team' },
              ]
            : [
                { label: 'Overview', href: '/workspace' },
                { label: 'Activity', href: '/my-ology' },
                { label: 'Library', href: '/my-purchases' },
                { label: 'Tickets', href: '/my-tickets' },
                { label: 'Bookings', href: '/my-bookings' },
                { label: 'Following', href: '/following' },
              ];

  const anyLoading = teamContextQuery.isLoading || profileQuery.isLoading || venueProfileQuery.isLoading || artistBookingsQuery.isLoading || venueBookingsQuery.isLoading || sellerOrdersQuery.isLoading || incompleteProfilesQuery.isLoading || flaggedVideosQuery.isLoading || draftPostsQuery.isLoading;

  if (loading || role === 'fan') {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><SiteHeader /><div className="flex min-h-[55vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <SiteHeader />
        <main className="container flex min-h-[60vh] items-center justify-center py-12">
          <Card className="max-w-lg text-center"><CardContent className="p-8"><UserRound className="mx-auto h-10 w-10 text-purple-600" /><h1 className="mt-4 text-2xl font-bold">Your Workspace starts after sign in</h1><p className="mt-2 text-muted-foreground">Sign in from the header to manage your profile, opportunities, delivery, growth, and money.</p><Link href="/"><Button className="mt-6">Return home</Button></Link></CardContent></Card>
        </main>
      </div>
    );
  }

  const copy = roleCopy[role];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <SiteHeader />
      <main className="container py-8 sm:py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-200">Unified Workspace</Badge>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">{copy.title}</h1>
            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">{copy.subtitle}</p>
            {canSwitchToCreator && (
              <div className="mt-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-label="Choose Workspace context">
                <Button size="sm" variant={role === 'creator' ? 'default' : 'ghost'} onClick={() => navigate('/workspace?view=creator')}>Creator Workspace</Button>
                <Button size="sm" variant={role === 'admin' ? 'default' : 'ghost'} onClick={() => navigate('/workspace?view=admin')}>Admin Workspace</Button>
              </div>
            )}
          </div>
          <CreateActionDialog role={role} profileSlug={profileSlug} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {workspaceSections.map((section, index) => (
              <Link key={section.label} href={section.href} className={`block rounded-xl px-3 py-2.5 text-sm transition-colors ${index === 0 ? 'bg-purple-600 font-semibold text-white' : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700 dark:text-slate-300 dark:hover:bg-purple-950/30 dark:hover:text-purple-200'}`}>{section.label}</Link>
            ))}
            <p className="px-3 pt-3 text-xs leading-5 text-slate-500">The shell stays familiar while the tools and language follow your role.</p>
          </aside>

          <div className="space-y-6">
            <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-xl"><AlertCircle className="h-5 w-5 text-amber-600" />Needs Attention</CardTitle>{attentionItems.length > 0 && <Badge className="bg-amber-600">{attentionItems.length}</Badge>}</div>
                <p className="text-sm text-slate-600 dark:text-slate-300">The most important next steps appear here before optional tools.</p>
              </CardHeader>
              <CardContent>
                {anyLoading ? (
                  <div className="flex items-center gap-2 py-5 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Checking your current activity…</div>
                ) : attentionItems.length === 0 ? (
                  <div className="flex items-start gap-3 rounded-xl bg-white p-4 dark:bg-slate-900"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" /><div><p className="font-semibold">You are caught up</p><p className="text-sm text-muted-foreground">No urgent booking, fulfillment, profile, or payout actions need your attention.</p></div></div>
                ) : (
                  <div className="space-y-3">
                    {attentionItems.map((item) => {
                      const Icon = item.icon;
                      return <Link key={item.id} href={item.href} className="group flex items-start gap-3 rounded-xl bg-white p-4 transition hover:shadow-sm dark:bg-slate-900"><Icon className="mt-0.5 h-5 w-5 text-amber-600" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-950 dark:text-white">{item.title}</p><Badge variant="outline" className="text-[10px] uppercase">{item.priority}</Badge></div><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.description}</p></div><ArrowRight className="mt-1 h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" /></Link>;
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <section>
              <div className="mb-4"><h2 className="text-xl font-bold text-slate-950 dark:text-white">Your business, grouped by purpose</h2><p className="text-sm text-slate-600 dark:text-slate-300">Open the outcome you need—not a wall of unrelated tools.</p></div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {workspaceLinks.map((item) => {
                  const Icon = item.icon;
                  return <Link key={item.label} href={item.href} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"><div className="flex items-start justify-between"><div className="rounded-xl bg-purple-100 p-2.5 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"><Icon className="h-5 w-5" /></div><ArrowRight className="h-4 w-4 text-slate-400 transition-transform group-hover:translate-x-1" /></div><h3 className="mt-4 font-semibold text-slate-950 dark:text-white">{item.label}</h3><p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">{item.description}</p></Link>;
                })}
              </div>
            </section>

            {(isCreator || isVenue) && (
              <Card><CardContent className="grid gap-4 p-5 sm:grid-cols-3"><div><p className="text-2xl font-bold">{bookings.filter((booking) => booking.status === 'pending').length}</p><p className="text-sm text-muted-foreground">Pending bookings</p></div><div><p className="text-2xl font-bold">{orders.filter((order) => order.paymentStatus === 'paid' && order.status !== 'completed').length}</p><p className="text-sm text-muted-foreground">Open orders</p></div><div><p className="text-2xl font-bold">{isCreator ? events.length : '—'}</p><p className="text-sm text-muted-foreground">Published events</p></div></CardContent></Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
