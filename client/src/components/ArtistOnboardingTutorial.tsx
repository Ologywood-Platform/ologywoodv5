import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  order: number;
}

export const ArtistOnboardingTutorial: React.FC = () => {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Fetch onboarding steps
  const { data: stepsData, isLoading } = trpc.artistOnboarding.getSteps.useQuery();
  const { data: progressData } = trpc.artistOnboarding.getProgress.useQuery();
  const { data: rewardData } = trpc.artistOnboarding.getReward.useQuery();

  useEffect(() => {
    if (stepsData) {
      setSteps(stepsData);
    }
  }, [stepsData]);

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercentage = Math.round((completedCount / steps.length) * 100);

  if (isLoading) {
    return <div className="text-center py-4">Loading onboarding...</div>;
  }

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Gift className="w-6 h-6 text-purple-600" />
          <div>
            <h3 className="font-bold text-lg text-gray-900">Get Started with Ologywood</h3>
            <p className="text-sm text-gray-600">Complete your profile to unlock premium features</p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-purple-600 font-semibold hover:text-purple-700"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700">Progress</span>
          <span className="text-sm font-bold text-purple-600">{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      {isExpanded && (
        <div className="space-y-3 mb-4">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                step.completed
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-white border border-gray-200 hover:border-purple-300'
              }`}
            >
              {step.completed ? (
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{step.icon}</span>
                  <h4 className="font-semibold text-gray-900">{step.title}</h4>
                </div>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
              </div>

              {!step.completed && (
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0"
                  onClick={() => {
                    // Navigate to the step
                    console.log(`Navigate to ${step.id}`);
                  }}
                >
                  Start
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reward Section */}
      {rewardData?.completed && (
        <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎉</span>
            <div>
              <p className="font-bold text-gray-900">{rewardData.reward}</p>
              <p className="text-sm text-gray-700">
                You've earned <strong>{rewardData.creditsAwarded} credits</strong> to use on the platform!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed View */}
      {!isExpanded && (
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {steps.slice(0, 3).map((step) => (
              <div
                key={step.id}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step.completed
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {step.completed ? '✓' : step.order}
              </div>
            ))}
            {steps.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs font-bold">
                +{steps.length - 3}
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-purple-600">
            {completedCount}/{steps.length} Complete
          </span>
        </div>
      )}
    </div>
  );
};

export default ArtistOnboardingTutorial;
