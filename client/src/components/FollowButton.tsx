/**
 * FollowButton Component
 * Auth-aware follow/unfollow button with follower count and email consent.
 * 
 * States:
 * - Not logged in: "Follow" button → prompts sign-up as fan
 * - Logged in + not following: "Follow" button with email consent
 * - Logged in + following: "Following" button → click to unfollow
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, UserCheck, Users, Mail, Music } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  /** The user ID of the artist being followed */
  artistUserId: number;
  /** The display name of the artist */
  artistName: string;
  /** Button size variant */
  size?: "sm" | "default" | "lg";
  /** Whether to show follower count */
  showCount?: boolean;
}

export function FollowButton({ artistUserId, artistName, size = "lg", showCount = true }: FollowButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const utils = trpc.useUtils();

  // Get follow stats (public - works without auth)
  const { data: stats } = trpc.follows.getStats.useQuery(
    { userId: artistUserId },
    { enabled: !!artistUserId }
  );

  // Check if current user is following (only when authenticated)
  const { data: followStatus } = trpc.follows.isFollowing.useQuery(
    { followingId: artistUserId, followingType: "artist" as const },
    { enabled: isAuthenticated && !!artistUserId }
  );

  const isFollowing = followStatus?.isFollowing ?? false;
  const followerCount = stats?.followersCount ?? 0;

  const followMutation = trpc.follows.follow.useMutation({
    onSuccess: () => {
      toast.success(`You're now following ${artistName}! You'll receive updates about their events and news.`);
      utils.follows.getStats.invalidate({ userId: artistUserId });
      utils.follows.isFollowing.invalidate({ followingId: artistUserId });
      setShowConsentDialog(false);
    },
    onError: (error) => {
      if (error.message?.includes("Already following")) {
        toast.info(`You're already following ${artistName}`);
      } else {
        toast.error(error.message || "Failed to follow");
      }
    },
  });

  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => {
      toast.success(`Unfollowed ${artistName}`);
      utils.follows.getStats.invalidate({ userId: artistUserId });
      utils.follows.isFollowing.invalidate({ followingId: artistUserId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unfollow");
    },
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      // Not logged in → redirect to sign up
      window.location.href = getLoginUrl();
      return;
    }

    if (isFollowing) {
      // Already following → unfollow
      unfollowMutation.mutate({ followingId: artistUserId, followingType: "artist" });
    } else {
      // Not following → show consent dialog
      setShowConsentDialog(true);
    }
  };

  const handleConfirmFollow = () => {
    followMutation.mutate({ followingId: artistUserId, followingType: "artist" });
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  // Don't show follow button on own profile
  const isOwnProfile = isAuthenticated && user?.id === artistUserId;
  if (isOwnProfile) {
    return showCount ? (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {followerCount} {followerCount === 1 ? "follower" : "followers"}
        </span>
      </div>
    ) : null;
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          variant={isFollowing ? (isHovering ? "destructive" : "secondary") : "outline"}
          size={size}
          className="gap-2 transition-all"
          disabled={isLoading}
        >
          {isFollowing ? (
            <>
              {isHovering ? (
                <>
                  <UserPlus className="w-4 h-4" />
                  Unfollow
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  Following
                </>
              )}
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              {!isAuthenticated ? "Sign Up to Follow" : "Follow"}
            </>
          )}
        </Button>

        {showCount && (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {followerCount} {followerCount === 1 ? "follower" : "followers"}
          </span>
        )}
      </div>

      {/* Email Consent Dialog */}
      <Dialog open={showConsentDialog} onOpenChange={setShowConsentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Follow {artistName}
            </DialogTitle>
            <DialogDescription>
              Stay connected with {artistName} and never miss an update.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">By following, you'll receive:</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Email updates about new events and shows
                </li>
                <li className="flex items-start gap-2">
                  <Music className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Notifications about new releases and announcements
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Priority access to booking availability
                </li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              By clicking "Follow," you agree to receive email updates from {artistName} via Ologywood. 
              You can unfollow at any time to stop receiving updates. 
              Your email will be shared with {artistName} in accordance with our privacy policy.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleConfirmFollow}
                className="flex-1 gap-2"
                disabled={isLoading}
              >
                <UserPlus className="w-4 h-4" />
                {isLoading ? "Following..." : "Follow"}
              </Button>
              <Button
                onClick={() => setShowConsentDialog(false)}
                variant="outline"
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
