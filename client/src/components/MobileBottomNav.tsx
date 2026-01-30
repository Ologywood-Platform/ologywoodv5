import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, MessageCircle, Calendar, User } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Don't show on desktop
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    return null;
  }

  const navItems: NavItem[] = [
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
      badge: 0, // Would be populated from API
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

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind nav */}
      <div className="h-20 md:hidden" />

      {/* Bottom Navigation - Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
        <div className="flex items-center justify-around h-20">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors relative ${
                isActive(item.path)
                  ? 'text-purple-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
              {isActive(item.path) && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
