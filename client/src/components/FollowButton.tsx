/**
 * Follow Button Component
 * Simple button to follow/unfollow artists or venues
 * Integrates with TRPC follows endpoints
 */

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';

interface FollowButtonProps {
  userId: number;
  userType: 'artist' | 'venue';
  currentUserId?: number;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  userType,
  currentUserId,
  onFollowChange,
  className = '',
  size = 'md',
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if already following
  const { data: followStatus } = trpc.follows.isFollowing.useQuery(
    { followingId: userId, followingType: userType },
    { enabled: !!currentUserId }
  );

  React.useEffect(() => {
    if (followStatus?.isFollowing !== undefined) {
      setIsFollowing(followStatus.isFollowing);
    }
  }, [followStatus]);

  // Follow mutation
  const followMutation = trpc.follows.follow.useMutation({
    onSuccess: () => {
      setIsFollowing(true);
      onFollowChange?.(true);
    },
    onError: (error) => {
      console.error('Failed to follow:', error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Unfollow mutation
  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => {
      setIsFollowing(false);
      onFollowChange?.(false);
    },
    onError: (error) => {
      console.error('Failed to unfollow:', error);
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  const handleToggleFollow = async () => {
    setIsLoading(true);

    if (isFollowing) {
      unfollowMutation.mutate({
        followingId: userId,
        followingType: userType,
      });
    } else {
      followMutation.mutate({
        followingId: userId,
        followingType: userType,
      });
    }
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <Button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`${sizeClasses[size]} flex items-center gap-2 transition-all ${
        isFollowing
          ? 'bg-red-500 hover:bg-red-600 text-white'
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
      } ${className}`}
      title={isFollowing ? 'Unfollow' : 'Follow'}
    >
      <Heart
        className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`}
      />
      <span>{isFollowing ? 'Following' : 'Follow'}</span>
    </Button>
  );
};

export default FollowButton;
