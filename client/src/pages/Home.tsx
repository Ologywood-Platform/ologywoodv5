import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Calendar,
  FileText,
  Shield,
  Heart,
  Send,
  Headphones,
  Ticket,
  AlertTriangle,
  MapPin,
  Globe,
  HelpCircle,
  Mail,
  ShoppingBag,
  Building2,
  Award,
  Users,
  Lock,
  Video,
  Search,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { ArtistSearchDropdown } from "@/components/ArtistSearchDropdown";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { QuickSignupModal } from "@/components/QuickSignupModal";
import SuggestedFollows from "@/components/SuggestedFollows";
import { FeaturedArtistsCarousel } from "@/components/FeaturedArtistsCarousel";
import { FeaturedVenuesCarousel } from "@/components/FeaturedVenuesCarousel";
import { setMetaTags, pageMetaTags } from "@/utils/seoMeta";
import {
  JsonLd,
  buildHomepageJsonLd,
  buildBreadcrumbJsonLd,
} from "@/components/JsonLd";
import SiteHeader from "@/components/SiteHeader";
import { TALENT_TYPE_OPTIONS } from "@shared/talentTypes";
import "./Home.css";

const heroImage = "/manus-storage/ologywood-cinematic-hero_4ee30676.webp";
const categories = [
  {
    type: "artist",
    title: "Music Artists",
    description: "Bands · Singers · Producers",
    image: "/manus-storage/ologywood-category-musician_5487c223.webp",
  },
  {
    type: "athlete",
    title: "Athletes",
    description: "Appearances · Sports · NIL",
    image: "/manus-storage/ologywood-category-athlete_95ffa575.webp",
  },
  {
    type: "filmmaker",
    title: "Filmmakers",
    description: "Directors · Producers · Storytellers",
    image: "/manus-storage/ologywood-category-filmmaker_2f0c6c93.webp",
  },
];
const creatorTools = [
  {
    icon: Calendar,
    title: "Get Booked",
    copy: "Connect with venues and bookers. Set your availability and build your next opportunity.",
    href: "/browse",
  },
  {
    icon: Users,
    title: "Build Your Fan Club",
    copy: "Turn your audience into a community with memberships and exclusive experiences.",
    href: "/how-it-works",
  },
  {
    icon: Ticket,
    title: "Sell Tickets",
    copy: "Event Ticketing brings people together. Discover events and sell tickets directly to your fans.",
    href: "/events",
  },
  {
    icon: Headphones,
    title: "Release Your Work",
    copy: "Sell music downloads or paid access to content hosted wherever you choose.",
    href: "/shop",
  },
  {
    icon: ShoppingBag,
    title: "Sell Your Merch",
    copy: "Offer merch, books and digital products. Connect your shop or fulfill orders yourself.",
    href: "/shop",
  },
  {
    icon: Video,
    title: "Go Live",
    copy: "Host paid virtual sessions, workshops and live conversations with your fans.",
    href: "/ology-live",
  },
];
const moreTools = [
  {
    icon: FileText,
    title: "Riders & Contracts",
    copy: "Technical requirements, professional booking contracts and e-signatures.",
  },
  {
    icon: MapPin,
    title: "Events & Availability",
    copy: "Manage your calendar, touring dates and appearance availability.",
  },
  {
    icon: Heart,
    title: "Follow & Stay Connected",
    copy: "Follow talent and send updates directly to your fan base.",
  },
  {
    icon: Send,
    title: "Direct Messaging",
    copy: "Discuss details and coordinate bookings in one place.",
  },
  {
    icon: Building2,
    title: "Venue Management",
    copy: "Venue profiles, availability calendars and booking management.",
  },
  {
    icon: Award,
    title: "Sponsor Showcase & Media Kit",
    copy: "Enterprise tools: 5 sponsor slots, Sponsor Analytics and an auto-generated Media Kit.",
  },
];

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"signup" | "login">(
    "signup"
  );
  const [talentType, setTalentType] = useState("all");
  // Preserve the same public discovery sources and eligibility rules.
  const {
    data: artists,
    isLoading,
    isError: artistsError,
    refetch: retryArtists,
  } = trpc.artist.search.useQuery({});
  const {
    data: featuredVenues,
    isLoading: venuesLoading,
    isError: venuesError,
    refetch: retryVenues,
  } = trpc.venue.getFeatured.useQuery();

  useEffect(() => {
    setMetaTags(pageMetaTags.home);
  }, []);
  const [oauthError, setOauthError] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get('oauth_error');
    if (error) {
      setOauthError(error);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    const redirect = params.get('redirect');
    if (redirect && !isAuthenticated) {
      setAuthModalTab('login');
      setAuthModalOpen(true);
    }
  }, [isAuthenticated]);
  const openSignUp = () => {
    setAuthModalTab("signup");
    setAuthModalOpen(true);
  };
  const openSignIn = () => {
    setAuthModalTab('login');
    setAuthModalOpen(true);
  };
  useEffect(() => {
    if (isAuthenticated && user && (!user.role || user.role === "user"))
      window.location.href = "/get-started";
  }, [isAuthenticated, user]);

  const visibleArtists = (artists || []).filter(
    artist =>
      talentType === "all" ||
      ((artist as { talentType?: string }).talentType || "artist") ===
        talentType
  );
  const selectedLabel =
    TALENT_TYPE_OPTIONS.find(option => option.value === talentType)
      ?.pluralLabel || "Talent";
  const showCategory = (type: string) => {
    setTalentType(type);
    document
      .getElementById("home-talent")
      ?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
  };

  return (
    <div className="home-redesign dark min-h-screen flex flex-col">
      <JsonLd
        data={[
          buildHomepageJsonLd(),
          buildBreadcrumbJsonLd([{ name: "Home", url: "/" }]),
        ]}
        id="homepage"
      />
      <SiteHeader largeLogo />
      {oauthError && (
        <div className="home-auth-error" role="alert">
          <div className="home-container flex flex-wrap items-center gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm flex-1">
              {oauthError === "INVALID_CODE"
                ? "Sign in expired. Please try again."
                : oauthError === "INVALID_STATE"
                  ? "Security check failed. Please try signing in again."
                  : "Sign in failed. Please try again or use email login."}
            </p>
            <Button
              size="sm"
              variant="outline"
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
              onClick={() => setOauthError(null)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}
      <main id="home-main">
        <section className="home-hero" aria-labelledby="home-headline">
          <img
            src={heroImage}
            alt=""
            aria-hidden="true"
            className="home-hero-image"
            width="2200"
            height="943"
            fetchPriority="high"
          />
          <div className="home-hero-shade" />
          <div className="home-container home-hero-content">
            <p className="home-eyebrow">
              <span /> INDEPENDENT TALENT. REAL POSSIBILITIES.
            </p>
            <h1
              id="home-headline"
              aria-label="Your Talent. Your Platform. Your Next Opportunity."
            >
              Your Talent.
              <br />
              Your Platform.
              <br />
              <span>Your Next Opportunity.</span>
            </h1>
            <p className="home-hero-description">
              Get discovered, book opportunities, grow your audience,
              <br className="hidden sm:block" /> and earn from what you create.
            </p>
            <div className="home-hero-actions">
              <Link href="/browse" className="home-button home-button-primary">
                Explore Talent <ArrowRight className="h-4 w-4" />
              </Link>
              {isAuthenticated ? (
                <Link
                  href="/workspace"
                  className="home-button home-button-outline"
                >
                  Open Workspace
                </Link>
              ) : (
                <button
                  className="home-button home-button-outline"
                  onClick={openSignUp}
                >
                  Join as Talent
                </button>
              )}
            </div>
            <p className="home-hero-note">
              Free profile <span>·</span> Direct connections <span>·</span>{" "}
              Built for independent talent
            </p>
          </div>
        </section>

        <section
          className="home-container home-search"
          aria-label="Find talent"
        >
          <div className="home-search-panel">
            <div className="home-search-field">
              <label className="home-field-label">
                Find your next connection
              </label>
              <ArtistSearchDropdown
                inputClassName="home-search-input"
                placeholder="Search by name, genre, or location..."
                maxResults={5}
              />
            </div>
            <div className="home-type-field">
              <label htmlFor="home-talent-type" className="home-field-label">
                Talent type
              </label>
              <div className="home-select-wrap">
                <Users className="h-4 w-4" aria-hidden="true" />
                <select
                  id="home-talent-type"
                  value={talentType}
                  onChange={event => setTalentType(event.target.value)}
                >
                  <option value="all">All talent</option>
                  {TALENT_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.pluralLabel}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="h-4 w-4 pointer-events-none"
                  aria-hidden="true"
                />
              </div>
            </div>
            <button
              className="home-button home-button-primary home-search-button"
              onClick={() => showCategory(talentType)}
            >
              <Search className="h-4 w-4" /> Explore
            </button>
          </div>
          <p className="home-search-help">
            Choose a suggestion to open a profile. Talent type filters the
            featured profiles below.{" "}
            <Link href="/browse">
              More location & availability filters{" "}
              <ArrowRight className="h-3 w-3 inline" />
            </Link>
          </p>
        </section>

        <section
          className="home-container home-categories"
          aria-labelledby="home-categories-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">DISCOVER</p>
              <h2 id="home-categories-title">
                A world of talent. A place for you.
              </h2>
            </div>
            <Link href="/browse" className="home-text-link">
              Explore all talent <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="home-category-grid">
            {categories.map(category => (
              <button
                key={category.type}
                className="home-category"
                onClick={() => showCategory(category.type)}
                aria-label={`Explore ${category.title}`}
              >
                <img
                  src={category.image}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width="800"
                  height="533"
                />
                <div className="home-category-caption">
                  <h3>{category.title}</h3>
                  <p>{category.description}</p>
                  <span>
                    Explore category <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </button>
            ))}
            <Link
              href="/browse?tab=venues"
              className="home-category home-category-venue"
            >
              <div className="home-venue-art" aria-hidden="true">
                <Building2 />
                <span />
              </div>
              <div className="home-category-caption">
                <h3>Venues & Places</h3>
                <p>Stages · Spaces · Connections</p>
                <span>
                  Explore venues <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          </div>
          <div
            className="home-category-chips"
            aria-label="More talent categories"
          >
            <button
              onClick={() => showCategory("all")}
              aria-pressed={talentType === "all"}
            >
              All talent
            </button>
            {TALENT_TYPE_OPTIONS.filter(
              option =>
                !categories.some(category => category.type === option.value)
            ).map(option => (
              <button
                key={option.value}
                onClick={() => showCategory(option.value)}
                aria-pressed={talentType === option.value}
              >
                {option.pluralLabel}
              </button>
            ))}
          </div>
        </section>

        <div
          id="home-talent"
          className="home-discovery scroll-mt-28"
          aria-label={`Featured ${selectedLabel}`}
        >
          {talentType !== "all" && (
            <div className="home-container home-filter-status">
              <p>Showing {selectedLabel.toLowerCase()}</p>
              <button onClick={() => setTalentType("all")}>
                Clear category
              </button>
            </div>
          )}
          {artistsError ? (
            <div className="home-container home-empty" role="status">
              <h3>Talent is taking a moment to load.</h3>
              <p>Your profiles are still here. Try again or explore Browse.</p>
              <Button onClick={() => retryArtists()}>Try Again</Button>
              <Link href="/browse" className="home-text-link">
                Browse talent <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : isLoading ? (
            <div
              className="home-container home-skeleton-grid"
              aria-label="Loading talent"
            >
              {[1, 2, 3].map(item => (
                <div key={item} className="home-skeleton animate-pulse" />
              ))}
            </div>
          ) : visibleArtists.length > 0 ? (
            <FeaturedArtistsCarousel
              key={talentType}
              artists={visibleArtists}
              isLoading={isLoading}
            />
          ) : (
            <div className="home-container home-empty">
              <Sparkles className="h-7 w-7" />
              <h3>
                {talentType === "all"
                  ? "Your next connection starts here."
                  : `More ${selectedLabel.toLowerCase()} are on the way.`}
              </h3>
              <p>
                Explore all talent, or create your profile and help this
                community grow.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  className="home-button home-button-primary"
                  onClick={() => setTalentType("all")}
                >
                  See all talent
                </button>
                {!isAuthenticated && (
                  <button
                    className="home-button home-button-outline"
                    onClick={openSignUp}
                  >
                    Join as Talent
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="home-discovery home-venue-discovery">
          {venuesError ? (
            <div className="home-container home-empty">
              <h3>Venues couldn't load just now.</h3>
              <Button onClick={() => retryVenues()}>Retry venues</Button>
            </div>
          ) : (
            <FeaturedVenuesCarousel
              venues={featuredVenues || []}
              isLoading={venuesLoading}
            />
          )}
        </div>

        <section
          className="home-container home-tools"
          aria-labelledby="home-tools-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">BUILD & EARN</p>
              <h2 id="home-tools-title">One platform. More ways to grow.</h2>
            </div>
            <Link href="/how-it-works" className="home-text-link">
              See how it works <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="home-section-intro">
            Creators own their audience. Creators choose where their content
            lives. OlogyWood powers everything that makes that content
            profitable — bookings, Sell Tickets, fan clubs, merch, and content
            releases.
          </p>
          <div className="home-tools-grid">
            {creatorTools.map(tool => (
              <Link
                key={tool.title}
                href={tool.href}
                className="home-tool-card"
              >
                <div className="home-tool-icon">
                  <tool.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3>{tool.title}</h3>
                  <p>{tool.copy}</p>
                </div>
                <ArrowRight className="home-tool-arrow h-4 w-4" />
              </Link>
            ))}
          </div>
          <div className="home-live-links">
            <Link href="/ology-live/dashboard" className="home-text-link">Host a virtual session <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/ology-live" className="home-text-link">Explore live experiences <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <details className="home-more-tools">
            <summary>
              Explore all creator tools <ChevronDown className="h-4 w-4" />
            </summary>
            <div className="home-more-grid">
              {moreTools.map(tool => (
                <div key={tool.title}>
                  <tool.icon className="h-5 w-5" />
                  <h3>{tool.title}</h3>
                  <p>{tool.copy}</p>
                </div>
              ))}
            </div>
            <div className="home-nil-note">
              <Shield className="h-5 w-5 shrink-0" />
              <div>
                <h3>NIL Readiness Tools</h3>
                <p>
                  Private deal records, proposed reporting reminders, and fee
                  separation for Athlete accounts. {"Institutional or legal review may still be required."} These tools are not legal or NCAA
                  certification.
                </p>
              </div>
            </div>
          </details>
        </section>

        <section
          className="home-container home-how"
          aria-labelledby="home-how-title"
        >
          <div className="home-how-intro">
            <p className="home-eyebrow">MAKE YOUR NEXT MOVE</p>
            <h2 id="home-how-title">
              From talent
              <br />
              to opportunity.
            </h2>
            <p>Less admin. More time for what you do best.</p>
            <Link href="/how-it-works" className="home-text-link">
              Your guide to getting started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ol className="home-steps">
            {[
              {
                title: "Make it yours",
                copy: "Create your profile. Showcase your work, your story and what you offer.",
              },
              {
                title: "Build real connections",
                copy: "Get discovered by bookers and fans. Find venues, events and new audiences.",
              },
              {
                title: "Create your next opportunity",
                copy: "Manage bookings, sell your work and grow your community — all in one place.",
              },
            ].map((step, index) => (
              <li key={step.title}>
                <span className="home-step-number">0{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="home-container home-trust"
          aria-labelledby="home-trust-title"
        >
          <div className="home-section-heading">
            <div>
              <p className="home-eyebrow">YOUR WORK. YOUR BUSINESS.</p>
              <h2 id="home-trust-title">Ownership comes first.</h2>
            </div>
            <Link href="/pricing" className="home-text-link">
              View plans & fees <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="home-trust-grid">
            <div>
              <Globe className="h-6 w-6" />
              <h3>Your content, your choice</h3>
              <p>
                Host your content wherever you choose. OlogyWood handles
                discovery, ticketing, fan relationships and revenue.
              </p>
            </div>
            <div>
              <Users className="h-6 w-6" />
              <h3>You Keep 90%</h3>
              <p>
                Fan Club subscriptions use a 90/10 revenue split: 90% to Talent
                and a 10% platform fee. Other services have their own fees.
              </p>
              <Link href="/terms-of-service">
                Read the fee schedule <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div>
              <Lock className="h-6 w-6" />
              <h3>Secure Payments</h3>
              <p>
                Payments are processed by Stripe. Processing fees are separate;
                refunds and disputes follow the applicable payment terms.
              </p>
            </div>
          </div>
        </section>

        <section
          className="home-container home-follows"
          aria-label="Suggested connections"
        >
          <SuggestedFollows />
        </section>
        <section
          className="home-container home-principles"
          aria-labelledby="home-principles-title"
        >
          <p className="home-eyebrow">THE FOUNDER'S BLUEPRINT</p>
          <h2 id="home-principles-title">Built on something bigger.</h2>
          <div>
            {[
              { title: "Opportunity", subtitle: "Before Popularity" },
              { title: "People", subtitle: "Before Platforms" },
              { title: "Community", subtitle: "Before Competition" },
              { title: "Ownership", subtitle: "Before Dependency" },
              { title: "Legacy", subtitle: "Before Virality" },
            ].map(principle => (
              <p key={principle.title}>
                <strong>{principle.title}</strong>
                <span>{principle.subtitle}</span>
              </p>
            ))}
          </div>
          <Link href="/about" className="home-text-link">
            Read our story <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
        <section className="home-container home-final-cta">
          <div>
            <p className="home-eyebrow">THIS IS YOUR PLATFORM</p>
            <h2>What's your next opportunity?</h2>
            <p>
              Your talent deserves a place to grow. Start with a free profile.
            </p>
          </div>
          <div className="home-hero-actions">
            {isAuthenticated ? (
              <Link
                href="/workspace"
                className="home-button home-button-primary"
              >
                Open Workspace <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                className="home-button home-button-primary"
                onClick={openSignUp}
              >
                Join as Talent <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <Link href="/browse" className="home-button home-button-outline">
              Explore Talent
            </Link>
          </div>
        </section>
        <section
          className="home-container home-support"
          aria-label="Help and support"
        >
          <div>
            <HelpCircle className="h-5 w-5" />
            <p>
              Need a hand? <Link href="/help">Visit the Help Center</Link> or
              use the AI assistant in the header.
            </p>
          </div>
          <a href="mailto:support@ologywood.com">
            <Mail className="h-4 w-4" /> support@ologywood.com
          </a>
        </section>
      </main>
      <footer className="home-footer">
        <div className="home-container">
          <p>&copy; 2026 Ologywood™. All rights reserved.</p>
          <div>
            <Link href="/about">About</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/terms-of-service">Terms</Link>
            <Link href="/privacy-policy">Privacy</Link>
            <Link href="/help">Help</Link>
          </div>
        </div>
      </footer>
      <QuickSignupModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
        actionType="general"
      />
    </div>
  );
}
