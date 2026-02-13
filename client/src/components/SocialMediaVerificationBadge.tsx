import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface VerificationBadgeProps {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube';
  isVerified: boolean;
  username?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const SocialMediaVerificationBadge: React.FC<VerificationBadgeProps> = ({
  platform,
  isVerified,
  username,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const platformColors = {
    facebook: 'text-blue-600',
    twitter: 'text-blue-400',
    instagram: 'text-pink-600',
    linkedin: 'text-blue-700',
    youtube: 'text-red-600',
  };

  if (!isVerified) {
    return null;
  }

  return (
    <div className="flex items-center gap-1">
      <CheckCircle2
        size={size === 'sm' ? 16 : size === 'md' ? 20 : 24}
        className={`${platformColors[platform]} fill-current`}
      />
      {username && size === 'lg' && (
        <span className="text-xs text-gray-600 ml-1">Verified</span>
      )}
    </div>
  );
};

export default SocialMediaVerificationBadge;
