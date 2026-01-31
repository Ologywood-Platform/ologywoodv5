import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  BarChart3,
  Settings,
  Share2,
  Zap,
} from 'lucide-react';

interface VenueWelcomeTourProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

export function VenueWelcomeTour({ onComplete, onSkip }: VenueWelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to Your Venue Dashboard!',
      description:
        "We're excited to help you connect with talented artists. Let's take a quick tour to show you the key features.",
      icon: '🎉',
      highlights: [],
      action: 'Click "Next" to begin',
    },
    {
      id: 'profile',
      title: 'Your Venue Profile',
      description:
        'This is your public profile that artists see when browsing venues. Keep it updated with the latest information, photos, and amenities to attract more inquiries.',
      icon: '👤',
      highlights: ['#profileSection'],
      action: 'View and edit your profile details',
    },
    {
      id: 'analytics',
      title: 'Analytics Dashboard',
      description:
        'Track how many artists are viewing your listing, how many inquiries you receive, and which sources bring the most traffic. Use these insights to improve your visibility.',
      icon: '📊',
      highlights: ['#analyticsSection'],
      action: 'Check your profile views and inquiries',
    },
    {
      id: 'bookings',
      title: 'Manage Your Bookings',
      description:
        'View all booking requests from artists, respond to inquiries, and confirm bookings. You can also track the status of each booking and communicate directly with artists.',
      icon: '📅',
      highlights: ['#bookingsSection'],
      action: 'Review your pending booking requests',
    },
    {
      id: 'share',
      title: 'Share Your Profile',
      description:
        'Promote your venue on social media to get more visibility. Share your profile on Facebook, Twitter, LinkedIn, WhatsApp, and Email to reach more artists.',
      icon: '📱',
      highlights: ['#shareButton'],
      action: 'Share your venue profile on social media',
    },
    {
      id: 'settings',
      title: 'Settings & Preferences',
      description:
        'Update your contact information, manage email notifications, and configure your booking preferences. Keep your settings current to stay connected with artists.',
      icon: '⚙️',
      highlights: ['#settingsButton'],
      action: 'Configure your notification preferences',
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description:
        'Your venue is ready to start receiving bookings. Remember to respond quickly to artist inquiries and keep your profile updated for the best results.',
      icon: '✨',
      highlights: [],
      action: 'Start exploring and booking artists!',
    },
  ];

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  // Highlight elements on mount
  useEffect(() => {
    if (step.highlights && step.highlights.length > 0) {
      step.highlights.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        }
      });
    }

    return () => {
      // Clean up highlights
      document.querySelectorAll('.ring-2').forEach(el => {
        el.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
      });
    };
  }, [step]);

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    setIsOpen(false);
    onSkip?.();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Tour Card */}
      <Card className="relative w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{step.icon}</span>
              <div>
                <CardTitle className="text-white">{step.title}</CardTitle>
                <p className="text-sm text-blue-100 mt-1">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Progress value={progress} className="h-2 bg-blue-400" />
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Description */}
          <div>
            <p className="text-lg text-gray-700 leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Action Suggestion */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">{step.action}</p>
          </div>

          {/* Tips for specific steps */}
          {currentStep === 1 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                💡 Pro Tip: Complete Your Profile
              </p>
              <p className="text-sm text-amber-800">
                Venues with complete profiles (photos, description, amenities) receive
                3x more artist inquiries. Fill out all sections to maximize visibility.
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-900 mb-2">
                📈 Track Your Success
              </p>
              <p className="text-sm text-green-800">
                Monitor profile views, inquiry sources, and booking trends. Use this data
                to improve your listing and attract more artists.
              </p>
            </div>
          )}

          {currentStep === 4 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-purple-900 mb-2">
                🚀 Boost Visibility
              </p>
              <p className="text-sm text-purple-800">
                Share your venue profile on social media regularly. Artists are more
                likely to book venues they've seen shared by their networks.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 justify-between pt-4">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Tour
              </Button>
              <Button onClick={handleNext} className="gap-2">
                {isLastStep ? (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Step Indicators */}
          <div className="flex gap-1 justify-center pt-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-blue-600 w-8'
                    : index < currentStep
                      ? 'bg-blue-300 w-2'
                      : 'bg-gray-300 w-2'
                }`}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
