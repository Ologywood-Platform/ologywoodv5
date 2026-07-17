/**
 * FollowVenueButton Component
 * Auth-aware follow/unfollow button for venues with follower count and email consent.
 * Matches the artist FollowButton behavior for consistency.
 * 
 * States:
 * - Not logged in: "Follow" button → prompts sign-up
 * - Logged in + not following: "Follow" button with email consent
 * - Logged in + following: "Following" button → click to unfollow
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { QuickSignupModal } from "@/components/QuickSignupModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, UserCheck, Users, Mail, Building2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

interface FollowVenueButtonProps {
  /** The user ID of the venue being followed */
  venueUserId: number;
  /** The display name of the venue */
  venueName: string;
  /** Button size variant */
  size?: "sm" | "default" | "lg";
  /** Whether to show follower count */
  showCount?: boolean;
}

export function FollowVenueButton({ venueUserId, venueName, size = "default", showCount = true }: FollowVenueButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [showConsentDialog, setShowConsentDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const utils = trpc.useUtils();

  // Get follow stats (public - works without auth)
  const { data: stats } = trpc.follows.getStats.useQuery(
    { userId: venueUserId },
    { enabled: !!venueUserId }
  );

  // Check if current user is following (only when authenticated)
  const { data: followStatus } = trpc.follows.isFollowing.useQuery(
    { followingId: venueUserId, followingType: "venue" as const },
    { enabled: isAuthenticated && !!venueUserId }
  );

  const isFollowing = followStatus?.isFollowing ?? false;
  const followerCount = stats?.followersCount ?? 0;

  const followMutation = trpc.follows.follow.useMutation({
    onSuccess: () => {
      toast.success(`You're now following ${venueName}! You'll receive updates about their events.`);
      utils.follows.getStats.invalidate({ userId: venueUserId });
      utils.follows.isFollowing.invalidate({ followingId: venueUserId });
      setShowConsentDialog(false);
    },
    onError: (error) => {
      if (error.message?.includes("Already following")) {
        toast.info(`You're already following ${venueName}`);
      } else {
        toast.error(error.message || "Failed to follow");
      }
    },
  });

  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => {
      toast.success(`Unfollowed ${venueName}`);
      utils.follows.getStats.invalidate({ userId: venueUserId });
      utils.follows.isFollowing.invalidate({ followingId: venueUserId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unfollow");
    },
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate({ followingId: venueUserId, followingType: "venue" });
    } else {
      setShowConsentDialog(true);
    }
  };

  const handleConfirmFollow = () => {
    followMutation.mutate({ followingId: venueUserId, followingType: "venue" });
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  // Don't show follow button on own profile
  const isOwnProfile = isAuthenticated && user?.id === venueUserId;
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
              {!isAuthenticated ? "Sign Up to Follow" : "Follow Venue"}
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
              <Building2 className="w-5 h-5 text-primary" />
              Follow {venueName}
            </DialogTitle>
            <DialogDescription>
              Stay connected with {venueName} and never miss an event.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium">By following, you'll receive:</p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CalendarDays className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Updates about upcoming events and shows at this venue
                </li>
                <li className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Email notifications about special announcements
                </li>
                <li className="flex items-start gap-2">
                  <Users className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                  Priority access to event tickets and early booking
                </li>
              </ul>
            </div>

            <p className="text-xs text-muted-foreground">
              By clicking "Follow," you agree to receive email updates from {venueName} via Ologywood. 
              You can unfollow at any time to stop receiving updates. 
              Your email will be shared with {venueName} in accordance with our privacy policy.
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

      {/* Auth Modal for unauthenticated users */}
      <QuickSignupModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        actionType="general"
        defaultTab="signup"
      />
    </>
  );
}
