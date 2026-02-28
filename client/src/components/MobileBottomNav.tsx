import React from 'react';
import { useLocation } from 'wouter';
import { Home, Search, MessageCircle, Calendar, User, LayoutDashboard, DollarSign, Music, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

type NavMode = 'public' | 'dashboard' | 'venue-dashboard';

export function MobileBottomNav({ mode = 'public' }: { mode?: NavMode }) {
  const [pathname, navigate] = useLocation();
  const { user } = useAuth();

  const publicNavItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: <Home className="h-5 w-5" />,
      path: '/',
    },
    {
      id: 'browse',
      label: 'Browse',
      icon: <Search className="h-5 w-5" />,
      path: '/browse',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageCircle className="h-5 w-5" />,
      path: '/messages',
      badge: 0,
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <Calendar className="h-5 w-5" />,
      path: '/bookings',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="h-5 w-5" />,
      path: user?.role === 'artist' ? '/artist-profile' : '/venue-profile',
    },
  ];

  const dashboardNavItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/artist-dashboard',
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <Calendar className="h-5 w-5" />,
      path: '/bookings',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageCircle className="h-5 w-5" />,
      path: '/messages',
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: <DollarSign className="h-5 w-5" />,
      path: '/earnings',
    },
    {
      id: 'more',
      label: 'More',
      icon: <MoreHorizontal className="h-5 w-5" />,
      path: '/artist-dashboard#more',
    },
  ];

  const venueDashboardNavItems: NavItem[] = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: '/venue-dashboard',
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: <Calendar className="h-5 w-5" />,
      path: '/bookings',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageCircle className="h-5 w-5" />,
      path: '/messages',
    },
    {
      id: 'artists',
      label: 'Artists',
      icon: <Music className="h-5 w-5" />,
      path: '/browse',
    },
    {
      id: 'more',
      label: 'More',
      icon: <MoreHorizontal className="h-5 w-5" />,
      path: '/venue-dashboard#more',
    },
  ];

  const navItems = mode === 'dashboard'
    ? dashboardNavItems
    : mode === 'venue-dashboard'
    ? venueDashboardNavItems
    : publicNavItems;

  const isActive = (item: NavItem) => {
    if (item.id === 'overview') {
      return pathname === '/artist-dashboard' || pathname === '/dashboard' || pathname === '/venue-dashboard';
    }
    if (item.id === 'more') return false;
    return pathname === item.path || pathname.startsWith(item.path + '/');
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-16 sm:hidden" />

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t sm:hidden z-50 safe-area-bottom">
        <div className="grid grid-cols-5 h-14">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'more') {
                    // Scroll to profile/settings section on dashboard
                    if (pathname === '/artist-dashboard' || pathname === '/dashboard') {
                      const el = document.getElementById('quick-actions');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    } else if (pathname === '/venue-dashboard') {
                      const el = document.getElementById('venue-profile-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      navigate(mode === 'venue-dashboard' ? '/venue-dashboard' : '/artist-dashboard');
                    }
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-medium">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
