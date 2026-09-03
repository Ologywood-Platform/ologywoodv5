export type CoreDestinationId =
  | 'discover'
  | 'experiences'
  | 'shop'
  | 'community'
  | 'my-ology'
  | 'workspace';

export type NavigationUser = {
  role?: string | null;
  isAdmin?: boolean | null;
  talentType?: string | null;
};

export const CORE_DESTINATIONS: Array<{
  id: CoreDestinationId;
  label: string;
  href: string;
  description: string;
  matches: string[];
}> = [
  {
    id: 'discover',
    label: 'Discover',
    href: '/discover',
    description: 'Find talent, venues, events, live sessions, and releases.',
    matches: ['/discover', '/browse', '/venues', '/artist/', '/venue/'],
  },
  {
    id: 'experiences',
    label: 'Experiences',
    href: '/experiences',
    description: 'Book talent, attend events, and join Ology Live.',
    matches: ['/experiences', '/events', '/ology-live', '/book/', '/booking/'],
  },
  {
    id: 'shop',
    label: 'Shop',
    href: '/shop',
    description: 'Support creators through products, Books, eBooks, and releases.',
    matches: ['/shop', '/merch/', '/purchase-success'],
  },
  {
    id: 'community',
    label: 'Community',
    href: '/community',
    description: 'Follow creators, see Sandbox Posts, join Fan Clubs, and connect.',
    matches: ['/community', '/following', '/messages', '/fan-club', '/sandbox'],
  },
  {
    id: 'my-ology',
    label: 'My Ology',
    href: '/my-ology',
    description: 'Your tickets, purchases, bookings, library, and follows.',
    matches: ['/my-ology', '/my-tickets', '/my-purchases', '/my-bookings', '/my-music'],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    href: '/workspace',
    description: 'Manage your profile, business, content, delivery, and money.',
    matches: ['/workspace', '/dashboard', '/venue-dashboard', '/admin', '/blogger-dashboard'],
  },
];

export const LEARN_DESTINATIONS = [
  { label: 'Blog', href: '/blog', description: 'Platform news and creator resources' },
  { label: 'Sponsors', href: '/sponsor-opportunities', description: 'Brand and sponsorship opportunities' },
  { label: 'Pricing', href: '/pricing', description: 'Plans and included features' },
  { label: 'Help Center', href: '/help', description: 'Guidance for every platform role' },
  { label: 'How It Works', href: '/how-it-works', description: 'Understand the OlogyWood journey' },
  { label: 'About', href: '/about', description: 'Mission, principles, and company information' },
];

export function isDestinationActive(pathname: string, matches: string[]) {
  return matches.some((match) => pathname === match || pathname.startsWith(match));
}

export function getWorkspaceRole(user?: NavigationUser | null) {
  if (!user) return 'guest' as const;
  if (user.role === 'admin') return 'admin' as const;
  if (user.role === 'venue') return 'venue' as const;
  if (user.role === 'blogger') return 'blogger' as const;
  if (user.role === 'fan' || user.role === 'user') return 'fan' as const;
  if (user.role === 'team_member') return 'team' as const;
  return 'creator' as const;
}

export function isMusicTalent(talentType?: string | null) {
  return !talentType || talentType === 'artist';
}
