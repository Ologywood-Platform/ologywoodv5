import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, X, ChevronDown, LayoutDashboard, User, Settings, Download, Shield, Library, MoreHorizontal, Search, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { getDashboardUrl } from '@/utils/dashboardUrl';
import { trpc } from '@/lib/trpc';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DarkModeToggle } from './DarkModeToggle';
import { QuickSignupModal } from './QuickSignupModal';
import RealtimeNotifications from './RealtimeNotifications';
import { HelperNotesToggle } from './HelperNotesToggle';
import EarlyAccessBanner from './EarlyAccessBanner';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { CORE_DESTINATIONS, LEARN_DESTINATIONS, getWorkspaceRole, isDestinationActive } from '@/lib/ecosystemNavigation';
import { CreateActionDialog } from '@/components/CreateActionDialog';

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
      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm w-full justify-start"
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

export function SiteHeader({ largeLogo = false, extraNav, hideBrowse = false }: SiteHeaderProps) {
  const { user, isAuthenticated } = useAuth();
  const { isInstallable, isInstalled, isIOSSafari, promptInstall } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [learnMenuOpen, setLearnMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signup' | 'login'>('login');

  // Check if Terms banner was temporarily dismissed (remind later)
  const termsRemindLaterActive = useMemo(() => {
    if (!isAuthenticated) return false;
    const TERMS_VERSION = '2026-09-01';
    const accepted = localStorage.getItem('ologywood_terms_accepted_version');
    if (accepted === TERMS_VERSION) return false;
    const remindLater = localStorage.getItem('ologywood_terms_remind_later');
    if (remindLater) {
      const dismissedAt = parseInt(remindLater, 10);
      if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) return true;
    }
    return false;
  }, [isAuthenticated]);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const learnMenuRef = useRef<HTMLDivElement>(null);

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

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!learnMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (learnMenuRef.current && !learnMenuRef.current.contains(e.target as Node)) {
        setLearnMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [learnMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    setLearnMenuOpen(false);
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

  // Truncate display name for the dropdown trigger
  const displayName = user?.name || user?.email || 'Account';
  const shortName = displayName.length > 16 ? displayName.slice(0, 14) + '...' : displayName;
  const workspaceRole = getWorkspaceRole(user as any);

  return (
    <>
      <div className="sticky top-0 z-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <EarlyAccessBanner />
      <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-800 transition-colors duration-200" ref={menuRef}>
        <div className="container mx-auto px-4 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold text-primary dark:text-purple-400 shrink-0">
            {largeLogo ? (
              <img src="/logo-lg.png" alt="Ologywood" className="h-8 sm:h-10 w-auto object-contain" />
            ) : (
              <img src="/logo-sm.png" alt="Ologywood" className="h-7 sm:h-8 w-7 sm:w-8 rounded" />
            )}
            <span>Ologywood<sup className="text-[8px] align-super ml-0.5">™</sup></span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {extraNav}
            {CORE_DESTINATIONS.map((item) => {
              const active = isDestinationActive(location, item.matches);
              return (
                <Link key={item.id} href={item.href}>
                  <Button variant="ghost" size="sm" className={`text-sm px-2.5 ${active ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-semibold' : 'dark:text-gray-300 dark:hover:text-white'}`}>
                    {item.label}
                  </Button>
                </Link>
              );
            })}

            <div className="relative" ref={learnMenuRef}>
              <Button variant="ghost" size="sm" className="gap-1 px-2 text-sm dark:text-gray-300 dark:hover:text-white" onClick={() => setLearnMenuOpen((open) => !open)} aria-expanded={learnMenuOpen}>
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More OlogyWood links</span>
              </Button>
              {learnMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-xl border bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-900">
                  <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Learn & support</p>
                  {LEARN_DESTINATIONS.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setLearnMenuOpen(false)} className="block rounded-lg px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                      <span className="block text-sm font-medium dark:text-gray-200">{item.label}</span>
                      <span className="block text-xs text-muted-foreground">{item.description}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                <Link href="/discover" title="Search OlogyWood">
                  <Button variant="ghost" size="icon" className="h-9 w-9 dark:text-gray-300 dark:hover:text-white" aria-label="Search OlogyWood">
                    <Search className="h-4 w-4" />
                  </Button>
                </Link>
                <CreateActionDialog role={workspaceRole} compact />
                <Link href="/messages" title="Inbox">
                  <Button variant="ghost" size="icon" className="h-9 w-9 dark:text-gray-300 dark:hover:text-white" aria-label="Inbox">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </Link>
                <RealtimeNotifications />

                <HelperNotesToggle />
                <DarkModeToggle compact />

                      {/* User dropdown menu — account controls stay separate from the six core destinations. */}
                <div className="relative" ref={userMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm px-3 gap-1 dark:text-gray-300 dark:hover:text-white"
                    onClick={() => setUserMenuOpen((v) => !v)}
                  >
                    <span className="relative">
                      {((user as any)?.customAvatarUrl || (user as any)?.avatarUrl) ? (
                        <img src={(user as any).customAvatarUrl || (user as any).avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      {termsRemindLaterActive && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white dark:border-gray-900" title="Terms of Service update pending" />
                      )}
                    </span>
                    <span className="hidden lg:inline max-w-[120px] truncate">{shortName}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      {/* User info */}
                      <div className="px-4 py-2 border-b dark:border-gray-700 flex items-center gap-3">
                        {((user as any)?.customAvatarUrl || (user as any)?.avatarUrl) ? (
                          <img src={(user as any).customAvatarUrl || (user as any).avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                            <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate dark:text-gray-200">{user?.name || 'User'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        </div>
                      </div>

                      {/* Nav links */}
                      <div className="py-1">
                        <Link href={getDashboardUrl(user)} onClick={() => setUserMenuOpen(false)} className="block">
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4" />
                            Workspace
                          </button>
                        </Link>

                        {(user as any)?.isAdmin && (
                          <Link href="/admin" onClick={() => setUserMenuOpen(false)} className="block">
                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-purple-600 dark:text-purple-400 flex items-center gap-2 font-medium">
                              <Shield className="h-4 w-4" />
                              Admin Dashboard
                            </button>
                          </Link>
                        )}

                        <Link href="/my-ology" onClick={() => setUserMenuOpen(false)} className="block">
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 flex items-center gap-2">
                            <Library className="h-4 w-4" />
                            My Ology
                          </button>
                        </Link>

                        <Link href="/settings" onClick={() => setUserMenuOpen(false)} className="block">
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300 flex items-center gap-2">
                            <Settings className="h-4 w-4" />
                            Manage Preferences
                          </button>
                        </Link>

                        {termsRemindLaterActive && (
                          <Link href="/terms-of-service" onClick={() => setUserMenuOpen(false)} className="block">
                            <button className="w-full text-left px-4 py-2 text-xs hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-400 flex items-center gap-2">
                              <span className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0" />
                              Review updated Terms of Service
                            </button>
                          </Link>
                        )}

                        {isInstallable && !isInstalled && (
                          <button
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-purple-600 dark:text-purple-400 flex items-center gap-2 font-medium"
                            onClick={() => { setUserMenuOpen(false); isIOSSafari ? setShowIOSInstructions(true) : promptInstall(); }}
                          >
                            <Download className="h-4 w-4" />
                            Download App
                          </button>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t dark:border-gray-700 py-1">
                        <LogoutButton onAction={() => setUserMenuOpen(false)} />
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <DarkModeToggle compact />
                <Button variant="ghost" size="sm" className="text-sm px-3 dark:text-gray-300 dark:hover:text-white" onClick={openSignUp}>
                  Sign Up
                </Button>
                <Button size="sm" className="text-sm px-4" onClick={openSignIn}>
                  Log In
                </Button>
              </>
            )}
          </nav>

          {/* Mobile: Dark mode toggle + Hamburger */}
          <div className="lg:hidden flex items-center gap-1">
            {isAuthenticated && <RealtimeNotifications />}
            <DarkModeToggle compact />
            <button
              className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
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
          <nav className="lg:hidden border-t bg-white dark:bg-gray-900 dark:border-gray-800 px-4 pb-4 pt-2 space-y-0.5 shadow-lg animate-in slide-in-from-top-2 duration-200 transition-colors max-h-[80dvh] overflow-y-auto">
            {extraNav}
            {CORE_DESTINATIONS.map((item) => {
              const active = isDestinationActive(location, item.matches);
              return <Link key={item.id} href={item.href} onClick={closeMobile} className="block"><Button variant="ghost" size="sm" className={`min-h-[44px] w-full justify-start text-sm ${active ? 'bg-purple-50 font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'dark:text-gray-300 dark:hover:text-white'}`}>{item.label}</Button></Link>;
            })}
            <div className="my-2 border-t dark:border-gray-700" />
            <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Learn & support</p>
            {LEARN_DESTINATIONS.map((item) => <Link key={item.href} href={item.href} onClick={closeMobile} className="block"><Button variant="ghost" size="sm" className="min-h-[44px] w-full justify-start text-sm dark:text-gray-300 dark:hover:text-white">{item.label}</Button></Link>)}

            {isAuthenticated ? (
              <>
                <div className="grid grid-cols-2 gap-2 px-1 py-2">
                  <CreateActionDialog role={workspaceRole} />
                  <Link href="/messages" onClick={closeMobile} className="block">
                    <Button variant="outline" className="w-full gap-2"><MessageCircle className="h-4 w-4" />Inbox</Button>
                  </Link>
                </div>
                {(user as any)?.isAdmin && (
                  <Link href="/admin" onClick={closeMobile} className="block">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-sm gap-2 min-h-[44px] text-purple-600 dark:text-purple-400 font-medium">
                      <Shield className="h-4 w-4" />
                      Admin Dashboard
                    </Button>
                  </Link>
                )}

                <div className="pt-2 border-t dark:border-gray-700 mt-2">
                  {isInstallable && !isInstalled && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-sm gap-2 text-purple-600 dark:text-purple-400 font-medium"
                      onClick={() => { closeMobile(); isIOSSafari ? setShowIOSInstructions(true) : promptInstall(); }}
                    >
                      <Download className="h-4 w-4" />
                      Download App
                    </Button>
                  )}
                  <div className="flex items-center gap-2 px-4 py-1">
                    {((user as any)?.customAvatarUrl || (user as any)?.avatarUrl) ? (
                      <img src={(user as any).customAvatarUrl || (user as any).avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                    ) : null}
                    <p className="text-sm text-muted-foreground truncate">
                      {user?.name || user?.email}
                    </p>
                  </div>
                  <LogoutButton onAction={closeMobile} />
                </div>
              </>
            ) : (
              <div className="pt-2 border-t dark:border-gray-700 mt-2 space-y-2">
                {isInstallable && !isInstalled && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-sm gap-2 text-purple-600 dark:text-purple-400 font-medium"
                    onClick={() => { closeMobile(); isIOSSafari ? setShowIOSInstructions(true) : promptInstall(); }}
                  >
                    <Download className="h-4 w-4" />
                    Download App
                  </Button>
                )}
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
      </div>

      {/* Auth Modal */}
      <QuickSignupModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
        actionType="general"
      />

      {/* iOS Install Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowIOSInstructions(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-4">
                <Download className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold dark:text-white mb-2">Install Ologywood™</h3>
              <p className="text-sm text-muted-foreground mb-5">
                Add Ologywood to your home screen for a native app experience.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium dark:text-gray-200">Tap the Share button</p>
                  <p className="text-xs text-muted-foreground">The square icon with an arrow at the bottom of Safari</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium dark:text-gray-200">Scroll down and tap "Add to Home Screen"</p>
                  <p className="text-xs text-muted-foreground">You may need to scroll the share menu to find it</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium dark:text-gray-200">Tap "Add" to confirm</p>
                  <p className="text-xs text-muted-foreground">Ologywood will appear on your home screen</p>
                </div>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={() => setShowIOSInstructions(false)}
            >
              Got it
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

export default SiteHeader;
