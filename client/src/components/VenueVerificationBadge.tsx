import React from 'react';
import { CheckCircle, Shield, Star, TrendingUp, AlertCircle } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface VerificationBadgeProps {
  status: 'verified' | 'pending' | 'unverified';
  badges: Badge[];
  trustScore: number;
  totalBookings?: number;
  averageRating?: number;
  responseTime?: string;
}

export function VenueVerificationBadge({
  status,
  badges,
  trustScore,
  totalBookings = 0,
  averageRating = 0,
  responseTime = 'N/A',
}: VerificationBadgeProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Shield className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'verified':
        return 'Verified Venue';
      case 'pending':
        return 'Verification Pending';
      default:
        return 'Unverified';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        {getStatusIcon()}
        <h3 className="font-semibold text-gray-900">{getStatusText()}</h3>
      </div>

      {/* Trust Score */}
      {trustScore > 0 && (
        <div className="mb-4 pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Trust Score</span>
            <span className="text-lg font-bold text-green-600">{trustScore}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all"
              style={{ width: `${trustScore}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      {(totalBookings > 0 || averageRating > 0) && (
        <div className="grid grid-cols-3 gap-2 mb-4 pb-4 border-b border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-600">Bookings</p>
            <p className="text-sm font-bold text-gray-900">{totalBookings}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600">Rating</p>
            <div className="flex items-center justify-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              <p className="text-sm font-bold text-gray-900">{averageRating}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600">Response</p>
            <p className="text-xs font-bold text-gray-900">{responseTime}</p>
          </div>
        </div>
      )}

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-700 mb-2">Verified Badges</p>
          <div className="space-y-2">
            {badges.map(badge => (
              <div key={badge.id} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-gray-900">{badge.name}</p>
                  <p className="text-xs text-gray-600">{badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unverified Message */}
      {status === 'unverified' && (
        <div className="text-center py-2">
          <p className="text-xs text-gray-600 mb-2">This venue is not yet verified</p>
          <button className="text-xs font-medium text-blue-600 hover:text-blue-700">
            Learn about verification
          </button>
        </div>
      )}
    </div>
  );
}
