import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  BookOpen,
  CalendarPlus,
  Megaphone,
  Plus,
  Radio,
  ShoppingBag,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type CreateRole = 'creator' | 'venue' | 'admin' | 'blogger' | 'fan' | 'team' | 'guest';

export function CreateActionDialog({ role, profileSlug, compact = false }: { role: CreateRole; profileSlug?: string | null; compact?: boolean }) {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);

  const creatorActions = [
    { label: 'Sandbox Post', description: 'Share one current update beneath your bio.', href: profileSlug ? `/artist/${profileSlug}` : '/profile/edit', icon: Sparkles },
    { label: 'Event & tickets', description: 'Create an event and choose how fans attend.', href: '/events/create', icon: CalendarPlus },
    { label: 'Shop item or Book', description: 'Sell merch, physical Books, or secure eBooks.', href: '/merch', icon: ShoppingBag },
    { label: 'Content release', description: 'Monetize content hosted where you choose.', href: '/content-releases', icon: Megaphone },
    { label: 'Fan Club', description: 'Create recurring membership support.', href: '/fan-club', icon: Users },
    { label: 'Ology Live session', description: 'Offer a paid or free virtual experience.', href: '/ology-live/dashboard', icon: Radio },
  ];

  const venueActions = [
    { label: 'Venue event', description: 'Publish an event hosted at your venue.', href: '/venue/events/create', icon: CalendarPlus },
    { label: 'Booking request', description: 'Find talent and start a booking.', href: '/browse', icon: Users },
    { label: 'Shop item', description: 'Create a venue product or special offer.', href: '/merch', icon: ShoppingBag },
  ];

  const bloggerActions = [
    { label: 'Blog post', description: 'Create a draft in Blog Management.', href: '/admin/blog', icon: BookOpen },
  ];

  const adminActions = [
    ...bloggerActions,
    { label: 'Review platform', description: 'Open the administration workspace.', href: '/admin', icon: Users },
  ];

  const actions = role === 'creator' ? creatorActions : role === 'venue' ? venueActions : role === 'admin' ? adminActions : role === 'blogger' ? bloggerActions : [];
  if (actions.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size={compact ? 'icon' : 'default'}
          variant={compact ? 'ghost' : 'default'}
          className={compact ? 'h-9 w-9 text-purple-700 dark:text-purple-300' : 'gap-2 bg-purple-600 hover:bg-purple-700'}
          aria-label="Create something"
          title="Create"
        >
          <Plus className="h-4 w-4" />
          {!compact && 'Create'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>What do you want to create?</DialogTitle>
          <DialogDescription>Start with the outcome. OlogyWood will take you to the right tool.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                onClick={() => { setOpen(false); navigate(action.href); }}
                className="rounded-xl border border-slate-200 p-4 text-left transition hover:border-purple-400 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-slate-700 dark:hover:bg-purple-950/30"
              >
                <Icon className="mb-3 h-5 w-5 text-purple-600 dark:text-purple-300" />
                <span className="block font-semibold text-slate-950 dark:text-white">{action.label}</span>
                <span className="mt-1 block text-sm leading-5 text-slate-600 dark:text-slate-300">{action.description}</span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
