import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Navigate } from "wouter";
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
import { VenueProfileDetail } from "./pages/VenueProfileDetail";
import Messages from "./pages/Messages";
import MessagesDetail from "./pages/MessagesDetail";
import Riders from "./pages/Riders";
import { AIChatWidget } from "./components/AIChatWidget";
import Footer from "./components/Footer";

// Legal pages (required for compliance)
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Cookies from "./pages/Cookies";
import Accessibility from "./pages/Accessibility";

function Router() {
  return (
    <div className="flex flex-col min-h-screen">
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
          
          {/* Rider System */}
          <Route path="/rider-builder" component={RiderBuilder} />
          <Route path="/saved-riders" component={SavedRiders} />
          <Route path="/riders" component={Riders} />
          
          {/* Communication */}
          <Route path="/messages" component={Messages} />
          <Route path="/messages/:id" component={MessagesDetail} />
          
          {/* Availability Management */}
          <Route path="/availability" component={Availability} />
          
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
