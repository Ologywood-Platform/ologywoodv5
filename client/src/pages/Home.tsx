import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Calendar, FileText, Shield, Heart, Send, Headphones, Scale, Ticket, AlertTriangle, MapPin, Globe, Zap, HelpCircle, Mail, ShoppingBag, Building2, Award, BarChart3, Users, Crown, Lock, Video, MessageCircle, DollarSign } from "lucide-react";
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
            OlogyWood connects artists, athletes, entertainers, and creators with the fans and opportunities that fuel lasting careers. Build your community, book events, Sell Tickets, share exclusive content, and turn followers into lifelong supporters.
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
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-4 sm:mb-6">Find Your Perfect Talent</h2>
            <ArtistSearchDropdown
              inputClassName="py-2 sm:py-6 text-sm sm:text-base"
              placeholder="Search by name, sport, genre, or location..."
              maxResults={5}
            />
          </div>
        </div>
      </section>

      {/* Featured Artists Carousel - Only show talent with type 'artist' (not athletes, creators, etc.) */}
      <FeaturedArtistsCarousel artists={(artists || []).filter((a: any) => !a.talentType || a.talentType === 'artist')} isLoading={isLoading} />

      {/* Featured Venues Carousel */}
      <FeaturedVenuesCarousel venues={featuredVenues || []} isLoading={venuesLoading} />

      {/* Suggested Follows Section */}
      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-3 sm:px-4">
          <SuggestedFollows />
        </div>
      </section>

      {/* NIL & College Sports Blueprint Section */}
      <section className="py-10 sm:py-16 bg-gradient-to-b from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12">
            <span className="inline-block bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 text-xs font-semibold px-3 py-1 rounded-full mb-4">NIL &amp; COLLEGE SPORTS</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">The Blueprint for Athlete Bookings &amp; NIL Deals</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Purpose-built for college athletes navigating NIL. Professional contracts, compliance-ready templates, and a platform that treats athletes like the brands they are.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <div className="text-center p-5 rounded-lg bg-white/80 dark:bg-card shadow-sm">
              <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">NIL Contracts</h3>
              <p className="text-xs text-muted-foreground">
                Auto-generated engagement contracts with compliance language, e-signatures, and PDF export.
              </p>
            </div>

            <div className="text-center p-5 rounded-lg bg-white/80 dark:bg-card shadow-sm">
              <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Athlete Profiles</h3>
              <p className="text-xs text-muted-foreground">
                Sport, position, stats, achievements, and highlight reels &mdash; all showcased on a professional profile.
              </p>
            </div>

            <div className="text-center p-5 rounded-lg bg-white/80 dark:bg-card shadow-sm">
              <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Booking Types</h3>
              <p className="text-xs text-muted-foreground">
                Appearances, signings, speaking, camps/clinics, and brand endorsements &mdash; each with its own rider template.
              </p>
            </div>

            <div className="text-center p-5 rounded-lg bg-white/80 dark:bg-card shadow-sm">
              <div className="bg-green-100 dark:bg-green-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Shield className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">NCAA Compliant</h3>
              <p className="text-xs text-muted-foreground">
                Built-in compliance language for NIL deals. School approval workflows and disclosure requirements included.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Touring & Availability Section */}
      <section className="py-10 sm:py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Built for Touring Artists &amp; Athlete Appearances</h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto px-2">
              Plan your tour or set your appearance availability. Get discovered by venues and brands &mdash; no more juggling multiple tools.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 rounded-lg bg-gradient-to-b from-primary/5 to-transparent">
              <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Set Your Availability</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Mark your available dates and cities. Venues and brands find you when you're open for bookings.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-gradient-to-b from-primary/5 to-transparent">
              <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">Get Discovered</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your availability badge shows bookers you're open. They book you directly &mdash; no middleman, no agents taking 20%.
              </p>
            </div>

            <div className="text-center p-6 rounded-lg bg-gradient-to-b from-primary/5 to-transparent">
              <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-base sm:text-lg mb-2">One Platform, Everything</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Bookings, contracts, riders, tickets, payments, and messaging &mdash; all handled here. Focus on your craft, not admin.
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
                  Upload and sell music directly to fans. Purchase releases, download instantly, and support your favorite talent.
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
                  Showcase merch directly on your profile. Athletes can offer pre-pay merchandise &mdash; fans order, you produce and ship. Keep 100% of sales.
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

      {/* Fan Club Feature Highlight */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">FAN CLUB</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Turn Followers Into Paying Members</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Launch your Fan Club with custom membership tiers. Share training clips, behind-the-scenes content, game day footage, Q&amp;A sessions, and more &mdash; all powered by Stripe.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <Crown className="h-6 w-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">Custom Tiers</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Create unlimited membership tiers with your own pricing and perks. Fans choose the level that fits them.</p>
              </div>
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <Lock className="h-6 w-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">Exclusive Content</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Post members-only content: training clips, game day footage, studio sessions, Q&amp;A &mdash; only your paying fans can see it.</p>
              </div>
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <Users className="h-6 w-6 text-purple-600 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">You Keep 85%</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Competitive 85/15 revenue split. You keep 85% of every subscription &mdash; better than most platforms.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ology Live Feature Highlight */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">OLOGY LIVE</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Virtual Sessions That Change the Game</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Ology Live lets talent host paid virtual experiences &mdash; gaming sessions, Q&amp;A/AMAs, music listening parties, fitness workouts, workshops, and more. Fans book, join live, and interact directly with the people they admire.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <Video className="h-6 w-6 text-emerald-600 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">10 Session Categories</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Gaming, Music, Fitness, Q&amp;A, Workshops, Photography, Film, Creative, Brand Building &mdash; host on Twitch, Discord, Zoom, FaceTime, or YouTube Live.</p>
              </div>
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <MessageCircle className="h-6 w-6 text-emerald-600 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">Live Fan Q&amp;A</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Fans submit questions before and during sessions. Talent answers live &mdash; creating unforgettable, personal connections at scale.</p>
              </div>
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <DollarSign className="h-6 w-6 text-emerald-600 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">Earn on Your Terms</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Set your own price per session. One-on-one, small group, or broadcast &mdash; you control capacity, scheduling, and earnings.</p>
              </div>
            </div>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="/ology-live/dashboard" className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg text-sm sm:text-base transition-colors shadow-md">
                <Video className="h-4 w-4" />
                Start Hosting
              </a>
              <a href="/ology-live" className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 hover:underline">
                Browse Sessions →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Feature Spotlight */}
      <section className="py-8 sm:py-12 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">ENTERPRISE</span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Sponsor Showcase &amp; Media Kit</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
              Monetize your brand partnerships. Display sponsor logos on your profile, event pages, and ticket confirmation emails. Track real engagement with Sponsor Analytics and pitch new partners with your auto-generated Media Kit.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-left">
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <Award className="h-6 w-6 text-indigo-600 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">5 Sponsor Slots</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Showcase up to 5 sponsors with logos, links, and descriptions on your profile and events.</p>
              </div>
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <BarChart3 className="h-6 w-6 text-indigo-600 mb-2" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">Sponsor Analytics</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Track impressions, clicks, and CTR per sponsor. Show brands real ROI from your audience.</p>
              </div>
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <FileText className="h-6 w-6 text-indigo-600 mb-2" />
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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4">Ready to Build Your Brand?</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Join artists, athletes, entertainers, and creators who use OlogyWood to manage bookings, sign NIL deals, grow their fan base, and create lasting opportunities.
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
              Our AI-powered support is available 24/7, plus our team is here Monday through Friday for complex questions.
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
