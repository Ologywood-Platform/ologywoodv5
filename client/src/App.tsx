import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import ArtistProfile from "./pages/ArtistProfile";
import Dashboard from "./pages/Dashboard";
import RoleSelection from "./pages/RoleSelection";
import ArtistOnboarding from "./pages/ArtistOnboarding";
import VenueOnboarding from "./pages/VenueOnboarding";
import Availability from "./pages/Availability";
import RiderTemplates from "./pages/RiderTemplates";
import Subscription from "./pages/Subscription";
import BookingDetail from "./pages/BookingDetail";
import VenueProfile from "./pages/VenueProfile";
import ContractDetail from "./pages/ContractDetail";
import Payments from "./pages/Payments";
import BookingsList from "./pages/BookingsList";
import MessagesDetail from "./pages/MessagesDetail";
import Reviews from "./pages/Reviews";
import Calendar from "./pages/Calendar";
import Messages from "./pages/Messages";
import Riders from "./pages/Riders";
import SupportTickets from "./pages/SupportTickets";
import SupportTicketCreate from "./pages/SupportTicketCreate";
import SupportTicketDetail from "./pages/SupportTicketDetail";
import HelpCenter from "./pages/HelpCenter";
import AdminSupportDashboard from "./pages/AdminSupportDashboard";
import { AIChatWidget } from "./components/AIChatWidget";
import SupportMetricsDashboard from "./pages/SupportMetricsDashboard";
import SupportTeamManagement from "./pages/SupportTeamManagement";
import SLATrackingDashboard from "./pages/SLATrackingDashboard";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browse" component={Browse} />
      <Route path="/artist/:id" component={ArtistProfile} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/get-started" component={RoleSelection} />
      <Route path="/onboarding/artist" component={ArtistOnboarding} />
      <Route path="/onboarding/venue" component={VenueOnboarding} />
      <Route path="/availability" component={Availability} />
      <Route path="/rider-templates" component={RiderTemplates} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/booking/:id" component={BookingDetail} />
      <Route path="/bookings/:id" component={BookingDetail} />
      <Route path="/bookings" component={BookingsList} />
      <Route path="/messages/:id" component={MessagesDetail} />
      <Route path="/messages" component={Messages} />
      <Route path="/calendar" component={Calendar} />
      <Route path="/riders" component={Riders} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/venue/:id" component={VenueProfile} />
      <Route path="/contract/:id" component={ContractDetail} />
      <Route path="/payments" component={Payments} />
      <Route path="/support" component={SupportTickets} />
      <Route path="/support/create" component={SupportTicketCreate} />
      <Route path="/support/:id" component={SupportTicketDetail} />
      <Route path="/help" component={HelpCenter} />
      <Route path="/admin/support" component={AdminSupportDashboard} />
      <Route path="/admin/support/metrics" component={SupportMetricsDashboard} />
      <Route path="/admin/support-team" component={SupportTeamManagement} />
      <Route path="/admin/sla-tracking" component={SLATrackingDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <AIChatWidget />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
