import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { tutorialAnalytics } from '@/lib/tutorialAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft, X, CheckCircle, Zap, Lightbulb } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  highlights?: string[]; // CSS selectors to highlight
  action?: string; // What the user should do
  tips?: string[];
  animation?: 'slideIn' | 'fadeIn' | 'pulse';
}

interface InteractiveTutorialProps {
  tutorialId: string;
  title: string;
  description: string;
  steps: TutorialStep[];
  onComplete?: () => void;
  onSkip?: () => void;
}

export function InteractiveTutorial({
  tutorialId,
  title,
  description,
  steps,
  onComplete,
  onSkip,
}: InteractiveTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [highlightedElements, setHighlightedElements] = useState<string[]>([]);

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;

  // Track tutorial started
  useEffect(() => {
    tutorialAnalytics.trackTutorialStarted(tutorialId);
  }, [tutorialId]);

  // Track step viewed
  useEffect(() => {
    tutorialAnalytics.trackStepViewed(tutorialId, step.id);
  }, [tutorialId, step.id]);

  // Highlight elements on mount
  useEffect(() => {
    if (step.highlights) {
      setHighlightedElements(step.highlights);
      step.highlights.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.classList.add('tutorial-highlight');
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }

    return () => {
      // Clean up highlights
      highlightedElements.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          element.classList.remove('tutorial-highlight');
        }
      });
    };
  }, [currentStep, step.highlights, highlightedElements]);

  const handleNext = () => {
    if (!completedSteps.includes(step.id)) {
      setCompletedSteps([...completedSteps, step.id]);
    }

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
    tutorialAnalytics.trackTutorialCompleted(tutorialId);
    setIsOpen(false);
    onComplete?.();
  };

  const handleSkip = () => {
    tutorialAnalytics.trackTutorialSkipped(tutorialId);
    setIsOpen(false);
    onSkip?.();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40 pointer-events-none" />

      {/* Tutorial Card */}
      <div className="fixed bottom-6 right-6 z-50 w-96 animate-in fade-in slide-in-from-bottom-4">
        <Card className="shadow-2xl border-2 border-primary">
          <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <p className="text-sm text-white/90 mt-1">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={progress} className="mt-3 h-1" />
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            {/* Step Content */}
            <div className={`space-y-3 animate-in ${step.animation === 'slideIn' ? 'slide-in-from-right' : 'fade-in'}`}>
              <div>
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  {step.title}
                </h3>
              </div>

              <p className="text-sm text-gray-700 leading-relaxed">
                {step.description}
              </p>

              {step.action && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900">
                    👉 {step.action}
                  </p>
                </div>
              )}

              {step.tips && step.tips.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-medium text-amber-900">Pro Tips:</p>
                  </div>
                  <ul className="text-sm text-amber-800 space-y-1 ml-6">
                    {step.tips.map((tip, idx) => (
                      <li key={idx} className="list-disc">
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Step Indicators */}
            <div className="flex gap-1 justify-center">
              {steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStep
                      ? 'bg-primary w-6'
                      : idx < currentStep
                      ? 'bg-green-500 w-2'
                      : 'bg-gray-300 w-2'
                  }`}
                />
              ))}
            </div>

            {/* Completed Steps */}
            {completedSteps.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                {completedSteps.length} of {steps.length} steps completed
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {isLastStep ? (
                <Button
                  size="sm"
                  onClick={handleComplete}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="flex-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Skip Option */}
            <button
              onClick={handleSkip}
              className="w-full text-sm text-gray-500 hover:text-gray-700 py-1"
            >
              Skip Tutorial
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Highlight Styles */}
      <style>{`
        .tutorial-highlight {
          position: relative;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5) !important;
          border-radius: 8px;
          animation: pulse-highlight 2s infinite;
          z-index: 45;
        }

        @keyframes pulse-highlight {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2);
          }
        }

        @keyframes slide-in-from-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
