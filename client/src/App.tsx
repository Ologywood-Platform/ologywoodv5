import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary, { PageErrorBoundary } from "./components/ErrorBoundary";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { ThemeProvider } from "./contexts/ThemeContext";

// MVP CORE ROUTES ONLY
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ArtistProfile from "./pages/ArtistProfile";
import { ArtistDashboardV3 } from '@/pages/ArtistDashboardV3';
import { VenueDashboard } from '@/pages/VenueDashboard';
import RoleSelection from "./pages/RoleSelection";
import ArtistOnboarding from "./pages/ArtistOnboarding";
import VenueOnboarding from "./pages/VenueOnboarding";
import Availability from "./pages/Availability";
import RiderBuilder from "./pages/RiderBuilder";
import SavedRiders from "./pages/SavedRiders";
import Favorites from "./pages/Favorites";
import BookingDetail from "./pages/BookingDetail";
import BookingCreate from "./pages/BookingCreate";
import BookingsList from "./pages/BookingsList";
import BookingConfirmation from "./pages/BookingConfirmation";
import VenueProfile from "./pages/VenueProfile";
import VenueBrowse from "./pages/VenueBrowse";
import VenueProfileDetail from "./pages/VenueProfileDetail";
import Messages from "./pages/Messages";
import MessagesDetail from "./pages/MessagesDetail";
import Riders from "./pages/Riders";
import { RiderTemplates } from "./pages/RiderTemplates";
import EventCreate from "./pages/EventCreate";
import EventDiscovery from "./pages/EventDiscovery";
import EventDetail from "./pages/EventDetail";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Pricing from "./pages/Pricing";
import { Unsubscribe } from "./pages/Unsubscribe";
import VerifyEmail from "./pages/VerifyEmail";
import RevertEmail from "./pages/RevertEmail";
import ArtistEarnings from "./pages/ArtistEarnings";
import ArtistEarningsDashboard from "./pages/ArtistEarningsDashboard";
import VenueInvoiceDashboard from "./pages/VenueInvoiceDashboard";
import Help from "./pages/Help";
import Following from "./pages/Following";
import AdminPayouts from "./pages/AdminPayouts";
import ArtistTaxReporting from "./pages/ArtistTaxReporting";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AIChatWidget } from "./components/AIChatWidget";
import Footer from "./components/Footer";
import { ScrollToTop } from "./components/ScrollToTop";

// Legal pages (required for compliance)
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Cookies from "./pages/Cookies";
import Accessibility from "./pages/Accessibility";

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <ScrollToTop />
      <div className="flex-1">
        <Switch>
          {/* ============================================
              MVP CORE ROUTES ONLY - PRODUCTION PATHS
              ============================================ */}
          
          {/* Authentication & Accounts */}
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/get-started" component={RoleSelection} />
          <Route path="/onboarding/artist" component={ArtistOnboarding} />
          <Route path="/onboarding/venue" component={VenueOnboarding} />
          <Route path="/dashboard">{() => <PageErrorBoundary><ArtistDashboardV3 /></PageErrorBoundary>}</Route>
          <Route path="/venue-dashboard">{() => <PageErrorBoundary><VenueDashboard /></PageErrorBoundary>}</Route>
          <Route path="/verify-email" component={VerifyEmail} />
          <Route path="/revert-email" component={RevertEmail} />
          <Route path="/earnings" component={ArtistEarnings} />
          <Route path="/earnings-dashboard" component={ArtistEarningsDashboard} />
          <Route path="/venue-invoices" component={VenueInvoiceDashboard} />
          <Route path="/help" component={Help} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/payouts" component={AdminPayouts} />
          <Route path="/artist-tax-reporting" component={ArtistTaxReporting} />
          
          {/* Discovery */}
          <Route path="/browse">{() => <PageErrorBoundary><Browse /></PageErrorBoundary>}</Route>
          <Route path="/artist/:id">{(params: any) => <PageErrorBoundary><ArtistProfile {...params} /></PageErrorBoundary>}</Route>
          <Route path="/venues" component={VenueBrowse} />
          <Route path="/venue/:id" component={VenueProfile} />
          <Route path="/venues/:id" component={VenueProfileDetail} />
          
          {/* Core Booking Flow */}
          <Route path="/booking/create">{() => <PageErrorBoundary><BookingCreate /></PageErrorBoundary>}</Route>
          <Route path="/booking/:id">{(params: any) => <PageErrorBoundary><BookingDetail {...params} /></PageErrorBoundary>}</Route>
          <Route path="/booking-confirmation/:id" component={BookingConfirmation} />
          <Route path="/bookings" component={BookingsList} />
          
          {/* Event Management */}
          <Route path="/events" component={EventDiscovery} />
          <Route path="/events/create" component={EventCreate} />
          <Route path="/events/:id" component={EventDetail} />
          
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
          
          {/* ============================================
              HARD 404 - ALL OTHER ROUTES SILENCED
              ============================================ */}
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
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
          <Router />
          <AIChatWidget />
          <PWAInstallBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
