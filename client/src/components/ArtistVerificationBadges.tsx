import { useQuery } from '@tanstack/react-query';
import { trpc } from '../lib/trpc';
import { Badge } from './ui/badge';
import { CheckCircle, Star, Award, Crown, Zap } from 'lucide-react';

interface ArtistVerificationBadgesProps {
  artistId: number;
}

export function ArtistVerificationBadges({ artistId }: ArtistVerificationBadgesProps) {
  const { data: badge } = useQuery({
    queryKey: ['artist', 'getVerificationBadge', artistId],
    queryFn: async () => {
      try {
        // This would call the verification badge endpoint
        // For now, returning mock data
        return {
          verificationStatus: 'gold',
          completedBookings: 15,
          averageRating: 4.8,
          hasProfilePhoto: true,
          hasBio: true,
          hasRiderTemplate: true,
        };
      } catch (error) {
        return null;
      }
    },
  });

  if (!badge) return null;

  const getBadgeInfo = (status: string) => {
    const badgeConfig = {
      bronze: {
        icon: CheckCircle,
        color: 'bg-orange-100 text-orange-800 border-orange-300',
        label: 'Bronze Verified',
        description: 'Profile verified and active',
      },
      silver: {
        icon: Star,
        color: 'bg-gray-100 text-gray-800 border-gray-300',
        label: 'Silver Verified',
        description: '5+ completed bookings',
      },
      gold: {
        icon: Award,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        label: 'Gold Verified',
        description: '15+ completed bookings, 4.5+ rating',
      },
      platinum: {
        icon: Crown,
        color: 'bg-purple-100 text-purple-800 border-purple-300',
        label: 'Platinum Elite',
        description: '30+ completed bookings, 4.8+ rating',
      },
    };

    return badgeConfig[status as keyof typeof badgeConfig] || badgeConfig.bronze;
  };

  const badgeInfo = getBadgeInfo(badge.verificationStatus);
  const BadgeIcon = badgeInfo.icon;

  return (
    <div className="space-y-4">
      {/* Main Verification Badge */}
      <div className={`p-4 rounded-lg border-2 ${badgeInfo.color}`}>
        <div className="flex items-center gap-3">
          <BadgeIcon className="w-6 h-6" />
          <div>
            <p className="font-semibold">{badgeInfo.label}</p>
            <p className="text-sm opacity-90">{badgeInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Achievement Badges */}
      <div>
        <p className="text-sm font-semibold mb-2">Achievements</p>
        <div className="flex flex-wrap gap-2">
          {badge.completedBookings >= 1 && (
            <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {badge.completedBookings} Bookings
            </Badge>
          )}
          {badge.averageRating >= 4.5 && (
            <Badge className="bg-green-100 text-green-800">
              ⭐ {badge.averageRating.toFixed(1)} Rating
            </Badge>
          )}
          {badge.hasProfilePhoto && (
            <Badge className="bg-purple-100 text-purple-800">
              ✓ Profile Photo
            </Badge>
          )}
          {badge.hasBio && (
            <Badge className="bg-indigo-100 text-indigo-800">
              ✓ Bio Complete
            </Badge>
          )}
          {badge.hasRiderTemplate && (
            <Badge className="bg-pink-100 text-pink-800">
              ✓ Rider Template
            </Badge>
          )}
        </div>
      </div>

      {/* Progress to Next Badge */}
      {badge.verificationStatus !== 'platinum' && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-semibold mb-2">Progress to Next Level</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{
                width: `${(badge.completedBookings / (badge.verificationStatus === 'gold' ? 30 : 15)) * 100}%`,
              }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {badge.verificationStatus === 'gold' && `${30 - badge.completedBookings} more bookings to Platinum`}
            {badge.verificationStatus === 'silver' && `${15 - badge.completedBookings} more bookings to Gold`}
            {badge.verificationStatus === 'bronze' && `${5 - badge.completedBookings} more bookings to Silver`}
          </p>
        </div>
      )}
    </div>
  );
}

export default ArtistVerificationBadges;
