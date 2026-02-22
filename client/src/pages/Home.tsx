import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Calendar, MessageSquare, Shield, Search, LogOut, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { getLoginUrl } from "@/const";
import SuggestedFollows from "@/components/SuggestedFollows";
import { FeaturedArtistsCarousel } from "@/components/FeaturedArtistsCarousel";
import { TrustBadges } from "@/components/TrustBadges";
import { setMetaTags, pageMetaTags } from "@/utils/seoMeta";

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

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  // Use artist.search with empty filters to get all artists (same as Browse page)
  const { data: artists, isLoading } = trpc.artist.search.useQuery({});

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.home);
  }, []);

  // Get the correct dashboard URL based on user role
  const getDashboardUrl = () => {
    if (!user) return '/dashboard';
    if (user.role === 'venue') return '/venue-dashboard';
    if (user.role === 'admin') return '/admin';
    return '/dashboard'; // Default to artist dashboard
  };

  // Allow authenticated users to browse home page - they can click Dashboard button to go to dashboard

  const filteredArtists = artists?.filter(artist => 
    searchQuery === "" || 
    artist.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Mobile Optimized */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1 sm:gap-2 text-lg sm:text-2xl font-bold text-primary">
            <img src="/logo-lg.png" alt="Ologywood" className="h-8 sm:h-10 w-auto object-contain" />
            <span className="hidden sm:inline">Ologywood</span>
            <span className="sm:hidden">OW</span>
          </Link>
          
          <nav className="flex items-center gap-2 sm:gap-4">
            {isAuthenticated ? (
              <>
                <a href={getDashboardUrl()} className="no-underline">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                    Dashboard
                  </Button>
                </a>
                <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline max-w-[150px] truncate">
                  {user?.name || user?.email}
                </span>
                <LogoutButton />
              </>
            ) : (
              <>
                <a href="/browse" className="no-underline">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-4">
                    Browse
                  </Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button size="sm" className="text-xs sm:text-sm px-2 sm:px-4">Sign In</Button>
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section - Mobile Optimized */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-12 sm:py-20">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-6 text-foreground">
            Book Talented Artists for Your Events
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Connect with performing artists, manage bookings, and streamline your event planning all in one place.
          </p>
          
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <a href={getLoginUrl()}>
                <Button size="lg" className="text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto">Sign In</Button>
              </a>
              <a href="/browse" className="no-underline">
                <Button size="lg" variant="outline" className="text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto">
                  Browse Artists
                </Button>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Search Section - Mobile Optimized */}
      <section className="py-8 sm:py-12 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6">Find Your Perfect Artist</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 sm:h-5 w-4 sm:w-5" />
              <Input
                type="text"
                placeholder="Search by artist name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-2 sm:py-6 text-sm sm:text-base"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Artists Carousel */}
      <FeaturedArtistsCarousel artists={filteredArtists || []} isLoading={isLoading} />

      {/* Trust Badges Section */}
      <TrustBadges />

      {/* Suggested Follows Section */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          <SuggestedFollows />
        </div>
      </section>

      {/* CTA Section - Mobile Optimized */}
      <section className="bg-gradient-to-r from-primary/20 to-accent/20 py-8 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Ready to Book Your Next Event?</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Join thousands of venues and event organizers who trust Ologywood to find and book amazing artists.
          </p>
          {!isAuthenticated && (
            <a href={getLoginUrl()}>
              <Button size="lg" className="text-sm sm:text-base px-6 sm:px-8">Get Started Today</Button>
            </a>
          )}
        </div>
      </section>

      {/* Features Section - Mobile Optimized */}
      <section className="py-8 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 sm:mb-12 text-center">Why Choose Ologywood?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <Music className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Diverse Talent</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Browse thousands of talented artists across multiple genres and styles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Easy Booking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Simple and streamlined booking process with instant confirmations.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Direct Communication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Message artists directly to discuss details and negotiate terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Safe and secure payment processing with buyer and seller protection.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-muted/50 border-t mt-8 sm:mt-16 py-6 sm:py-8">
        <div className="container mx-auto px-3 sm:px-4 text-center text-xs sm:text-sm text-muted-foreground">
          <p>&copy; 2026 Ologywood. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}


