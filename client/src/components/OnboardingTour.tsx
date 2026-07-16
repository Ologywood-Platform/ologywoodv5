import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { X, ChevronRight, ChevronLeft, Sparkles, FileText, Shield, Video, Users } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  targetSelector?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const TOUR_STEPS: TourStep[] = [
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
    description: 'Showcase your talent with video highlights. Athletes can upload game footage, training clips, and media appearances to attract more bookings.',
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

const STORAGE_KEY = 'ologywood_nil_tour_completed';
const STORAGE_DISMISSED_KEY = 'ologywood_nil_tour_dismissed';

export function OnboardingTour() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    const dismissed = localStorage.getItem(STORAGE_DISMISSED_KEY);
    if (!completed && !dismissed) {
      // Show tour after a brief delay to let the page render
      const timer = setTimeout(() => setIsActive(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const positionTooltip = useCallback(() => {
    const step = TOUR_STEPS[currentStep];
    if (!step.targetSelector || step.position === 'center') {
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
      // Fallback to center if target not found
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
  }, [currentStep]);

  useEffect(() => {
    if (isActive) {
      positionTooltip();
      window.addEventListener('resize', positionTooltip);
      return () => window.removeEventListener('resize', positionTooltip);
    }
  }, [isActive, currentStep, positionTooltip]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
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
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsActive(false);
  };

  const dismissTour = () => {
    localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    setIsActive(false);
  };

  if (!isActive) return null;

  const step = TOUR_STEPS[currentStep];
  const progress = ((currentStep + 1) / TOUR_STEPS.length) * 100;

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
                  {currentStep + 1} of {TOUR_STEPS.length}
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
                <Button size="sm" onClick={handleNext} className="bg-purple-600 hover:bg-purple-700">
                  {currentStep === TOUR_STEPS.length - 1 ? 'Got it!' : 'Next'}
                  {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 ml-1" />}
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
  const resetTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_DISMISSED_KEY);
    window.dispatchEvent(new CustomEvent('ologywood-tour-reset'));
  };

  return { resetTour };
}
