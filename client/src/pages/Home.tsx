import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Calendar, FileText, Shield, Heart, Send, Headphones, Scale, Ticket, AlertTriangle, MapPin, Globe, Zap, HelpCircle, Mail } from "lucide-react";
import { ArtistSearchDropdown } from "@/components/ArtistSearchDropdown";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { QuickSignupModal } from "@/components/QuickSignupModal";
import SuggestedFollows from "@/components/SuggestedFollows";
import { FeaturedArtistsCarousel } from "@/components/FeaturedArtistsCarousel";
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

      {/* Hero Section - Touring Marketplace Positioning */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-12 sm:py-20">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-6 text-foreground">
            Your All-in-One Touring Marketplace
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Book artists, plan tours, sell tickets, and manage contracts &mdash; all in one place. Stop juggling 4 different tools. Start touring smarter.
          </p>
          
          {!isAuthenticated && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button size="lg" className="text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto" onClick={openSignUp}>
                  Get Started Free
                </Button>
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
            <ArtistSearchDropdown
              inputClassName="py-2 sm:py-6 text-sm sm:text-base"
              placeholder="Search by artist name, genre, or location..."
              maxResults={5}
            />
          </div>
        </div>
      </section>

      {/* Touring Feature Highlight Section */}
      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Built for Touring Artists</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Ologywood replaces the patchwork of tools indie artists use to plan tours. One platform for everything.
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

      {/* Featured Artists Carousel - Show all artists, not filtered by search */}
      <FeaturedArtistsCarousel artists={artists || []} isLoading={isLoading} />

      {/* Trust Badges Section */}
      <TrustBadges />

      {/* Suggested Follows Section */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          <SuggestedFollows />
        </div>
      </section>

      {/* CTA Section - Touring Marketplace Pitch */}
      <section className="bg-gradient-to-r from-primary/20 to-accent/20 py-8 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Stop Juggling Tools. Start Touring.</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Indie artists use 3-4 different apps to plan tours. Ologywood brings booking, contracts, ticketing, and payments into one place &mdash; so you can focus on what matters: your music.
          </p>
          {!isAuthenticated && (
            <Button size="lg" className="text-sm sm:text-base px-6 sm:px-8 w-full sm:w-auto" onClick={openSignUp}>
              Join Free
            </Button>
          )}
        </div>
      </section>

      {/* Features Section - Mobile Optimized */}
      <section className="py-8 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-3 sm:px-4">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 sm:mb-12 text-center">Everything You Need in One Place</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card>
              <CardHeader>
                <Music className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Browse & Book Artists</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Search artists by genre, location, and touring availability. Send booking requests and manage everything in one place.
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
                  Set your tour dates and cities. Venues see your "On Tour" badge and book you directly &mdash; no agents or middlemen needed.
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
                <Shield className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Safe payment processing powered by Stripe. Track earnings, manage invoices, and handle payouts &mdash; all transparent.
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
                  Upload and sell music directly to fans. No streaming middlemen &mdash; keep more of what you earn.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Fan Following</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Build your fanbase. Fans follow you, get notified about shows, and you can send updates directly to them.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Scale className="h-6 sm:h-8 w-6 sm:w-8 text-primary mb-2" />
                <CardTitle className="text-base sm:text-lg">Dispute Resolution</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Fair and transparent dispute handling. File claims, provide evidence, and get resolutions managed by our team.
                </p>
              </CardContent>
            </Card>
          </div>
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
                  <a href="/get-started" className="text-xs sm:text-sm text-primary font-medium hover:underline">
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
          <p>&copy; 2026 Ologywood. All rights reserved.</p>
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
