import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Globe, Users, Check, Loader2, ArrowUpDown, ChevronDown, ChevronUp, Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface FanClubSectionProps {
  artistUserId: number;
  artistName: string;
  talentType?: string;
}

export function FanClubSection({ artistUserId, artistName, talentType }: FanClubSectionProps) {
  const { user } = useAuth();
  const [joiningTierId, setJoiningTierId] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedPerks, setExpandedPerks] = useState<Record<number, boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const athleteCategories = [
    { key: 'all', label: 'All' },
    { key: 'training', label: 'Training' },
    { key: 'game_day', label: 'Game Day' },
    { key: 'behind_the_scenes', label: 'Behind the Scenes' },
    { key: 'qa_session', label: 'Q&A' },
  ];
  const artistCategories = [
    { key: 'all', label: 'All' },
    { key: 'studio_session', label: 'Studio' },
    { key: 'live_performance', label: 'Live' },
    { key: 'behind_the_scenes', label: 'Behind the Scenes' },
    { key: 'qa_session', label: 'Q&A' },
  ];
  const categories = talentType === 'athlete' ? athleteCategories : artistCategories;

  const [commentingPostId, setCommentingPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showTierModal, setShowTierModal] = useState(false);

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

  const postIds = posts.map((p: any) => p.id).filter(Boolean);
  const likesQuery = trpc.fanClub.getPostLikes.useQuery(
    { postIds },
    { enabled: postIds.length > 0 }
  );
  const likesData = likesQuery.data as Record<number, { count: number; liked: boolean }> | undefined;

  const likePost = trpc.fanClub.likePost.useMutation({
    onSuccess: () => { likesQuery.refetch(); },
    onError: (err: any) => toast.error(err.message || 'Failed to like'),
  });

  const addComment = trpc.fanClub.addComment.useMutation({
    onSuccess: () => {
      setCommentText('');
      toast.success('Comment added');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to comment'),
  });

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
                    <div className="mb-4">
                      <button
                        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-2"
                        onClick={() => setExpandedPerks(prev => ({ ...prev, [tier.id]: !prev[tier.id] }))}
                      >
                        {expandedPerks[tier.id] ? (
                          <><ChevronUp className="h-4 w-4" /> Hide Perks</>
                        ) : (
                          <><ChevronDown className="h-4 w-4" /> View Perks ({tier.perks.length})</>
                        )}
                      </button>
                      {expandedPerks[tier.id] && (
                        <ul className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                          {tier.perks.map((perk: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                              <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>{perk}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4" /> Exclusive Content
            </h3>
            {/* Category filter chips */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategoryFilter(cat.key)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    categoryFilter === cat.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {posts
              .filter((post: any) => categoryFilter === 'all' || post.contentCategory === categoryFilter)
              .map((post: any) => {
              const isLocked = post.visibility === "members_only" && (!membership || membership.status !== "active");
              return (
                <Card key={post.id} className={isLocked ? "relative overflow-hidden" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-medium">{post.title}</h4>
                          {post.contentCategory && (
                            <Badge variant="secondary" className="text-[10px] capitalize">
                              {post.contentCategory.replace('_', ' ')}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {post.visibility === "public" ? (
                              <><Globe className="h-3 w-3 mr-1" /> Public</>
                            ) : (
                              <><Lock className="h-3 w-3 mr-1" /> Members</>
                            )}
                          </Badge>
                        </div>
                        {isLocked ? (
                          <div className="relative">
                            {/* Blurred preview of content */}
                            <div className="blur-sm select-none pointer-events-none">
                              <p className="text-sm text-muted-foreground">
                                {(post.content || '').slice(0, 120)}...
                              </p>
                              {post.mediaUrl && post.mediaType === 'video' && (
                                <div className="mt-2 rounded-lg overflow-hidden bg-muted aspect-video max-w-md flex items-center justify-center">
                                  <svg className="w-12 h-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                              )}
                              {post.mediaUrl && post.mediaType === 'image' && (
                                <div className="mt-2 rounded-lg bg-muted max-w-md h-32" />
                              )}
                            </div>
                            {/* Paywall overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-md">
                              <Lock className="h-6 w-6 text-primary mb-2" />
                              <p className="text-sm font-medium text-center mb-1">Exclusive Content</p>
                              <p className="text-xs text-muted-foreground text-center mb-3 px-4">
                                Subscribe to {artistName}'s Fan Club to unlock
                              </p>
                              {tiers.length > 0 && (
                                <Button
                                  size="sm"
                                  className="gap-1.5"
                                  onClick={() => {
                                    if (!user) { toast.error('Please sign in to subscribe'); return; }
                                    setShowTierModal(true);
                                  }}
                                  disabled={joinTier.isPending}
                                >
                                  <Crown className="h-3.5 w-3.5" />
                                  Subscribe from ${((tiers[0] as any)?.priceCents || (tiers[0] as any)?.priceMonthly || 0) / 100}/mo
                                </Button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{post.content}</p>
                            {post.mediaUrl && post.mediaType === 'video' && (
                              <div className="mt-2 rounded-lg overflow-hidden bg-black aspect-video max-w-md">
                                <video src={post.mediaUrl} controls preload="metadata" className="w-full h-full object-contain" />
                              </div>
                            )}
                            {post.mediaUrl && post.mediaType === 'image' && (
                              <img src={post.mediaUrl} alt={post.title} className="mt-2 rounded-lg max-w-md max-h-64 object-contain" />
                            )}
                          </>
                        )}
                        {/* Like & Comment section for unlocked posts */}
                        {!isLocked && (
                          <div className="mt-3 pt-2 border-t">
                            <div className="flex items-center gap-4">
                              <button
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-red-500 transition-colors"
                                onClick={() => {
                                  if (!user) { toast.error('Please sign in to like posts'); return; }
                                  likePost.mutate({ postId: post.id });
                                }}
                                disabled={likePost.isPending}
                              >
                                <Heart className={`h-4 w-4 ${likesData?.[post.id]?.liked ? 'fill-red-500 text-red-500' : ''}`} />
                                <span>{likesData?.[post.id]?.count || 0}</span>
                              </button>
                              <button
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
                                onClick={() => setCommentingPostId(commentingPostId === post.id ? null : post.id)}
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span>Comment</span>
                              </button>
                            </div>
                            {/* Comment input */}
                            {commentingPostId === post.id && (
                              <div className="mt-2">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    className="flex-1 text-sm border rounded-md px-3 py-1.5 bg-background"
                                    maxLength={500}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && commentText.trim()) {
                                        addComment.mutate({ postId: post.id, content: commentText.trim() });
                                      }
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={!commentText.trim() || addComment.isPending}
                                    onClick={() => {
                                      if (commentText.trim()) {
                                        addComment.mutate({ postId: post.id, content: commentText.trim() });
                                      }
                                    }}
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                {/* Comments list */}
                                <CommentsSection postId={post.id} />
                              </div>
                            )}
                          </div>
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
            {posts.filter((post: any) => categoryFilter === 'all' || post.contentCategory === categoryFilter).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No content in this category yet.</p>
            )}
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

      {/* Tier Selection Checkout Modal */}
      {showTierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowTierModal(false)}>
          <div className="bg-background rounded-xl shadow-xl max-w-md w-full mx-4 p-6 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">Choose Your Tier</h3>
              </div>
              <button onClick={() => setShowTierModal(false)} className="text-muted-foreground hover:text-foreground">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Subscribe to {artistName}'s Fan Club and unlock exclusive content.</p>
            <div className="space-y-3">
              {tiers.map((tier: any) => {
                const price = (tier.priceCents || tier.priceMonthly || 0) / 100;
                return (
                  <div key={tier.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{tier.name}</h4>
                      <span className="text-primary font-bold">${price}/mo</span>
                    </div>
                    {tier.description && (
                      <p className="text-xs text-muted-foreground mb-3">{tier.description}</p>
                    )}
                    {tier.perks && (
                      <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                        {(typeof tier.perks === 'string' ? JSON.parse(tier.perks) : tier.perks || []).slice(0, 3).map((perk: string, i: number) => (
                          <li key={i} className="flex items-center gap-1.5">
                            <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setShowTierModal(false);
                        handleJoin(tier.id);
                      }}
                      disabled={joinTier.isPending && joiningTierId === tier.id}
                    >
                      {joinTier.isPending && joiningTierId === tier.id ? (
                        <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Processing...</>
                      ) : (
                        <>Subscribe — ${price}/mo</>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-4">Secure payment via Stripe. Cancel anytime.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for comments list with reply support
function CommentsSection({ postId }: { postId: number }) {
  const { user } = useAuth();
  const commentsQuery = trpc.fanClub.getPostComments.useQuery({ postId });
  const comments = commentsQuery.data || [];
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const addReply = trpc.fanClub.addComment.useMutation({
    onSuccess: () => {
      setReplyText('');
      setReplyingTo(null);
      commentsQuery.refetch();
      toast.success('Reply posted');
    },
    onError: (err: any) => toast.error(err.message || 'Failed to reply'),
  });

  if (comments.length === 0) return <p className="text-xs text-muted-foreground mt-2">No comments yet. Be the first!</p>;

  // Separate top-level comments and replies
  const topLevel = comments.filter((c: any) => !c.parentId);
  const replies = comments.filter((c: any) => c.parentId);
  const getReplies = (commentId: number) => replies.filter((r: any) => r.parentId === commentId);

  return (
    <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
      {topLevel.map((c: any) => (
        <div key={c.id}>
          <div className="flex items-start gap-2 text-sm">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs">{c.userName}</span>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{c.content}</p>
              {user && (
                <button
                  className="text-[10px] text-primary hover:underline mt-0.5"
                  onClick={() => setReplyingTo(replyingTo === c.id ? null : c.id)}
                >
                  Reply
                </button>
              )}
            </div>
          </div>
          {/* Replies */}
          {getReplies(c.id).length > 0 && (
            <div className="ml-4 mt-1 space-y-1 border-l-2 border-muted pl-2">
              {getReplies(c.id).map((r: any) => (
                <div key={r.id} className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[10px]">{r.userName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Reply input */}
          {replyingTo === c.id && (
            <div className="ml-4 mt-1 flex gap-1.5">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`Reply to ${c.userName}...`}
                className="flex-1 text-xs border rounded px-2 py-1 bg-background"
                maxLength={500}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && replyText.trim()) {
                    addReply.mutate({ postId, content: replyText.trim(), parentId: c.id });
                  }
                }}
              />
              <button
                className="text-xs text-primary font-medium px-2 py-1 hover:bg-muted rounded"
                disabled={!replyText.trim() || addReply.isPending}
                onClick={() => {
                  if (replyText.trim()) {
                    addReply.mutate({ postId, content: replyText.trim(), parentId: c.id });
                  }
                }}
              >
                Send
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
