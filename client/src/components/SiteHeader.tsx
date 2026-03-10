import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Heart, LogOut, Menu, X, ShoppingBag, CalendarCheck } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getDashboardUrl } from '@/utils/dashboardUrl';
import { trpc } from '@/lib/trpc';
import { useState, useEffect, useRef, useCallback } from 'react';
import { DarkModeToggle } from './DarkModeToggle';
import { QuickSignupModal } from './QuickSignupModal';
import RealtimeNotifications from './RealtimeNotifications';

function LogoutButton({ onAction }: { onAction?: () => void }) {
  const logoutMutation = (trpc.auth.logout as any).useMutation?.() || { mutateAsync: async () => {} };

  const handleLogout = async () => {
    onAction?.();
    await logoutMutation.mutateAsync();
    window.location.href = '/';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm px-4"
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
    </Button>
  );
}

interface SiteHeaderProps {
  /** Show the large logo variant (used on Home page) */
  largeLogo?: boolean;
  /** Additional nav items to render before the default ones */
  extraNav?: React.ReactNode;
  /** Hide the Browse link (e.g. when already on Browse page) */
  hideBrowse?: boolean;
}

export default function SiteHeader({ largeLogo = false, extraNav, hideBrowse = false }: SiteHeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signup' | 'login'>('login');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const openSignIn = () => {
    setAuthModalTab('login');
    setAuthModalOpen(true);
    closeMobile();
  };

  const openSignUp = () => {
    setAuthModalTab('signup');
    setAuthModalOpen(true);
    closeMobile();
  };

  const isFollowingPage = location === '/following';

  return (
    <>
      <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-200" ref={menuRef}>
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary dark:text-purple-400">
            {largeLogo ? (
              <img src="/logo-lg.png" alt="Ologywood" className="h-8 sm:h-10 w-auto object-contain" />
            ) : (
              <img src="/logo-sm.png" alt="Ologywood" className="h-7 sm:h-8 w-7 sm:w-8 rounded" />
            )}
            <span>Ologywood</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-3">
            {extraNav}

            {!hideBrowse && (
              <Link href="/browse">
                <Button variant="ghost" size="sm" className="text-sm px-4 dark:text-gray-300 dark:hover:text-white">
                  Browse
                </Button>
              </Link>
            )}

            <Link href="/events">
              <Button variant="ghost" size="sm" className="text-sm px-4 dark:text-gray-300 dark:hover:text-white">
                Events
              </Button>
            </Link>

            <Link href="/blog">
              <Button variant="ghost" size="sm" className="text-sm px-4 dark:text-gray-300 dark:hover:text-white">
                Blog
              </Button>
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/following">
                  <Button
                    variant={isFollowingPage ? 'default' : 'ghost'}
                    size="sm"
                    className={`text-sm px-4 gap-1 ${
                      isFollowingPage
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'dark:text-gray-300 dark:hover:text-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFollowingPage ? 'fill-current' : ''}`} />
                    Following
                  </Button>
                </Link>

                <Link href={getDashboardUrl(user)}>
                  <Button variant="ghost" size="sm" className="text-sm px-4 dark:text-gray-300 dark:hover:text-white">
                    Dashboard
                  </Button>
                </Link>

                <Link href="/my-bookings">
                  <Button variant="ghost" size="sm" className="text-sm px-4 dark:text-gray-300 dark:hover:text-white">
                    <CalendarCheck className="h-4 w-4 mr-1" />
                    Bookings
                  </Button>
                </Link>

                <Link href="/my-purchases">
                  <Button variant="ghost" size="sm" className="text-sm px-4 dark:text-gray-300 dark:hover:text-white">
                    <ShoppingBag className="h-4 w-4 mr-1" />
                    Purchases
                  </Button>
                </Link>

                <span className="text-sm text-muted-foreground max-w-[150px] truncate">
                  {user?.name || user?.email}
                </span>

                <RealtimeNotifications />

                <DarkModeToggle compact />

                <LogoutButton />
              </>
            ) : (
              <>
                <DarkModeToggle compact />
                <Button variant="ghost" size="sm" className="text-sm px-4 dark:text-gray-300 dark:hover:text-white" onClick={openSignUp}>
                  Sign Up
                </Button>
                <Button size="sm" className="text-sm px-4" onClick={openSignIn}>
                  Log In
                </Button>
              </>
            )}
          </nav>

          {/* Mobile: Dark mode toggle + Hamburger */}
          <div className="md:hidden flex items-center gap-1">
            {isAuthenticated && <RealtimeNotifications />}
            <DarkModeToggle compact />
            <button
              className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <nav className="md:hidden border-t bg-white dark:bg-gray-900 dark:border-gray-800 px-4 pb-4 pt-2 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-200 transition-colors">
            {extraNav}

            {!hideBrowse && (
              <Link href="/browse" onClick={closeMobile} className="block">
                <Button variant="ghost" size="sm" className="w-full justify-start text-sm dark:text-gray-300 dark:hover:text-white">
                  Browse
                </Button>
              </Link>
            )}

            <Link href="/events" onClick={closeMobile} className="block">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm dark:text-gray-300 dark:hover:text-white">
                Events
              </Button>
            </Link>

            <Link href="/blog" onClick={closeMobile} className="block">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm dark:text-gray-300 dark:hover:text-white">
                Blog
              </Button>
            </Link>

            <Link href="/pricing" onClick={closeMobile} className="block">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm dark:text-gray-300 dark:hover:text-white">
                Pricing
              </Button>
            </Link>

            {isAuthenticated ? (
              <>
                <Link href="/following" onClick={closeMobile} className="block">
                  <Button
                    variant={isFollowingPage ? 'default' : 'ghost'}
                    size="sm"
                    className={`w-full justify-start text-sm gap-2 ${
                      isFollowingPage
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'dark:text-gray-300 dark:hover:text-white'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFollowingPage ? 'fill-current' : ''}`} />
                    Following
                  </Button>
                </Link>

                <Link href={getDashboardUrl(user)} onClick={closeMobile} className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm dark:text-gray-300 dark:hover:text-white">
                    Dashboard
                  </Button>
                </Link>

                <Link href="/my-bookings" onClick={closeMobile} className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm gap-2 dark:text-gray-300 dark:hover:text-white">
                    <CalendarCheck className="h-4 w-4" />
                    My Bookings
                  </Button>
                </Link>

                <Link href="/my-purchases" onClick={closeMobile} className="block">
                  <Button variant="ghost" size="sm" className="w-full justify-start text-sm gap-2 dark:text-gray-300 dark:hover:text-white">
                    <ShoppingBag className="h-4 w-4" />
                    My Purchases
                  </Button>
                </Link>

                <div className="pt-2 border-t dark:border-gray-700 mt-2">
                  <p className="text-sm text-muted-foreground px-4 py-1 truncate">
                    {user?.name || user?.email}
                  </p>
                  <LogoutButton onAction={closeMobile} />
                </div>
              </>
            ) : (
              <div className="pt-2 border-t dark:border-gray-700 mt-2 space-y-2">
                <Button variant="outline" size="sm" className="w-full text-sm" onClick={openSignUp}>
                  Sign Up
                </Button>
                <Button size="sm" className="w-full text-sm" onClick={openSignIn}>
                  Log In
                </Button>
              </div>
            )}
          </nav>
        )}
      </header>

      {/* Auth Modal */}
      <QuickSignupModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
        actionType="general"
      />
    </>
  );
}
