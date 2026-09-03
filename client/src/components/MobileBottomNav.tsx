import { Compass, Heart, LayoutDashboard, Library, Sparkles, Store } from 'lucide-react';
import { useLocation } from 'wouter';
import { CORE_DESTINATIONS, isDestinationActive } from '@/lib/ecosystemNavigation';

type NavMode = 'public' | 'dashboard' | 'venue-dashboard';

const ICONS = {
  discover: Compass,
  experiences: Sparkles,
  shop: Store,
  community: Heart,
  'my-ology': Library,
  workspace: LayoutDashboard,
};

/**
 * The mobile bottom rail mirrors the same six destinations as the global shell.
 * The `mode` prop remains for backward compatibility with existing dashboards,
 * but role-specific destinations now belong inside Workspace rather than in a
 * competing global navigation model.
 */
export function MobileBottomNav({ mode: _mode = 'public' }: { mode?: NavMode }) {
  const [pathname, navigate] = useLocation();

  return (
    <>
      <div className="h-20 lg:hidden" />
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        aria-label="Core OlogyWood destinations"
      >
        <div className="grid min-h-[60px] grid-cols-6">
          {CORE_DESTINATIONS.map((item) => {
            const Icon = ICONS[item.id];
            const active = isDestinationActive(pathname, item.matches);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.href)}
                className={`relative flex min-h-[52px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-0.5 transition-colors ${active ? 'text-purple-700 dark:text-purple-300' : 'text-muted-foreground hover:text-foreground'}`}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className={`max-w-full truncate text-[9px] leading-tight ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                {active && <span className="absolute bottom-0 h-0.5 w-7 rounded-full bg-purple-600" />}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
