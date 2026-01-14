import React, { useState } from "react";
import { Award, Star, Trophy, HelpCircle } from "lucide-react";

interface VerificationBadgeProps {
  badge?: "verified" | "top_rated" | "pro" | null;
  completedBookings?: number;
  showTooltip?: boolean;
}

export function VerificationBadge({
  badge,
  completedBookings = 0,
  showTooltip = true,
}: VerificationBadgeProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!badge) return null;

  const badgeConfig = {
    verified: {
      icon: Award,
      label: "Verified Artist",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Completed 5+ bookings with positive feedback",
      nextMilestone: "20 bookings for Top Rated",
    },
    top_rated: {
      icon: Star,
      label: "Top Rated",
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      description: "Completed 20+ bookings with excellent ratings",
      nextMilestone: "50 bookings for Pro status",
    },
    pro: {
      icon: Trophy,
      label: "Pro Artist",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      description: "Completed 50+ bookings - Elite status",
      nextMilestone: "You've reached the highest tier!",
    },
  };

  const config = badgeConfig[badge];
  const Icon = config.icon;

  return (
    <div className="relative inline-block group">
      {/* Badge Display */}
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${config.bgColor} border ${config.borderColor} cursor-help`}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className={`text-sm font-semibold ${config.color}`}>{config.label}</span>
      </div>

      {/* Tooltip */}
      {showTooltip && showDetails && (
        <div className="absolute z-50 left-0 mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg">
          <p className="font-semibold mb-1">{config.label}</p>
          <p className="text-gray-300 text-xs mb-2">{config.description}</p>
          <div className="border-t border-gray-700 pt-2 mt-2">
            <p className="text-xs text-gray-400">
              <strong>Bookings:</strong> {completedBookings}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              <strong>Next:</strong> {config.nextMilestone}
            </p>
          </div>
          <div className="absolute -top-1 left-3 w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      )}
    </div>
  );
}

/**
 * Badge Progress Component - Shows progress toward next milestone
 */
export function BadgeProgress({
  currentBookings,
  nextMilestone,
}: {
  currentBookings: number;
  nextMilestone?: { bookings: number; badge: string; label: string };
}) {
  if (!nextMilestone) return null;

  const progress = (currentBookings / nextMilestone.bookings) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <p className="text-sm font-medium text-gray-700">
          Progress to {nextMilestone.label}
        </p>
        <p className="text-sm text-gray-600">
          {currentBookings}/{nextMilestone.bookings}
        </p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}

/**
 * Badge List Component - Shows all available badges
 */
export function BadgesList() {
  const badges = [
    {
      badge: "verified",
      label: "Verified Artist",
      requirement: "5+ completed bookings",
      icon: Award,
      color: "text-blue-600",
    },
    {
      badge: "top_rated",
      label: "Top Rated",
      requirement: "20+ completed bookings",
      icon: Star,
      color: "text-amber-600",
    },
    {
      badge: "pro",
      label: "Pro Artist",
      requirement: "50+ completed bookings",
      icon: Trophy,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">Verification Badges</h3>
      {badges.map((b) => {
        const Icon = b.icon;
        return (
          <div key={b.badge} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Icon className={`w-6 h-6 ${b.color}`} />
            <div>
              <p className="font-medium text-gray-900">{b.label}</p>
              <p className="text-sm text-gray-600">{b.requirement}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
