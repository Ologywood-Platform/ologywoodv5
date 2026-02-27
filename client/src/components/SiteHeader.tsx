import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Heart, LogOut, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getLoginUrl } from '@/const';
import { getDashboardUrl } from '@/utils/dashboardUrl';
import { trpc } from '@/lib/trpc';
import { useState, useEffect, useRef, useCallback } from 'react';

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
      className="text-red-600 hover:text-red-700 text-sm px-4"
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
  const [loginUrl, setLoginUrl] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLoginUrl = async () => {
      const url = await getLoginUrl();
      setLoginUrl(url);
    };
    fetchLoginUrl();
  }, []);

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

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    closeMobile();
    if (!loginUrl) {
      const url = await getLoginUrl();
      if (url) window.location.href = url;
    } else {
      window.location.href = loginUrl;
    }
  };

  const isFollowingPage = location === '/following';

  return (
    <header className="border-b bg-white sticky top-0 z-50" ref={menuRef}>
      <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary">
          {largeLogo ? (
            <img src="/logo-lg.png" alt="Ologywood" className="h-8 sm:h-10 w-auto object-contain" />
          ) : (
            <img src="/logo-sm.png" alt="Ologywood" className="h-7 sm:h-8 w-7 sm:w-8 rounded" />
          )}
          <span>Ologywood</span>
        </Link>

        {/* Desktop Navigation — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-3">
          {extraNav}

          {!hideBrowse && (
            <Link href="/browse">
              <Button variant="ghost" size="sm" className="text-sm px-4">
                Browse
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <>
              <Link href="/following">
                <Button
                  variant={isFollowingPage ? 'default' : 'ghost'}
                  size="sm"
                  className={`text-sm px-4 gap-1 ${
                    isFollowingPage ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFollowingPage ? 'fill-current' : ''}`} />
                  Following
                </Button>
              </Link>

              <Link href={getDashboardUrl(user)}>
                <Button variant="ghost" size="sm" className="text-sm px-4">
                  Dashboard
                </Button>
              </Link>

              <span className="text-sm text-muted-foreground max-w-[150px] truncate">
                {user?.name || user?.email}
              </span>

              <LogoutButton />
            </>
          ) : (
            <Button size="sm" className="text-sm px-4" onClick={handleSignIn}>
              Sign In
            </Button>
          )}
        </nav>

        {/* Mobile Hamburger Toggle — visible on mobile only */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <nav className="md:hidden border-t bg-white px-4 pb-4 pt-2 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {extraNav}

          {!hideBrowse && (
            <Link href="/browse" onClick={closeMobile} className="block">
              <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                Browse
              </Button>
            </Link>
          )}

          <Link href="/events" onClick={closeMobile} className="block">
            <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
              Events
            </Button>
          </Link>

          <Link href="/pricing" onClick={closeMobile} className="block">
            <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
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
                    isFollowingPage ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isFollowingPage ? 'fill-current' : ''}`} />
                  Following
                </Button>
              </Link>

              <Link href={getDashboardUrl(user)} onClick={closeMobile} className="block">
                <Button variant="ghost" size="sm" className="w-full justify-start text-sm">
                  Dashboard
                </Button>
              </Link>

              <div className="pt-2 border-t mt-2">
                <p className="text-sm text-muted-foreground px-4 py-1 truncate">
                  {user?.name || user?.email}
                </p>
                <LogoutButton onAction={closeMobile} />
              </div>
            </>
          ) : (
            <div className="pt-2 border-t mt-2">
              <Button size="sm" className="w-full text-sm" onClick={handleSignIn}>
                Sign In
              </Button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
