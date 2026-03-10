import { Suspense, lazy } from "react";
import { Toaster } from "sonner";
import CookieConsent from "./components/CookieConsent";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary, { PageErrorBoundary } from "./components/ErrorBoundary";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { CanonicalUpdater } from "./components/CanonicalUpdater";
import { RobotsMetaTag } from "./components/RobotsMetaTag";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AIChatWidget } from "./components/AIChatWidget";
import Footer from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";

// ============================================
// EAGERLY LOADED — Critical path pages
// ============================================
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ArtistProfile from "./pages/ArtistProfile";

// ============================================
// LAZY LOADED — Code-split for smaller initial bundle
// ============================================
const ArtistDashboardV3 = lazy(() => import('@/pages/ArtistDashboardV3').then(m => ({ default: m.ArtistDashboardV3 })));
const VenueDashboard = lazy(() => import('@/pages/VenueDashboard').then(m => ({ default: m.VenueDashboard })));
const RoleSelection = lazy(() => import("./pages/RoleSelection"));
const ArtistOnboarding = lazy(() => import("./pages/ArtistOnboarding"));
const VenueOnboarding = lazy(() => import("./pages/VenueOnboarding"));
const Availability = lazy(() => import("./pages/Availability"));
const RiderBuilder = lazy(() => import("./pages/RiderBuilder"));
const SavedRiders = lazy(() => import("./pages/SavedRiders"));
const Favorites = lazy(() => import("./pages/Favorites"));
const BookingDetail = lazy(() => import("./pages/BookingDetail"));
const BookingCreate = lazy(() => import("./pages/BookingCreate"));
const BookingsList = lazy(() => import("./pages/BookingsList"));
const BookingConfirmation = lazy(() => import("./pages/BookingConfirmation"));
const VenueProfile = lazy(() => import("./pages/VenueProfile"));
const VenueBrowse = lazy(() => import("./pages/VenueBrowse"));
const VenueProfileDetail = lazy(() => import("./pages/VenueProfileDetail"));
const Messages = lazy(() => import("./pages/Messages"));
const MessagesDetail = lazy(() => import("./pages/MessagesDetail"));
const Riders = lazy(() => import("./pages/Riders"));
const RiderTemplates = lazy(() => import("./pages/RiderTemplates").then(m => ({ default: m.RiderTemplates })));
const EventCreate = lazy(() => import("./pages/EventCreate"));
const EventDiscovery = lazy(() => import("./pages/EventDiscovery"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe").then(m => ({ default: m.Unsubscribe })));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const RevertEmail = lazy(() => import("./pages/RevertEmail"));
const ArtistEarnings = lazy(() => import("./pages/ArtistEarnings"));
const VenueInvoiceDashboard = lazy(() => import("./pages/VenueInvoiceDashboard"));
const Help = lazy(() => import("./pages/Help"));
const Following = lazy(() => import("./pages/Following"));
const AdminPayouts = lazy(() => import("./pages/AdminPayouts"));
const ArtistTaxReporting = lazy(() => import("./pages/ArtistTaxReporting"));
const ReleaseManager = lazy(() => import("./pages/ReleaseManager"));
const MyPurchases = lazy(() => import("./pages/MyPurchases"));
const PurchaseSuccess = lazy(() => import("./pages/PurchaseSuccess"));
const ClientBooking = lazy(() => import("./pages/ClientBooking"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard").then(m => ({ default: m.AdminDashboard })));

// Legal & marketing pages
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Cookies = lazy(() => import("./pages/Cookies"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const DMCAPolicy = lazy(() => import("./pages/DMCAPolicy"));
const SellMusic = lazy(() => import("./pages/SellMusic"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const ArtistHistory = lazy(() => import("./pages/ArtistHistory"));
const Contracts = lazy(() => import("./pages/Contracts"));
const ArtistEditProfile = lazy(() => import("./pages/ArtistEditProfile"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Loading fallback for lazy-loaded pages
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
    </div>
  );
}

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <ScrollToTop />
      <div className="flex-1">
        <Suspense fallback={<PageLoader />}>
        <Switch>
          {/* ============================================
              MVP CORE ROUTES ONLY - PRODUCTION PATHS
              ============================================ */}
          
          {/* Authentication & Accounts */}
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/get-started" component={RoleSelection} />
          <Route path="/onboarding/artist" component={ArtistOnboarding} />
          <Route path="/profile/edit" component={ArtistEditProfile} />
          <Route path="/onboarding/venue" component={VenueOnboarding} />
          <Route path="/dashboard">{() => <PageErrorBoundary><ArtistDashboardV3 /></PageErrorBoundary>}</Route>
          <Route path="/venue-dashboard">{() => <PageErrorBoundary><VenueDashboard /></PageErrorBoundary>}</Route>
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/revert-email" component={RevertEmail} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/earnings" component={ArtistEarnings} />
          <Route path="/earnings-dashboard">{() => <Redirect to="/earnings" />}</Route>
          <Route path="/venue-invoices" component={VenueInvoiceDashboard} />
          <Route path="/help" component={Help} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/payouts" component={AdminPayouts} />
          <Route path="/artist-tax-reporting" component={ArtistTaxReporting} />
          
          {/* Discovery */}
          <Route path="/browse">{() => <PageErrorBoundary><Browse /></PageErrorBoundary>}</Route>
          <Route path="/artist/:id">{(params: any) => <PageErrorBoundary><ArtistProfile {...params} /></PageErrorBoundary>}</Route>
          <Route path="/artists/:id/history" component={ArtistHistory} />
          <Route path="/venues" component={VenueBrowse} />
          <Route path="/venue/:id" component={VenueProfile} />
          <Route path="/venues/:id" component={VenueProfileDetail} />
          
          {/* Core Booking Flow */}
          <Route path="/booking/create">{() => <PageErrorBoundary><BookingCreate /></PageErrorBoundary>}</Route>
          <Route path="/booking/:id">{(params: any) => <PageErrorBoundary><BookingDetail {...params} /></PageErrorBoundary>}</Route>
          <Route path="/booking-confirmation/:id" component={BookingConfirmation} />
          <Route path="/bookings" component={BookingsList} />
          <Route path="/contracts">{() => <PageErrorBoundary><Contracts /></PageErrorBoundary>}</Route>
          
          {/* Event Management */}
          <Route path="/events" component={EventDiscovery} />
          <Route path="/events/create" component={EventCreate} />
          <Route path="/events/:id" component={EventDetail} />
          
          {/* White Label Release */}
          <Route path="/releases">{() => <PageErrorBoundary><ReleaseManager /></PageErrorBoundary>}</Route>
          <Route path="/book/:artistId">{(params: any) => <PageErrorBoundary><ClientBooking {...params} /></PageErrorBoundary>}</Route>
          <Route path="/my-bookings" component={MyBookings} />
          <Route path="/my-purchases" component={MyPurchases} />
          <Route path="/purchase-success" component={PurchaseSuccess} />
          
          {/* Rider System */}
          <Route path="/rider-builder">{() => <PageErrorBoundary><RiderBuilder /></PageErrorBoundary>}</Route>
          <Route path="/rider-templates" component={RiderTemplates} />
          <Route path="/saved-riders" component={SavedRiders} />
          <Route path="/favorites" component={Favorites} />
          <Route path="/riders" component={Riders} />
          
          {/* Communication */}
          <Route path="/messages">{() => <PageErrorBoundary><Messages /></PageErrorBoundary>}</Route>
          <Route path="/messages/:id">{(params: any) => <PageErrorBoundary><MessagesDetail {...params} /></PageErrorBoundary>}</Route>
          
          {/* Following */}
          <Route path="/following" component={Following} />

          {/* Availability Management */}
          <Route path="/availability" component={Availability} />
          
          {/* How It Works */}
          <Route path="/how-it-works" component={HowItWorks} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/contact" component={Contact} />
          <Route path="/faq" component={FAQ} />
          <Route path="/unsubscribe" component={Unsubscribe} />
          
          {/* Legal Pages (compliance only) */}
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/cookies" component={Cookies} />
          <Route path="/accessibility" component={Accessibility} />
          <Route path="/dmca" component={DMCAPolicy} />
          <Route path="/sell-music" component={SellMusic} />
          <Route path="/blog" component={Blog} />
          <Route path="/blog/:slug">{(params: any) => <BlogPost {...params} />}</Route>
          
          {/* ============================================
              HARD 404 - ALL OTHER ROUTES SILENCED
              ============================================ */}
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <CanonicalUpdater />
          <RobotsMetaTag />
          <Router />
          <AIChatWidget />
          <PWAInstallBanner />
          <CookieConsent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
