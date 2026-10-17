import { toSlug } from "@/lib/slugify";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FanEmailConsentControl } from "@/components/FanEmailConsentControl";
import {
  Heart,
  Music,
  MapPin,
  ExternalLink,
  UserMinus,
  Loader2,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { QuickSignupModal } from "@/components/QuickSignupModal";
import SiteHeader from "@/components/SiteHeader";
import { SuggestedFollows } from "@/components/SuggestedFollows";

export default function Following() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<"signup" | "login">("login");

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 py-16">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-gray-900">
              Follow Your Favorite Artists
            </h1>
            <p className="mx-auto mb-8 max-w-md text-gray-600">
              Sign up to keep artists and venues in your Following list. Creator
              email updates are always optional and require separate permission.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setAuthTab("login");
                  setShowAuthModal(true);
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAuthTab("signup");
                  setShowAuthModal(true);
                }}
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
        <QuickSignupModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          defaultTab={authTab}
          actionType="general"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-4xl px-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Button>
      </div>
      <FollowingList userId={user.id} />
    </div>
  );
}

function FollowingList({ userId }: { userId: number }) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const {
    data: following,
    isLoading,
    error,
  } = trpc.follows.getFollowing.useQuery({ userId, limit: 100, offset: 0 });
  const unfollowMutation = trpc.follows.unfollow.useMutation({
    onSuccess: () => {
      utils.follows.getFollowing.invalidate();
      toast.success("Unfollowed successfully");
    },
    onError: () => toast.error("Failed to unfollow"),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            We could not load the accounts you follow. Please refresh and try
            again.
          </CardContent>
        </Card>
      </div>
    );
  }

  const followedArtists =
    following?.filter((f: any) => f.followingType === "artist") || [];
  const followedVenues =
    following?.filter((f: any) => f.followingType === "venue") || [];
  const handleUnfollow = (
    followingId: number,
    followingType: "artist" | "venue"
  ) => unfollowMutation.mutate({ followingId, followingType });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold text-gray-900">Following</h1>
        <p className="text-gray-600">
          Artists and venues you follow. Following does not subscribe you to
          creator email; manage optional artist email permission on each artist
          card.
        </p>
      </div>

      <section className="mb-10">
        <div className="mb-4 flex items-center gap-2">
          <Music className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Artists ({followedArtists.length})
          </h2>
        </div>
        {followedArtists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Music className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No artists followed yet
              </h3>
              <p className="mb-4 text-gray-500">
                Discover artists to keep them in your Following list.
              </p>
              <Button
                onClick={() => navigate("/browse")}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Browse Artists
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {followedArtists.map((artist: any) => (
              <Card
                key={artist.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {artist.profilePhotoUrl ? (
                        <img
                          src={artist.profilePhotoUrl}
                          alt={artist.name}
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500">
                          <span className="text-lg font-bold text-white">
                            {(artist.name || "A").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3
                          className="cursor-pointer truncate font-semibold text-gray-900 transition-colors hover:text-purple-600"
                          onClick={() =>
                            navigate(`/artist/${toSlug(artist.name || "")}`)
                          }
                        >
                          {artist.name}
                        </h3>
                        {artist.nextEvent ? (
                          <p
                            className="flex cursor-pointer items-center gap-1 text-sm text-purple-600 hover:underline"
                            onClick={() =>
                              navigate(
                                `/events/${toSlug(artist.nextEvent.title || "")}`
                              )
                            }
                          >
                            <Calendar className="h-3 w-3" />
                            {artist.nextEvent.title} —{" "}
                            {new Date(
                              artist.nextEvent.date + "T00:00:00"
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No upcoming events
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/artist/${toSlug(artist.name || "")}`)
                        }
                        title="View Profile"
                        aria-label={`View ${artist.name}'s profile`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnfollow(artist.id, "artist")}
                        disabled={unfollowMutation.isPending}
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                        title="Unfollow"
                        aria-label={`Unfollow ${artist.name}`}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <FanEmailConsentControl
                    followingId={artist.id}
                    creatorName={artist.name || "this creator"}
                    className="w-full justify-center"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <div className="mb-10">
        <SuggestedFollows />
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-cyan-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Venues ({followedVenues.length})
          </h2>
        </div>
        {followedVenues.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-cyan-100">
                <MapPin className="h-6 w-6 text-cyan-600" />
              </div>
              <h3 className="mb-2 text-lg font-medium text-gray-900">
                No venues followed yet
              </h3>
              <p className="mb-4 text-gray-500">
                Follow venues to keep track of their events.
              </p>
              <Button onClick={() => navigate("/venues")} variant="outline">
                Browse Venues
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {followedVenues.map((venue: any) => (
              <Card
                key={venue.id}
                className="transition-shadow hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {venue.profilePhotoUrl ? (
                        <img
                          src={venue.profilePhotoUrl}
                          alt={venue.name}
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500">
                          <span className="text-lg font-bold text-white">
                            {(venue.name || "V").charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3
                          className="cursor-pointer truncate font-semibold text-gray-900 transition-colors hover:text-cyan-600"
                          onClick={() =>
                            navigate(`/venue/${toSlug(venue.name || "")}`)
                          }
                        >
                          {venue.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Followed{" "}
                          {new Date(venue.followedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          navigate(`/venue/${toSlug(venue.name || "")}`)
                        }
                        title="View Profile"
                        aria-label={`View ${venue.name}'s profile`}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnfollow(venue.id, "venue")}
                        disabled={unfollowMutation.isPending}
                        className="text-red-500 hover:bg-red-50 hover:text-red-700"
                        title="Unfollow"
                        aria-label={`Unfollow ${venue.name}`}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
