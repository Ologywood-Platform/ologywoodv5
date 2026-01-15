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
      <Route path="/venue/:id" component={VenueProfile} />
      <Route path="/contract/:id" component={ContractDetail} />
      <Route path="/payments" component={Payments} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
