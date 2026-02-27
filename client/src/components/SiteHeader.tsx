import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Heart, LogOut } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getLoginUrl } from '@/const';
import { getDashboardUrl } from '@/utils/dashboardUrl';
import { trpc } from '@/lib/trpc';
import { useState, useEffect } from 'react';

function LogoutButton() {
  const logoutMutation = (trpc.auth.logout as any).useMutation?.() || { mutateAsync: async () => {} };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/';
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-600 hover:text-red-700 text-xs sm:text-sm px-2 sm:px-4"
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
    >
      <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
      <span className="hidden sm:inline">{logoutMutation.isPending ? 'Logging out...' : 'Logout'}</span>
      <span className="sm:hidden">{logoutMutation.isPending ? '...' : 'Out'}</span>
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

  useEffect(() => {
    const fetchLoginUrl = async () => {
      const url = await getLoginUrl();
      setLoginUrl(url);
    };
    fetchLoginUrl();
  }, []);

  const handleSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!loginUrl) {
      const url = await getLoginUrl();
      if (url) window.location.href = url;
    } else {
      window.location.href = loginUrl;
    }
  };

  const isFollowingPage = location === '/following';

  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-1 sm:gap-2 text-lg sm:text-2xl font-bold text-primary">
          {largeLogo ? (
            <img src="/logo-lg.png" alt="Ologywood" className="h-8 sm:h-10 w-auto object-contain" />
          ) : (
            <img src="/logo-sm.png" alt="Ologywood" className="h-6 sm:h-8 w-6 sm:w-8 rounded" />
          )}
          <span className="hidden sm:inline">Ologywood</span>
          <span className="sm:hidden">OW</span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 sm:gap-3">
          {extraNav}

          {!hideBrowse && (
            <Link href="/browse">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                Browse
              </Button>
            </Link>
          )}

          {isAuthenticated ? (
            <>
              {/* Following link - visible for all logged-in users */}
              <Link href="/following">
                <Button
                  variant={isFollowingPage ? 'default' : 'ghost'}
                  size="sm"
                  className={`text-xs sm:text-sm px-2 sm:px-4 gap-1 ${
                    isFollowingPage ? 'bg-purple-600 hover:bg-purple-700 text-white' : ''
                  }`}
                >
                  <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isFollowingPage ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline">Following</span>
                </Button>
              </Link>

              <Link href={getDashboardUrl(user)}>
                <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                  Dashboard
                </Button>
              </Link>

              <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline max-w-[150px] truncate">
                {user?.name || user?.email}
              </span>

              <LogoutButton />
            </>
          ) : (
            <>
              <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-4" onClick={handleSignIn}>
                Sign In
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
