import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle, Upload, Shield, Star } from 'lucide-react';

type VerificationStatus = 'verified' | 'pending' | 'rejected' | 'not_started';
type BackgroundCheckStatus = 'passed' | 'failed' | 'pending' | 'not_started';

interface VerificationProfile {
  userId: number;
  name: string;
  role: 'artist' | 'venue';
  verificationStatus: VerificationStatus;
  backgroundCheckStatus: BackgroundCheckStatus;
  idVerified: boolean;
  backgroundCheckPassed: boolean;
  trustScore: number; // 0-100
  bookingsCompleted: number;
  averageRating: number;
  verifiedAt?: Date;
  rejectionReason?: string;
}

interface VerificationBadgesProps {
  profile: VerificationProfile;
  onStartVerification?: () => void;
  onUploadDocuments?: () => void;
}

export function VerificationBadges({ profile, onStartVerification, onUploadDocuments }: VerificationBadgesProps) {
  const [showDetails, setShowDetails] = useState(false);

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 border-green-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="w-full space-y-4">
      {/* Trust Score Card */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Trust Score
          </h3>
          <div className={`text-3xl font-bold ${getTrustScoreColor(profile.trustScore)}`}>
            {profile.trustScore}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Bookings</p>
            <p className="text-xl font-bold text-gray-900">{profile.bookingsCompleted}</p>
          </div>
          <div>
            <p className="text-gray-600">Rating</p>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <p className="text-xl font-bold text-gray-900">{profile.averageRating.toFixed(1)}</p>
            </div>
          </div>
          <div>
            <p className="text-gray-600">Role</p>
            <p className="text-xl font-bold text-gray-900 capitalize">{profile.role}</p>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className={`rounded-lg border-2 p-4 sm:p-6 ${getStatusColor(profile.verificationStatus)}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {getStatusIcon(profile.verificationStatus)}
            <div>
              <h4 className="font-semibold text-gray-900 capitalize">
                {profile.verificationStatus === 'not_started' ? 'Not Verified' : profile.verificationStatus}
              </h4>
              <p className="text-sm text-gray-600">Identity Verification</p>
            </div>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            {showDetails ? 'Hide' : 'Details'}
          </button>
        </div>

        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">ID Document</span>
              <span className={profile.idVerified ? 'text-green-600 font-medium' : 'text-gray-500'}>
                {profile.idVerified ? '✓ Verified' : 'Not verified'}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Background Check</span>
              <span
                className={
                  profile.backgroundCheckStatus === 'passed'
                    ? 'text-green-600 font-medium'
                    : profile.backgroundCheckStatus === 'pending'
                    ? 'text-yellow-600 font-medium'
                    : 'text-gray-500'
                }
              >
                {profile.backgroundCheckStatus === 'passed' && '✓ Passed'}
                {profile.backgroundCheckStatus === 'pending' && '⏳ Pending'}
                {profile.backgroundCheckStatus === 'failed' && '✗ Failed'}
                {profile.backgroundCheckStatus === 'not_started' && 'Not started'}
              </span>
            </div>

            {profile.rejectionReason && (
              <div className="mt-3 p-3 bg-red-100 rounded text-sm text-red-800">
                <p className="font-medium mb-1">Rejection Reason:</p>
                <p>{profile.rejectionReason}</p>
              </div>
            )}

            {profile.verificationStatus === 'not_started' && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={onStartVerification}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                >
                  Start Verification
                </button>
              </div>
            )}

            {profile.verificationStatus === 'pending' && (
              <div className="mt-4 p-3 bg-yellow-100 rounded text-sm text-yellow-800">
                <p>Your verification is under review. This typically takes 2-3 business days.</p>
              </div>
            )}

            {profile.verificationStatus === 'rejected' && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={onUploadDocuments}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Resubmit Documents
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verification Benefits */}
      {profile.verificationStatus === 'verified' && (
        <div className="bg-green-50 rounded-lg border border-green-200 p-4 sm:p-6">
          <h4 className="font-semibold text-green-900 mb-3">✓ Verified Benefits</h4>
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Verified badge on your profile
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Higher visibility in search results
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Increased booking confidence
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Access to premium features
            </li>
          </ul>
        </div>
      )}

      {/* Verification Progress */}
      {profile.verificationStatus === 'pending' && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 sm:p-6">
          <h4 className="font-semibold text-blue-900 mb-3">Verification in Progress</h4>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-blue-800">ID Verification</span>
                <span className="text-blue-600 font-medium">50%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
            <p className="text-sm text-blue-800 mt-3">
              We're reviewing your documents. You'll receive an email once verification is complete.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Verification Badge Component - Small inline badge for profiles
 */
interface VerificationBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function VerificationBadge({ status, size = 'md' }: VerificationBadgeProps) {
  if (status !== 'verified') return null;

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  return (
    <div title="Verified" className="inline-flex">
      <CheckCircle className={`${sizes[size]} text-green-600 fill-green-100`} />
    </div>
  );
}
