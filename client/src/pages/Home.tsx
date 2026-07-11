import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Calendar, FileText, Shield, Heart, Send, Headphones, Scale, Ticket, AlertTriangle, MapPin, Globe, Zap, HelpCircle, Mail, ShoppingBag, Building2, Award, BarChart3 } from "lucide-react";
import { ArtistSearchDropdown } from "@/components/ArtistSearchDropdown";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { QuickSignupModal } from "@/components/QuickSignupModal";
import SuggestedFollows from "@/components/SuggestedFollows";
import { FeaturedArtistsCarousel } from "@/components/FeaturedArtistsCarousel";
import { FeaturedVenuesCarousel } from "@/components/FeaturedVenuesCarousel";
import { TrustBadges } from "@/components/TrustBadges";
import { setMetaTags, pageMetaTags } from "@/utils/seoMeta";
import { JsonLd, buildHomepageJsonLd, buildBreadcrumbJsonLd } from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signup' | 'login'>('signup');
  // Use artist.search with empty filters to get all artists (same as Browse page)
  const { data: artists, isLoading } = trpc.artist.search.useQuery({});
  // Fetch featured venues
  const { data: featuredVenues, isLoading: venuesLoading } = trpc.venue.getFeatured.useQuery();

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.home);
  }, []);

  // Handle OAuth errors - show user-friendly message with retry
  const [oauthError, setOauthError] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('oauth_error');
    if (error) {
      setOauthError(error);
      // Remove the error parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  const openSignUp = () => {
    setAuthModalTab('signup');
    setAuthModalOpen(true);
  };

  const openSignIn = () => {
    setAuthModalTab('login');
    setAuthModalOpen(true);
  };

  // Redirect authenticated users without a proper role to role selection
  // Fans (role='fan') stay on the homepage — it's their home base
  useEffect(() => {
    if (isAuthenticated && user && (!user.role || user.role === 'user')) {
      window.location.href = '/get-started';
    }
  }, [isAuthenticated, user]);

  // Allow authenticated users to browse home page - they can click Dashboard button to go to dashboard

  return (
    <div className="min-h-screen flex flex-col">
      <JsonLd data={[buildHomepageJsonLd(), buildBreadcrumbJsonLd([{ name: 'Home', url: '/' }])]} id="homepage" />
      
      {/* Shared Header with Following link */}
      <SiteHeader largeLogo />

      {/* OAuth Error Banner */}
      {oauthError && (
        <div className="bg-red-50 dark:bg-red-950/30 border-b border-red-200 dark:border-red-800 px-4 py-3">
          <div className="container mx-auto flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
              <AlertTriangle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm font-medium">
                {oauthError === 'INVALID_CODE'
                  ? 'Sign in expired. Please try again.'
                  : oauthError === 'INVALID_STATE'
                  ? 'Security check failed. Please try signing in again.'
                  : 'Sign in failed. Please try again or use email login.'}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
                onClick={() => {
                  setOauthError(null);
                  openSignIn();
                }}
              >
                Try Again
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 dark:text-red-400"
                onClick={() => setOauthError(null)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Original Messaging */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-12 sm:py-20">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-6 text-foreground">
            Build Your Brand. Grow Your Fans. Create More Opportunities.
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            OlogyWood connects artists, athletes, entertainers, and creators with the fans and opportunities that fuel lasting careers. Build your community, book events, share exclusive content, and turn followers into lifelong supporters.
          </p>
          
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button size="lg" className="text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto" onClick={openSignUp}>
                  Join as Talent
                </Button>
              <a href="/browse" className="no-underline">
                <Button size="lg" variant="outline" className="text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto">
                  Join as a Fan
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
            <ArtistSearchDropdown
              inputClassName="py-2 sm:py-6 text-sm sm:text-base"
              placeholder="Search by artist name, genre, or location..."
              maxResults={5}
            />
          </div>
        </div>
      </section>

      {/* Featured Artists Carousel - Show all artists, not filtered by search */}
      <FeaturedArtistsCarousel artists={artists || []} isLoading={isLoading} />

      {/* Featured Venues Carousel */}
      <FeaturedVenuesCarousel venues={featuredVenues || []} isLoading={venuesLoading} />

      {/* Suggested Follows Section */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          <SuggestedFollows />
        </div>
      </section>

      {/* Touring Feature Highlight Section */}
      <section className="py-10 sm:py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Built for Touring Artists</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Plan your tour, get discovered by venues, and manage everything in one place &mdash; no more juggling multiple tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 rounded-lg bg-gradient-to-b from-primary/5 to-transparent">
              <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Plan Your Tour</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Set your touring availability, mark cities you're visiting, and let venues find you. No more cold emails.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-gradient-to-b from-primary/5 to-transparent">
              <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Get Discovered</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your "On Tour" badge shows venues you're available. They book you directly &mdash; no middleman, no agents taking 20%.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-gradient-to-b from-primary/5 to-transparent">
              <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">One Platform, Everything</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Bookings, contracts, riders, tickets, payments, and messaging &mdash; all handled here. Focus on performing, not admin.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <TrustBadges />

      {/* Features Section - Mobile Optimized */}
      <section className="py-8 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 sm:mb-12 text-center">Why Choose Ologywood™?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <Music className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Browse & Book Artists</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Search artists by genre, location, and availability. Send booking requests and manage everything in one place.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MapPin className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Touring & Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Set your tour dates and cities. Venues see your "On Tour" badge and book you directly &mdash; no agents needed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Riders & Contracts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Build professional riders with technical requirements. Generate contracts and sign them digitally with e-signatures.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Ticket className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Event Ticketing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Sell tickets directly to fans with transparent pricing. QR code check-in, promo codes, and ticket transfers built in.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Events & Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Discover upcoming events, manage your availability calendar, and keep your schedule organized.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Follow & Stay Connected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Follow your favorite artists to stay updated. Artists can send email updates directly to their fan base.
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
                  Safe payment processing powered by Stripe. Track earnings, manage invoices, and handle payouts securely.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Send className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Direct Messaging</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Message artists and venues directly to discuss event details, negotiate terms, and finalize bookings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Headphones className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Music Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Artists can upload and sell music directly to fans. Purchase releases, download instantly, and support your favorite artists.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Scale className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Payment Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  All payments and disputes are handled securely by Stripe. Chargebacks, refunds, and payment disputes follow card network rules &mdash; transparent and fair for everyone.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ShoppingBag className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Merch & Shop</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Artists showcase merch and venues list shop items &amp; offers directly on their profiles. Link to your own store and keep 100% of sales &mdash; zero commission.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Building2 className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Venue Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Venues get a full dashboard with availability calendars, booking management, analytics, and a public profile to attract artists. Browse and filter venues by type, capacity, and location.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Sponsor Showcase</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Enterprise artists display sponsor logos on their profile, event pages, and ticket emails. Track impressions and clicks with built-in analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* New Feature Spotlight */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">NEW</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Enterprise Tier &mdash; Sponsor Showcase &amp; Media Kit</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Monetize your brand partnerships. Display sponsor logos on your profile, event pages, and ticket confirmation emails. Track real engagement with Sponsor Analytics and pitch new partners with your auto-generated Media Kit.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <Award className="h-6 w-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">5 Sponsor Slots</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Showcase up to 5 sponsors with logos, links, and descriptions on your profile and events.</p>
              </div>
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <BarChart3 className="h-6 w-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">Sponsor Analytics</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Track impressions, clicks, and CTR per sponsor. Show brands real ROI from your audience.</p>
              </div>
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <FileText className="h-6 w-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">Media Kit</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Auto-generated press kit with your stats, bio, and achievements. Share with sponsors and labels.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary/20 to-accent/20 py-8 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Ready to Book Your Next Event?</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Join artists, athletes, entertainers, and creators who use OlogyWood to build their brand, grow their fan base, and create more opportunities.
          </p>
          {!isAuthenticated && (
            <Button size="lg" className="text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto" onClick={openSignUp}>
              Get Started
            </Button>
          )}
        </div>
      </section>

      {/* Help & Support Section */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Need Help?</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
              Our support team is here Monday through Friday to help you get the most out of Ologywood.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="flex items-start gap-4 p-4 sm:p-6 rounded-lg border bg-card text-left">
                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1">Email Support</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    Get help with bookings, payments, account issues, or anything else.
                  </p>
                  <a href="mailto:support@ologywood.com" className="text-xs sm:text-sm text-primary font-medium hover:underline">
                    support@ologywood.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 sm:p-6 rounded-lg border bg-card text-left">
                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm sm:text-base mb-1">Getting Started</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                    New to Ologywood? Create your profile, set up your rider, and start booking in minutes.
                  </p>
                  <a href={isAuthenticated ? "/get-started" : "/"} className="text-xs sm:text-sm text-primary font-medium hover:underline">
                    Set up your account →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Mobile Optimized */}
      <footer className="bg-muted/50 border-t mt-8 sm:mt-16 py-6 sm:py-8">
        <div className="container mx-auto px-3 sm:px-4 text-center text-xs sm:text-sm text-muted-foreground">
          <p>&copy; 2026 Ologywood™. All rights reserved.</p>
        </div>
      </footer>
      {/* Auth Modal */}
      <QuickSignupModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
        actionType="general"
      />
    </div>
  );
}
