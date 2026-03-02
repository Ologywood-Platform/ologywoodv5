import React, { useState } from 'react';
import { Star, TrendingUp, AlertCircle } from 'lucide-react';

interface QualityScoreBreakdown {
  lighting: number;
  composition: number;
  clarity: number;
  background: number;
  colorBalance: number;
  total: number;
}

interface PhotoQualityBadgeProps {
  score: number;
  breakdown: QualityScoreBreakdown;
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  ratingDescription: string;
  percentile: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function PhotoQualityBadge({
  score,
  breakdown,
  rating,
  ratingDescription,
  percentile,
  showDetails = false,
  size = 'md'
}: PhotoQualityBadgeProps) {
  const [showBreakdown, setShowBreakdown] = useState(showDetails);

  const getBadgeColor = (): string => {
    if (score >= 8) return 'bg-green-100 text-green-900 border-green-300';
    if (score >= 6) return 'bg-blue-100 text-blue-900 border-blue-300';
    if (score >= 4) return 'bg-yellow-100 text-yellow-900 border-yellow-300';
    return 'bg-red-100 text-red-900 border-red-300';
  };

  const getBadgeIcon = (): string => {
    if (score >= 8) return '⭐';
    if (score >= 6) return '👍';
    if (score >= 4) return '👌';
    return '⚠️';
  };

  const getProgressColor = (): string => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-blue-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const categories = [
    { label: 'Lighting', value: breakdown.lighting, icon: '💡' },
    { label: 'Composition', value: breakdown.composition, icon: '📐' },
    { label: 'Clarity', value: breakdown.clarity, icon: '🔍' },
    { label: 'Background', value: breakdown.background, icon: '🎨' },
    { label: 'Color Balance', value: breakdown.colorBalance, icon: '🌈' }
  ];

  return (
    <div className="space-y-2">
      {/* Main Badge */}
      <div
        className={`inline-flex items-center gap-2 rounded-lg border ${getBadgeColor()} ${sizeClasses[size]} cursor-pointer hover:shadow-md transition`}
        onClick={() => setShowBreakdown(!showBreakdown)}
      >
        <span className="text-lg">{getBadgeIcon()}</span>
        <span className="font-bold">{score}/10</span>
        {size !== 'sm' && <span className="text-xs opacity-75">{rating.toUpperCase()}</span>}
      </div>

      {/* Breakdown Details */}
      {showBreakdown && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
          {/* Rating Description */}
          <div className="flex items-start gap-2">
            <TrendingUp className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-900">{ratingDescription}</p>
              <p className="text-sm text-gray-600 mt-1">
                Your photo ranks in the top {100 - percentile}% of all photos on the platform
              </p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Score Breakdown</p>
            {categories.map((category) => (
              <div key={category.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {category.icon} {category.label}
                  </span>
                  <span className="font-medium text-gray-900">{category.value.toFixed(1)}/2</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor()}`}
                    style={{ width: `${(category.value / 2) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          {/* Overall Progress */}
          <div className="pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-gray-900">Overall Score</span>
              <span className="font-bold text-gray-900">{score}/10</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getProgressColor()}`}
                style={{ width: `${(score / 10) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Improvement Tips */}
          {score < 8 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-3">
              <p className="text-sm font-medium text-blue-900 flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4" />
                How to Improve
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                {breakdown.lighting < 1.5 && <li>• Improve lighting for better exposure</li>}
                {breakdown.composition < 1.5 && <li>• Center your face using rule of thirds</li>}
                {breakdown.clarity < 1.5 && <li>• Ensure sharp focus with a tripod</li>}
                {breakdown.background < 1.5 && <li>• Use a simpler, uncluttered background</li>}
                {breakdown.colorBalance < 1.5 && <li>• Adjust white balance for natural colors</li>}
              </ul>
            </div>
          )}

          {/* Percentile Info */}
          <div className="bg-green-50 border border-green-200 rounded p-3">
            <p className="text-sm text-green-900">
              <strong>Great work!</strong> Your photo is better than {percentile}% of photos on the platform.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
