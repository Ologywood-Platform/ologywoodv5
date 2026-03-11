import { useMemo } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { getArtistCompleteness, getVenueCompleteness, getNextSteps, type CompletenessResult } from '../utils/profileCompleteness';

interface ProfileCompletenessCardProps {
  profile: any;
  type: 'artist' | 'venue';
  onEditProfile?: () => void;
}

const tierColors = {
  incomplete: { bg: 'bg-red-50 dark:bg-red-900/20', bar: 'bg-red-500', text: 'text-red-700 dark:text-red-400', label: 'Needs Attention' },
  basic: { bg: 'bg-amber-50 dark:bg-amber-900/20', bar: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-400', label: 'Basic' },
  good: { bg: 'bg-blue-50 dark:bg-blue-900/20', bar: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400', label: 'Good' },
  excellent: { bg: 'bg-green-50 dark:bg-green-900/20', bar: 'bg-green-500', text: 'text-green-700 dark:text-green-400', label: 'Excellent' },
};

export default function ProfileCompletenessCard({ profile, type, onEditProfile }: ProfileCompletenessCardProps) {
  const result: CompletenessResult = useMemo(() => {
    return type === 'artist' ? getArtistCompleteness(profile) : getVenueCompleteness(profile);
  }, [profile, type]);

  const nextSteps = useMemo(() => getNextSteps(result, 3), [result]);
  const colors = tierColors[result.tier];

  // Don't show if profile is excellent
  if (result.tier === 'excellent') {
    return (
      <div className={`rounded-lg border border-green-200 dark:border-green-800 ${colors.bg} p-4`}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <span className="font-medium text-green-700 dark:text-green-400">
            Profile Complete — {result.score}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${result.tier === 'incomplete' ? 'border-red-200 dark:border-red-800' : 'border-gray-200 dark:border-gray-700'} ${colors.bg} p-4 space-y-3`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {result.tier === 'incomplete' ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : (
            <CheckCircle2 className={`h-5 w-5 ${colors.text}`} />
          )}
          <span className={`font-medium ${colors.text}`}>
            Profile {colors.label} — {result.score}%
          </span>
        </div>
        {onEditProfile && (
          <button
            onClick={onEditProfile}
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 font-medium flex items-center gap-1"
          >
            Complete Profile <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`${colors.bar} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Complete next for better visibility:
          </p>
          <div className="flex flex-wrap gap-2">
            {nextSteps.map((step) => (
              <span
                key={step.key}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Warning for incomplete profiles */}
      {result.tier === 'incomplete' && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Profiles below 40% completeness are hidden from search results. Complete the fields above to become discoverable.
        </p>
      )}
    </div>
  );
}
