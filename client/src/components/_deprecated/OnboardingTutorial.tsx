import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, CheckCircle } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  action: string;
  targetElement?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlightElement?: boolean;
  allowSkip?: boolean;
}

interface TutorialFlow {
  id: string;
  name: string;
  userType: 'artist' | 'venue';
  steps: TutorialStep[];
  estimatedDuration: number;
  completionReward?: string;
}

interface OnboardingTutorialProps {
  tutorial: TutorialFlow;
  onComplete: () => void;
  onSkip: () => void;
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  tutorial,
  onComplete,
  onSkip,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const currentStep = tutorial.steps[currentStepIndex];
  const isLastStep = currentStepIndex === tutorial.steps.length - 1;
  const progressPercentage = ((currentStepIndex + 1) / tutorial.steps.length) * 100;

  useEffect(() => {
    if (currentStep.targetElement && currentStep.highlightElement) {
      const element = document.querySelector(currentStep.targetElement);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      }
    }
  }, [currentStep]);

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep.allowSkip) {
      onSkip();
    }
  };

  const getTooltipPosition = () => {
    if (!highlightPosition) return 'fixed bottom-4 right-4';

    const position = currentStep.position || 'bottom';
    const baseClasses = 'fixed z-50 bg-white rounded-lg shadow-2xl p-6 max-w-sm';

    switch (position) {
      case 'top':
        return `${baseClasses} bottom-auto top-4`;
      case 'left':
        return `${baseClasses} right-auto left-4`;
      case 'right':
        return `${baseClasses} left-auto right-4`;
      default:
        return `${baseClasses} bottom-4 right-4`;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={onSkip} />

      {/* Highlight box */}
      {highlightPosition && currentStep.highlightElement && (
        <div
          className="fixed border-2 border-blue-500 rounded-lg z-40 pointer-events-none transition-all duration-300"
          style={{
            top: highlightPosition.top - 8,
            left: highlightPosition.left - 8,
            width: highlightPosition.width + 16,
            height: highlightPosition.height + 16,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
          }}
        />
      )}

      {/* Tooltip */}
      <div className={getTooltipPosition()}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{currentStep.title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Step {currentStepIndex + 1} of {tutorial.steps.length}
            </p>
          </div>
          {currentStep.allowSkip && (
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-700 mb-4">{currentStep.description}</p>

        {/* Action hint */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4 rounded">
          <p className="text-sm text-blue-900 font-medium">{currentStep.action}</p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft size={18} />
            Previous
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {isLastStep ? (
              <>
                <CheckCircle size={18} />
                Complete
              </>
            ) : (
              <>
                Next
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* Completion reward */}
        {isLastStep && tutorial.completionReward && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
            🎉 {tutorial.completionReward}
          </div>
        )}
      </div>
    </>
  );
};

export default OnboardingTutorial;
