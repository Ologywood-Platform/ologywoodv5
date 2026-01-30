import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Building2, Check } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { useEffect } from "react";

export default function RoleSelection() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  const updateRole = trpc.auth.updateRole.useMutation({
    onSuccess: (data) => {
      toast.success(`Account set up as ${data.role}`);
      // Navigate to appropriate onboarding
      if (data.role === 'artist') {
        navigate("/onboarding/artist");
      } else if (data.role === 'venue') {
        navigate("/onboarding/venue");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // If user already has a role, redirect
  if (user.role === 'artist' || user.role === 'venue') {
    navigate("/dashboard");
    return null;
  }

  const handleSelectRole = (role: 'artist' | 'venue') => {
    updateRole.mutate({ role });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-3xl md:text-4xl font-bold mb-2">Welcome to Ologywood!</h1>
          <p className="text-lg text-muted-foreground">
            Let's get you set up. Are you an artist or a venue?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3 sm:gap-4 md:gap-3 sm:p-4 md:p-6">
          {/* Artist Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <Music className="h-10 w-10 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">I'm an Artist</CardTitle>
              <CardDescription className="text-center">
                Create a profile to showcase your talent and receive booking requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Build your artist profile with photos, bio, and music links</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Manage your availability calendar</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Receive and manage booking requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Save rider templates for technical requirements</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                size="lg"
                onClick={() => handleSelectRole('artist')}
                disabled={updateRole.isPending}
              >
                {updateRole.isPending ? "Setting up..." : "Continue as Artist"}
              </Button>
            </CardContent>
          </Card>

          {/* Venue Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center">
                  <Building2 className="h-10 w-10 text-accent" />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">I'm a Venue</CardTitle>
              <CardDescription className="text-center">
                Find and book talented artists for your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Browse and search for artists by genre and location</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Send booking requests with event details</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Manage all your bookings in one place</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Direct communication with artists</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                size="lg"
                variant="outline"
                onClick={() => handleSelectRole('venue')}
                disabled={updateRole.isPending}
              >
                {updateRole.isPending ? "Setting up..." : "Continue as Venue"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          You can always update your account type later by contacting support
        </p>
      </div>
    </div>
  );
}
