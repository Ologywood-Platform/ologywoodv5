import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, ChevronRight, ChevronLeft, Sparkles, FileText, Shield, Video, Users, Music, Calendar, DollarSign, Star, MessageSquare, Mic, Building2, Search, Receipt, Heart } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

// ─── ATHLETE TOUR STEPS ───────────────────────────────────────────────────────
const ATHLETE_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to NIL Features',
    description: 'OlogyWood now supports athletes and creators with full NIL (Name, Image, Likeness) compliance tools. Let us show you what\'s new.',
    icon: <Sparkles className="h-5 w-5 text-purple-500" />,
    position: 'center',
  },
  {
    id: 'rider-builder',
    title: 'Athlete Rider Templates',
    description: 'New rider templates designed for athletes: Appearance Rider, Autograph Signing, Speaking Engagement, and Camp/Clinic. Each includes NCAA compliance fields.',
    icon: <FileText className="h-5 w-5 text-blue-500" />,
    targetSelector: '[data-tour="rider-builder"]',
    position: 'bottom',
  },
  {
    id: 'nil-contracts',
    title: 'NIL-Compliant Contracts',
    description: 'Every contract now includes NIL compliance sections: school approval tracking, conference rules, disclosure requirements, and conflicting brand restrictions.',
    icon: <Shield className="h-5 w-5 text-green-500" />,
    targetSelector: '[data-tour="contracts"]',
    position: 'bottom',
  },
  {
    id: 'contract-analyzer',
    title: 'AI Contract Analyzer',
    description: 'Paste any NIL agreement and our AI will review it for standard NCAA compliance requirements, flagging potential issues and missing clauses.',
    icon: <Sparkles className="h-5 w-5 text-amber-500" />,
    targetSelector: '[data-tour="contract-analyzer"]',
    position: 'bottom',
  },
  {
    id: 'video-portfolio',
    title: 'Video Portfolio',
    description: 'Showcase your talent with video highlights. Upload game footage, training clips, and media appearances to attract more bookings.',
    icon: <Video className="h-5 w-5 text-red-500" />,
    targetSelector: '[data-tour="video-portfolio"]',
    position: 'bottom',
  },
  {
    id: 'talent-types',
    title: 'Expanded Talent Types',
    description: 'The platform now supports Artists, Athletes, Creators, Bands, DJs, Comedians, Actors, Influencers, and Speakers — all with tailored booking flows.',
    icon: <Users className="h-5 w-5 text-indigo-500" />,
    targetSelector: '[data-tour="talent-types"]',
    position: 'bottom',
  },
];

// ─── MUSIC ARTIST TOUR STEPS ──────────────────────────────────────────────────
const ARTIST_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to OlogyWood',
    description: 'Your all-in-one platform for managing bookings, building your brand, and growing your fanbase. Here\'s a quick tour of what you can do.',
    icon: <Music className="h-5 w-5 text-purple-500" />,
    position: 'center',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'Your home base. View upcoming bookings, track earnings, manage your calendar, and see fan engagement — all in one place.',
    icon: <Calendar className="h-5 w-5 text-blue-500" />,
    targetSelector: '[data-tour="dashboard"]',
    position: 'bottom',
  },
  {
    id: 'rider-builder',
    title: 'Rider Builder',
    description: 'Create professional riders for your shows. Set your technical requirements, hospitality needs, stage setup, and payment terms — then attach them to any booking.',
    icon: <FileText className="h-5 w-5 text-green-500" />,
    targetSelector: '[data-tour="rider-builder"]',
    position: 'bottom',
  },
  {
    id: 'video-portfolio',
    title: 'Video Portfolio',
    description: 'Upload performance videos, music videos, and live clips to showcase your talent. Venues and promoters browse these when considering you for bookings.',
    icon: <Video className="h-5 w-5 text-red-500" />,
    targetSelector: '[data-tour="video-portfolio"]',
    position: 'bottom',
  },
  {
    id: 'fan-engagement',
    title: 'Fan Club & Followers',
    description: 'Build your community right here. Fans can follow you, join your fan club, and get notified about your upcoming shows and new content.',
    icon: <Heart className="h-5 w-5 text-pink-500" />,
    targetSelector: '[data-tour="fan-club"]',
    position: 'bottom',
  },
  {
    id: 'earnings',
    title: 'Earnings & Payouts',
    description: 'Track every dollar. View your booking earnings, pending payments, and payout history. Set up direct deposits so you get paid fast.',
    icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
    targetSelector: '[data-tour="earnings"]',
    position: 'bottom',
  },
];

// ─── VENUE TOUR STEPS ─────────────────────────────────────────────────────────
const VENUE_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to OlogyWood',
    description: 'Your platform for discovering talent, managing bookings, and promoting your events. Here\'s a quick tour of what you can do as a venue.',
    icon: <Building2 className="h-5 w-5 text-purple-500" />,
    position: 'center',
  },
  {
    id: 'browse-talent',
    title: 'Browse & Book Talent',
    description: 'Search artists by genre, location, price range, and availability. Filter by region or state to find local talent perfect for your events.',
    icon: <Search className="h-5 w-5 text-blue-500" />,
    targetSelector: '[data-tour="browse-talent"]',
    position: 'bottom',
  },
  {
    id: 'post-events',
    title: 'Post Events',
    description: 'Create and promote events at your venue. Add details, upload flyers, set ticket info, and let artists and fans discover what\'s coming up.',
    icon: <Calendar className="h-5 w-5 text-orange-500" />,
    targetSelector: '[data-tour="post-events"]',
    position: 'bottom',
  },
  {
    id: 'booking-workflow',
    title: 'Booking Workflow',
    description: 'Send booking requests, negotiate terms, review riders, and manage the entire process from inquiry to confirmation — all through messaging.',
    icon: <MessageSquare className="h-5 w-5 text-green-500" />,
    targetSelector: '[data-tour="bookings"]',
    position: 'bottom',
  },
  {
    id: 'invoicing',
    title: 'Invoicing & Payments',
    description: 'Generate invoices, process payments securely through Stripe, and keep a complete financial history of all your bookings.',
    icon: <Receipt className="h-5 w-5 text-emerald-500" />,
    targetSelector: '[data-tour="invoicing"]',
    position: 'bottom',
  },
  {
    id: 'reviews',
    title: 'Reviews & Reputation',
    description: 'After events, leave reviews for artists and receive reviews from them. Build your venue\'s reputation to attract top talent.',
    icon: <Star className="h-5 w-5 text-amber-500" />,
    targetSelector: '[data-tour="reviews"]',
    position: 'bottom',
  },
];

// ─── STORAGE KEYS ─────────────────────────────────────────────────────────────
const STORAGE_KEYS = {
  athlete: { completed: 'ologywood_athlete_tour_completed', dismissed: 'ologywood_athlete_tour_dismissed' },
  artist: { completed: 'ologywood_artist_tour_completed', dismissed: 'ologywood_artist_tour_dismissed' },
  venue: { completed: 'ologywood_venue_tour_completed', dismissed: 'ologywood_venue_tour_dismissed' },
};

// Legacy keys (for backward compat — if user already dismissed the old NIL tour, don't re-show)
const LEGACY_STORAGE_KEY = 'ologywood_nil_tour_completed';
const LEGACY_DISMISSED_KEY = 'ologywood_nil_tour_dismissed';

type TourRole = 'athlete' | 'artist' | 'venue';

function getTourConfig(role: TourRole): { steps: TourStep[]; storageKey: string; dismissedKey: string; accentColor: string } {
  switch (role) {
    case 'athlete':
      return {
        steps: ATHLETE_TOUR_STEPS,
        storageKey: STORAGE_KEYS.athlete.completed,
        dismissedKey: STORAGE_KEYS.athlete.dismissed,
        accentColor: 'bg-purple-600 hover:bg-purple-700',
      };
    case 'artist':
      return {
        steps: ARTIST_TOUR_STEPS,
        storageKey: STORAGE_KEYS.artist.completed,
        dismissedKey: STORAGE_KEYS.artist.dismissed,
        accentColor: 'bg-purple-600 hover:bg-purple-700',
      };
    case 'venue':
      return {
        steps: VENUE_TOUR_STEPS,
        storageKey: STORAGE_KEYS.venue.completed,
        dismissedKey: STORAGE_KEYS.venue.dismissed,
        accentColor: 'bg-teal-600 hover:bg-teal-700',
      };
  }
}

export function OnboardingTour() {
  const { user } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [tourRole, setTourRole] = useState<TourRole | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Only fetch artist profile if user is an artist (to check talentType)
  const { data: profile } = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: !!user && user.role === 'artist',
  });

  // Determine the user's tour role
  useEffect(() => {
    if (!user) {
      setTourRole(null);
      return;
    }

    if (user.role === 'venue') {
      setTourRole('venue');
    } else if (user.role === 'artist' && profile) {
      if (profile.talentType === 'athlete') {
        setTourRole('athlete');
      } else {
        setTourRole('artist');
      }
    }
  }, [user, profile]);

  // Show tour when role is determined
  useEffect(() => {
    if (!tourRole) return;

    const config = getTourConfig(tourRole);

    // Check legacy keys for athletes (backward compat)
    if (tourRole === 'athlete') {
      const legacyCompleted = localStorage.getItem(LEGACY_STORAGE_KEY);
      const legacyDismissed = localStorage.getItem(LEGACY_DISMISSED_KEY);
      if (legacyCompleted || legacyDismissed) return;
    }

    const completed = localStorage.getItem(config.storageKey);
    const dismissed = localStorage.getItem(config.dismissedKey);
    if (!completed && !dismissed) {
      const timer = setTimeout(() => setIsActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [tourRole]);

  const config = tourRole ? getTourConfig(tourRole) : null;
  const steps = config?.steps ?? [];

  const positionTooltip = useCallback(() => {
    if (!steps.length) return;
    const step = steps[currentStep];
    if (!step?.targetSelector || step.position === 'center') {
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      });
      return;
    }

    const target = document.querySelector(step.targetSelector);
    if (!target) {
      setTooltipStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001,
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    const tooltipWidth = 360;
    const tooltipHeight = 200;
    const padding = 12;

    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'top':
        top = rect.top - tooltipHeight - padding;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.left - tooltipWidth - padding;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        left = rect.right + padding;
        break;
    }

    // Keep within viewport
    const maxLeft = window.innerWidth - tooltipWidth - 16;
    const maxTop = window.innerHeight - tooltipHeight - 16;
    left = Math.max(16, Math.min(left, maxLeft));
    top = Math.max(16, Math.min(top, maxTop));

    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      zIndex: 10001,
    });
  }, [currentStep, steps]);

  useEffect(() => {
    if (isActive) {
      positionTooltip();
      window.addEventListener('resize', positionTooltip);
      return () => window.removeEventListener('resize', positionTooltip);
    }
  }, [isActive, currentStep, positionTooltip]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      completeTour();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const completeTour = () => {
    if (config) {
      localStorage.setItem(config.storageKey, 'true');
    }
    setIsActive(false);
  };

  const dismissTour = () => {
    if (config) {
      localStorage.setItem(config.dismissedKey, 'true');
    }
    setIsActive(false);
  };

  if (!isActive || !config || !steps.length) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] transition-opacity duration-300"
        onClick={dismissTour}
      />

      {/* Spotlight on target element */}
      {step.targetSelector && step.position !== 'center' && (() => {
        const target = document.querySelector(step.targetSelector!);
        if (!target) return null;
        const rect = target.getBoundingClientRect();
        return (
          <div
            className="fixed z-[10000] rounded-lg ring-4 ring-purple-400/60 pointer-events-none"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
            }}
          />
        );
      })()}

      {/* Tooltip Card */}
      <div ref={tooltipRef} style={tooltipStyle}>
        <Card className="w-[360px] max-w-[calc(100vw-32px)] shadow-2xl border-purple-200 dark:border-purple-800">
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {step.icon}
                <Badge variant="secondary" className="text-xs">
                  {currentStep + 1} of {steps.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={dismissTour}
                aria-label="Close tour"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <h3 className="font-semibold text-base mb-1.5">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Progress */}
            <Progress value={progress} className="h-1.5 mb-3" />

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissTour}
                className="text-xs text-muted-foreground"
              >
                Don't show again
              </Button>
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrev}>
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={handleNext} className={config.accentColor}>
                  {currentStep === steps.length - 1 ? 'Got it!' : 'Next'}
                  {currentStep < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 ml-1" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/**
 * Hook to trigger the tour manually (e.g., from a "What's New" button)
 */
export function useOnboardingTour() {
  const resetTour = (role?: TourRole) => {
    if (role) {
      const keys = STORAGE_KEYS[role];
      localStorage.removeItem(keys.completed);
      localStorage.removeItem(keys.dismissed);
    } else {
      // Reset all tours
      Object.values(STORAGE_KEYS).forEach(({ completed, dismissed }) => {
        localStorage.removeItem(completed);
        localStorage.removeItem(dismissed);
      });
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_DISMISSED_KEY);
    }
    window.dispatchEvent(new CustomEvent('ologywood-tour-reset'));
  };

  return { resetTour };
}
