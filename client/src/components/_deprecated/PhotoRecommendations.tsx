import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Lightbulb, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Recommendation {
  category: 'lighting' | 'composition' | 'clarity' | 'background' | 'color';
  severity: 'critical' | 'warning' | 'suggestion';
  title: string;
  description: string;
  actionableAdvice: string;
  exampleImageUrl?: string;
}

interface PhotoRecommendationsProps {
  photoId: string;
  overallQuality: number;
  recommendations: Recommendation[];
  strengths: string[];
  areasForImprovement: string[];
  estimatedImprovementPotential: number;
  onClose?: () => void;
}

export function PhotoRecommendations({
  photoId,
  overallQuality,
  recommendations,
  strengths,
  areasForImprovement,
  estimatedImprovementPotential,
  onClose
}: PhotoRecommendationsProps) {
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'recommendations' | 'examples'>('overview');

  const severityIcons = {
    critical: <AlertCircle className="h-5 w-5 text-red-600" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-600" />,
    suggestion: <Lightbulb className="h-5 w-5 text-blue-600" />
  };

  const severityColors = {
    critical: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    suggestion: 'bg-blue-50 border-blue-200'
  };

  const categoryIcons: Record<string, string> = {
    lighting: '💡',
    composition: '📐',
    clarity: '🔍',
    background: '🎨',
    color: '🌈'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Photo Analysis</h2>
            <p className="text-gray-600 mt-1">AI-powered recommendations to improve your photo</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quality Score */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Overall Quality Score</h3>
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold text-purple-600">{overallQuality}</div>
              <div className="flex-1">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${(overallQuality / 10) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Improvement potential: {estimatedImprovementPotential} points
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            {(['overview', 'recommendations', 'examples'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium border-b-2 transition ${
                  activeTab === tab
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Strengths */}
              {strengths.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    What's Working Well
                  </h4>
                  <div className="space-y-2">
                    {strengths.map((strength, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <span className="text-lg flex-shrink-0">✨</span>
                        <p className="text-gray-700">{strength}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Areas for Improvement */}
              {areasForImprovement.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    Areas for Improvement
                  </h4>
                  <div className="space-y-2">
                    {areasForImprovement.map((area, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <span className="text-lg flex-shrink-0">⚠️</span>
                        <p className="text-gray-700">{area}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations Tab */}
          {activeTab === 'recommendations' && (
            <div className="space-y-3">
              {recommendations.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
                  <p className="text-gray-600">Great job! No recommendations at this time.</p>
                </div>
              ) : (
                recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 ${severityColors[rec.severity]}`}
                  >
                    <button
                      onClick={() => setExpandedRec(expandedRec === idx.toString() ? null : idx.toString())}
                      className="w-full text-left flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        <span className="text-2xl mt-1">{categoryIcons[rec.category]}</span>
                        <div>
                          <h5 className="font-semibold text-gray-900">{rec.title}</h5>
                          <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 mt-1">{severityIcons[rec.severity]}</div>
                    </button>

                    {/* Expanded Details */}
                    {expandedRec === idx.toString() && (
                      <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-3">
                        <div>
                          <h6 className="font-medium text-gray-900 mb-2">What to do:</h6>
                          <p className="text-gray-700">{rec.actionableAdvice}</p>
                        </div>
                        {rec.exampleImageUrl && (
                          <div>
                            <h6 className="font-medium text-gray-900 mb-2">Example:</h6>
                            <img
                              src={rec.exampleImageUrl}
                              alt="Example"
                              className="w-full rounded-lg max-h-48 object-cover"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Examples Tab */}
          {activeTab === 'examples' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Here are examples of photos with similar recommendations and how they were improved:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations
                  .filter((r) => r.exampleImageUrl)
                  .map((rec, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={rec.exampleImageUrl}
                        alt={rec.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-3 bg-white">
                        <p className="font-medium text-gray-900">{rec.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{rec.actionableAdvice}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {onClose && (
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
            )}
            <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
              Re-upload Improved Photo
            </Button>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Address critical issues first for the biggest impact</li>
              <li>• Even small improvements can significantly boost your score</li>
              <li>• Compare your new photo with the old one to see progress</li>
              <li>• Higher quality photos get more visibility in search results</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
