import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Zap, Target, Award } from 'lucide-react';

export interface ProfileCompletionData {
  score: number; // 0-100
  level: string; // "Incomplete", "Just Started", "Partially Complete", "Good Progress", "Nearly Complete", "Complete"
  completedFields: string[];
  missingFields: string[];
  recommendations: string[];
}

interface ProfileCompletionCardProps {
  data: ProfileCompletionData;
  onEditProfile?: () => void;
}

export function ProfileCompletionCard({
  data,
  onEditProfile,
}: ProfileCompletionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getColorClass = (score: number) => {
    if (score === 100) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score === 100) return 'bg-green-500';
    if (score >= 80) return 'bg-green-400';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    if (score >= 20) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-blue-500">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Profile Strength</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Complete your profile to attract more artists
              </p>
            </div>
          </div>
          <Badge variant="secondary" className={getColorClass(data.score)}>
            {data.level}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">
              Profile Completion
            </span>
            <span className={`text-lg font-bold ${getColorClass(data.score)}`}>
              {data.score}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getProgressColor(
                data.score
              )}`}
              style={{ width: `${data.score}%` }}
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <p className="text-xs text-green-600 font-semibold mb-1">
              ✓ COMPLETED
            </p>
            <p className="text-2xl font-bold text-green-700">
              {data.completedFields.length}
            </p>
            <p className="text-xs text-green-600 mt-1">fields filled</p>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs text-amber-600 font-semibold mb-1">
              ⚠ MISSING
            </p>
            <p className="text-2xl font-bold text-amber-700">
              {data.missingFields.length}
            </p>
            <p className="text-xs text-amber-600 mt-1">fields to complete</p>
          </div>
        </div>

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">
                  Recommendations to Boost Your Profile
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-blue-600" />
              ) : (
                <ChevronDown className="h-4 w-4 text-blue-600" />
              )}
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-2 pt-3 border-t border-blue-200">
                {data.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex gap-2 text-sm text-blue-900">
                    <span className="flex-shrink-0">→</span>
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Completed Fields */}
        {data.completedFields.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-600 uppercase">
              Completed Sections
            </p>
            <div className="flex flex-wrap gap-2">
              {data.completedFields.map(field => (
                <Badge key={field} variant="outline" className="bg-green-50">
                  ✓ {field}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* CTA Button */}
        {data.score < 100 && (
          <Button
            onClick={onEditProfile}
            className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Award className="h-4 w-4" />
            Complete Your Profile
          </Button>
        )}

        {data.score === 100 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-sm font-semibold text-green-700">
              🎉 Your profile is complete!
            </p>
            <p className="text-xs text-green-600 mt-1">
              Keep it updated to stay at the top of search results
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
