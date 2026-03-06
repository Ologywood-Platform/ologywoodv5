import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Building2, Heart, Check } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { SkeletonRoleSelection } from "@/components/SkeletonLoaders";
import { getDashboardUrl } from "@/utils/dashboardUrl";

// Role selection with optimistic cache update to prevent redirect loop - v3
export default function RoleSelection() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [pendingRole, setPendingRole] = useState<string | null>(null);
  const navigatingRef = useRef(false);

  const updateRole = (trpc.auth.updateRole as any).useMutation?.({
    onSuccess: async (data: any) => {
      navigatingRef.current = true;

      // CRITICAL: Optimistically update the auth.me cache with the new role
      // This prevents the race condition where the next page reads stale cache
      // and redirects back to /get-started
      (utils.auth.me as any).setData?.(undefined, (oldData: any) => {
        if (!oldData) return oldData;
        return { ...oldData, role: data.role };
      });

      // Also invalidate so a background refetch will confirm the DB state
      (utils.auth.me as any).invalidate();

      if (data.role === 'artist') {
        toast.success("Welcome! Let's set up your artist profile.");
        navigate("/onboarding/artist");
      } else if (data.role === 'venue') {
        toast.success("Welcome! Let's set up your venue profile.");
        navigate("/onboarding/venue");
      } else if (data.role === 'fan') {
        toast.success("You're all set! Start discovering artists.");
        navigate("/");
      }
    },
    onError: (error: any) => {
      setPendingRole(null);
      navigatingRef.current = false;
      toast.error(error.message || "Failed to update role. Please try again.");
    },
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/';
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    // If user already has a proper role, redirect to their dashboard
    // Skip if we're in the middle of updating role or navigating away
    if (!loading && user && !pendingRole && !navigatingRef.current) {
      const url = getDashboardUrl(user);
      if (url !== '/get-started') {
        navigate(url);
      }
    }
  }, [user, loading, navigate, pendingRole]);

  if (loading) {
    return <SkeletonRoleSelection />;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleSelectRole = (role: 'artist' | 'venue' | 'fan') => {
    if (pendingRole || navigatingRef.current) return; // Prevent double-clicks
    setPendingRole(role);
    updateRole.mutate({ role });
  };

  if (updateRole.isPending || pendingRole) {
    return <SkeletonRoleSelection />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Welcome to Ologywood!</h1>
          <p className="text-lg text-muted-foreground">
            How will you be using the platform?
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-3 sm:gap-4 md:gap-5 sm:p-4 md:p-6">
          {/* Artist Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary group"
                onClick={() => handleSelectRole('artist')}>
            <CardHeader className="pb-3">
              <div className="flex justify-center mb-3">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Music className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle className="text-center text-xl">I'm an Artist</CardTitle>
              <CardDescription className="text-center text-sm">
                Showcase your talent and get booked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-5">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Build your artist profile</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Manage availability & bookings</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Create rider contracts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Sell music & grow your fan base</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                size="lg"
                onClick={(e) => { e.stopPropagation(); handleSelectRole('artist'); }}
                disabled={updateRole.isPending || !!pendingRole}
              >
                {pendingRole === 'artist' ? "Setting up..." : "Continue as Artist"}
              </Button>
            </CardContent>
          </Card>

          {/* Venue Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-accent group"
                onClick={() => handleSelectRole('venue')}>
            <CardHeader className="pb-3">
              <div className="flex justify-center mb-3">
                <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <Building2 className="h-8 w-8 text-accent" />
                </div>
              </div>
              <CardTitle className="text-center text-xl">I'm a Venue</CardTitle>
              <CardDescription className="text-center text-sm">
                Find and book artists for your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-5">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Browse artists by genre & location</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Send booking requests</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Manage events & contracts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Communicate directly with artists</span>
                </li>
              </ul>
              <Button 
                className="w-full" 
                size="lg"
                variant="outline"
                onClick={(e) => { e.stopPropagation(); handleSelectRole('venue'); }}
                disabled={updateRole.isPending || !!pendingRole}
              >
                {pendingRole === 'venue' ? "Setting up..." : "Continue as Venue"}
              </Button>
            </CardContent>
          </Card>

          {/* Fan Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-pink-500 group"
                onClick={() => handleSelectRole('fan')}>
            <CardHeader className="pb-3">
              <div className="flex justify-center mb-3">
                <div className="h-16 w-16 rounded-full bg-pink-500/10 flex items-center justify-center group-hover:bg-pink-500/20 transition-colors">
                  <Heart className="h-8 w-8 text-pink-500" />
                </div>
              </div>
              <CardTitle className="text-center text-xl">I'm a Fan</CardTitle>
              <CardDescription className="text-center text-sm">
                Discover artists and follow the scene
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-5">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Follow your favorite artists</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Get updates on new shows</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Discover events near you</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-pink-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Buy music directly from artists</span>
                </li>
              </ul>
              <Button 
                size="lg"
                variant="outline"
                className="w-full border-pink-500 text-pink-500 hover:bg-pink-500/10"
                onClick={(e) => { e.stopPropagation(); handleSelectRole('fan'); }}
                disabled={updateRole.isPending || !!pendingRole}
              >
                {pendingRole === 'fan' ? "Setting up..." : "Continue as Fan"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          You can always update your account type later in your settings.
        </p>
      </div>
    </div>
  );
}
