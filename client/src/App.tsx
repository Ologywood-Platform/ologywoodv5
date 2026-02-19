import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
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
import BookingDetail from "./pages/BookingDetail";
import BookingCreate from "./pages/BookingCreate";
import BookingsList from "./pages/BookingsList";
import VenueProfile from "./pages/VenueProfile";
import VenueBrowse from "./pages/VenueBrowse";
import VenueProfileDetail from "./pages/VenueProfileDetail";
import Messages from "./pages/Messages";
import MessagesDetail from "./pages/MessagesDetail";
import Riders from "./pages/Riders";
import EventCreate from "./pages/EventCreate";
import EventDiscovery from "./pages/EventDiscovery";
import EventDetail from "./pages/EventDetail";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import { Unsubscribe } from "./pages/Unsubscribe";
import VerifyEmail from "./pages/VerifyEmail";
import RevertEmail from "./pages/RevertEmail";
import ArtistEarnings from "./pages/ArtistEarnings";
import ArtistEarningsDashboard from "./pages/ArtistEarningsDashboard";
import VenueInvoiceDashboard from "./pages/VenueInvoiceDashboard";
import Help from "./pages/Help";
import AdminPayouts from "./pages/AdminPayouts";
import ArtistTaxReporting from "./pages/ArtistTaxReporting";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AIChatWidget } from "./components/AIChatWidget";
import Footer from "./components/Footer";

// Legal pages (required for compliance)
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Cookies from "./pages/Cookies";
import Accessibility from "./pages/Accessibility";

function Router() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
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
          <Route path="/dashboard" component={ArtistDashboardV3} />
          <Route path="/venue-dashboard" component={VenueDashboard} />
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
          <Route path="/browse" component={Browse} />
          <Route path="/artist/:id" component={ArtistProfile} />
          <Route path="/venues" component={VenueBrowse} />
          <Route path="/venue/:id" component={VenueProfile} />
          <Route path="/venues/:id" component={VenueProfileDetail} />
          
          {/* Core Booking Flow */}
          <Route path="/bookings/create" component={BookingCreate} />
          <Route path="/bookings" component={BookingsList} />
          <Route path="/booking/:id" component={BookingDetail} />
          <Route path="/bookings/:id" component={BookingDetail} />
          
          {/* Event Management */}
          <Route path="/events" component={EventDiscovery} />
          <Route path="/events/create" component={EventCreate} />
          <Route path="/events/:id" component={EventDetail} />
          
          {/* Rider System */}
          <Route path="/rider-builder" component={RiderBuilder} />
          <Route path="/saved-riders" component={SavedRiders} />
          <Route path="/riders" component={Riders} />
          
          {/* Communication */}
          <Route path="/messages" component={Messages} />
          <Route path="/messages/:id" component={MessagesDetail} />
          
          {/* Availability Management */}
          <Route path="/availability" component={Availability} />
          
          {/* How It Works */}
          <Route path="/how-it-works" component={HowItWorks} />
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
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
          <AIChatWidget />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
