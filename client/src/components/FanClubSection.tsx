import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Globe, Users, Check, Loader2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";

interface FanClubSectionProps {
  artistUserId: number;
  artistName: string;
}

export function FanClubSection({ artistUserId, artistName }: FanClubSectionProps) {
  const { user } = useAuth();
  const [joiningTierId, setJoiningTierId] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const tiersQuery = trpc.fanClub.getTalentTiers.useQuery({ talentUserId: artistUserId });
  const postsQuery = trpc.fanClub.getTalentFeed.useQuery({ talentUserId: artistUserId });
  const membershipQuery = trpc.fanClub.getMyMembership.useQuery(
    { talentUserId: artistUserId },
    { enabled: !!user }
  );

  const joinTier = trpc.fanClub.subscribe.useMutation({
    onSuccess: (data: any) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success("Welcome to the fan club!");
        membershipQuery.refetch();
      }
    },
    onError: (err: any) => toast.error(err.message || "Failed to join tier"),
  });

  const cancelMembership = trpc.fanClub.cancelMembership.useMutation({
    onSuccess: () => {
      toast.success("Membership cancelled. You'll retain access until the end of your billing period.");
      membershipQuery.refetch();
    },
    onError: (err: any) => toast.error(err.message || "Failed to cancel"),
  });

  const rawTiers = tiersQuery.data || [];
  const tiers = [...rawTiers].sort((a: any, b: any) => {
    const priceA = a.priceCents || a.priceMonthly || 0;
    const priceB = b.priceCents || b.priceMonthly || 0;
    return sortAsc ? priceA - priceB : priceB - priceA;
  });
  const posts = postsQuery.data || [];
  const membership = membershipQuery.data;

  // Don't show section if talent has no fan club set up
  if (rawTiers.length === 0 && posts.length === 0) return null;

  const handleJoin = (tierId: number) => {
    if (!user) {
      toast.error("Please sign in to join the fan club");
      return;
    }
    setJoiningTierId(tierId);
    joinTier.mutate({ tierId });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Fan Club</h2>
          {membership && membership.status === "active" && (
            <Badge className="bg-primary/10 text-primary border-primary/20">
              <Check className="h-3 w-3 mr-1" /> Member
            </Badge>
          )}
        </div>
        {tiers.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => setSortAsc(!sortAsc)}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortAsc ? "Low to High" : "High to Low"}
          </Button>
        )}
      </div>

      {/* Membership Tiers */}
      {tiers.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier: any) => {
            const isCurrentTier = membership?.tierId === tier.id && membership?.status === "active";
            const price = tier.priceCents || tier.priceMonthly || 0;
            return (
              <Card key={tier.id} className={isCurrentTier ? "border-primary ring-1 ring-primary/20" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Crown className="h-4 w-4 text-primary" />
                      {tier.name}
                    </CardTitle>
                    {isCurrentTier && (
                      <Badge variant="default" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-primary">
                      ${(price / 100).toFixed(2)}
                      <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Billed monthly · Cancel anytime</p>
                  </div>
                </CardHeader>
                <CardContent>
                  {tier.description && (
                    <p className="text-sm text-muted-foreground mb-3">{tier.description}</p>
                  )}
                  {tier.perks && tier.perks.length > 0 && (
                    <ul className="space-y-2 mb-4">
                      {tier.perks.map((perk: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{perk}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="border-t pt-3">
                    {isCurrentTier ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          if (confirm("Cancel your membership? You'll retain access until the end of your billing period.")) {
                            cancelMembership.mutate({ talentUserId: artistUserId });
                          }
                        }}
                        disabled={cancelMembership.isPending}
                      >
                        Cancel Membership
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleJoin(tier.id)}
                        disabled={joinTier.isPending && joiningTierId === tier.id}
                      >
                        {joinTier.isPending && joiningTierId === tier.id ? (
                          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Joining...</>
                        ) : "Join This Tier"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Exclusive Content Feed */}
      {posts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4" /> Exclusive Content
          </h3>
          <div className="space-y-3">
            {posts.map((post: any) => {
              const isLocked = post.visibility === "members_only" && (!membership || membership.status !== "active");
              return (
                <Card key={post.id} className={isLocked ? "opacity-75" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{post.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {post.visibility === "public" ? (
                              <><Globe className="h-3 w-3 mr-1" /> Public</>
                            ) : (
                              <><Lock className="h-3 w-3 mr-1" /> Members</>
                            )}
                          </Badge>
                        </div>
                        {isLocked ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Lock className="h-4 w-4" />
                            <span>Join the fan club to unlock this content</span>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Member Count */}
      {tiers.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>Join {artistName}'s exclusive community</span>
        </div>
      )}
    </div>
  );
}
