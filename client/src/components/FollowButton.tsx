import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { QuickSignupModal } from "@/components/QuickSignupModal";
import { FanEmailConsentControl } from "@/components/FanEmailConsentControl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserPlus, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";

interface FollowButtonProps {
  /** The user ID of the artist being followed */
  artistUserId: number;
  /** The display name of the artist */
  artistName: string;
  size?: "sm" | "default" | "lg";
  showCount?: boolean;
}

/**
 * Follow is deliberately independent of email permission. After a fan follows,
 * the optional FanEmailConsentControl is available as a separate action.
 */
export function FollowButton({
  artistUserId,
  artistName,
  size = "lg",
  showCount = true,
}: FollowButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const [showFollowDialog, setShowFollowDialog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const utils = trpc.useUtils();

  const { data: stats } = trpc.follows.getStats.useQuery(
    { userId: artistUserId },
    { enabled: !!artistUserId }
  );
  const { data: followStatus } = trpc.follows.isFollowing.useQuery(
    { followingId: artistUserId, followingType: "artist" as const },
    { enabled: isAuthenticated && !!artistUserId }
  );

  const isFollowing = followStatus?.isFollowing ?? false;
  const followerCount = stats?.followersCount ?? 0;

  const followMutation = trpc.follows.follow.useMutation({
    onSuccess: () => {
      toast.success(`You’re now following ${artistName}.`);
      utils.follows.getStats.invalidate({ userId: artistUserId });
      utils.follows.isFollowing.invalidate({ followingId: artistUserId });
      setShowFollowDialog(false);
    },
    onError: error => {
      if (error.message?.includes("Already following")) {
        toast.info(`You’re already following ${artistName}.`);
        utils.follows.isFollowing.invalidate({ followingId: artistUserId });
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
    onError: error => toast.error(error.message || "Failed to unfollow"),
  });

  const handleClick = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return;
    }
    if (isFollowing) {
      unfollowMutation.mutate({
        followingId: artistUserId,
        followingType: "artist",
      });
    } else {
      setShowFollowDialog(true);
    }
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;
  const isOwnProfile = isAuthenticated && user?.id === artistUserId;
  if (isOwnProfile) {
    return showCount ? (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
          {followerCount} {followerCount === 1 ? "follower" : "followers"}
        </span>
      </div>
    ) : null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={handleClick}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          variant={
            isFollowing ? (isHovering ? "destructive" : "secondary") : "outline"
          }
          size={size}
          className="gap-2 transition-all"
          disabled={isLoading}
        >
          {isFollowing ? (
            isHovering ? (
              <>
                <UserPlus className="h-4 w-4" />
                Unfollow
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4" />
                Following
              </>
            )
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              {!isAuthenticated ? "Sign Up to Follow" : "Follow"}
            </>
          )}
        </Button>

        {isFollowing && (
          <FanEmailConsentControl
            followingId={artistUserId}
            creatorName={artistName}
            triggerLabel="Email updates (optional)"
          />
        )}

        {showCount && (
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            {followerCount} {followerCount === 1 ? "follower" : "followers"}
          </span>
        )}
      </div>

      <Dialog open={showFollowDialog} onOpenChange={setShowFollowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Follow {artistName}
            </DialogTitle>
            <DialogDescription>
              Add {artistName} to the creators you follow on OlogyWood.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Following helps you keep this creator in your list. It does not
              sign you up for emails or share your email address. Optional
              creator email permission is available separately after you follow.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFollowDialog(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() =>
                  followMutation.mutate({
                    followingId: artistUserId,
                    followingType: "artist",
                  })
                }
                disabled={isLoading}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {followMutation.isPending ? "Following…" : "Follow"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <QuickSignupModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        actionType="general"
        defaultTab="signup"
      />
    </>
  );
}
