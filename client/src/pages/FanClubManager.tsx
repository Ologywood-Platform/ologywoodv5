import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, Trash2, Edit2, Crown, Lock, Globe, Image, Loader2, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function FanClubManager() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  // Tiers
  const [showTierForm, setShowTierForm] = useState(false);
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [tierName, setTierName] = useState("");
  const [tierDescription, setTierDescription] = useState("");
  const [tierPrice, setTierPrice] = useState("");
  const [tierBenefits, setTierBenefits] = useState("");

  // Posts
  const [showPostForm, setShowPostForm] = useState(false);
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postVisibility, setPostVisibility] = useState<"public" | "members_only">("members_only");
  const [postMinTier, setPostMinTier] = useState<number | undefined>(undefined);

  const tiersQuery = trpc.fanClub.getMyTiers.useQuery(undefined, { enabled: !!user });
  const membersQuery = trpc.fanClub.getMyMembers.useQuery(undefined, { enabled: !!user });
  const postsQuery = trpc.fanClub.getMyPosts.useQuery(undefined, { enabled: !!user });

  const createTier = trpc.fanClub.createTier.useMutation({
    onSuccess: () => {
      toast.success("Tier created successfully!");
      resetTierForm();
      tiersQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to create tier"),
  });

  const updateTier = trpc.fanClub.updateTier.useMutation({
    onSuccess: () => {
      toast.success("Tier updated!");
      resetTierForm();
      tiersQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to update tier"),
  });

  const deleteTier = trpc.fanClub.deleteTier.useMutation({
    onSuccess: () => {
      toast.success("Tier deleted");
      tiersQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to delete tier"),
  });

  const createPost = trpc.fanClub.createPost.useMutation({
    onSuccess: () => {
      toast.success("Post published!");
      resetPostForm();
      postsQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to create post"),
  });

  const deletePost = trpc.fanClub.deletePost.useMutation({
    onSuccess: () => {
      toast.success("Post deleted");
      postsQuery.refetch();
    },
    onError: (err) => toast.error(err.message || "Failed to delete post"),
  });

  const resetTierForm = () => {
    setShowTierForm(false);
    setEditingTierId(null);
    setTierName("");
    setTierDescription("");
    setTierPrice("");
    setTierBenefits("");
  };

  const resetPostForm = () => {
    setShowPostForm(false);
    setPostTitle("");
    setPostContent("");
    setPostVisibility("members_only");
    setPostMinTier(undefined);
  };

  const handleCreateTier = () => {
    if (!tierName.trim()) { toast.error("Tier name is required"); return; }
    const priceNum = parseFloat(tierPrice);
    if (isNaN(priceNum) || priceNum < 1) { toast.error("Price must be at least $1.00"); return; }

    const benefits = tierBenefits.split("\n").filter(b => b.trim());

    if (editingTierId) {
      updateTier.mutate({
        tierId: editingTierId,
        name: tierName.trim(),
        description: tierDescription.trim() || undefined,
        perks: benefits,
      });
    } else {
      createTier.mutate({
        name: tierName.trim(),
        description: tierDescription.trim() || undefined,
        priceMonthly: Math.round(priceNum * 100),
        perks: benefits,
      });
    }
  };

  const handleEditTier = (tier: any) => {
    setEditingTierId(tier.id);
    setTierName(tier.name);
    setTierDescription(tier.description || "");
    setTierPrice((tier.priceMonthly / 100).toFixed(2));
    setTierBenefits((tier.benefits || []).join("\n"));
    setShowTierForm(true);
  };

  const handleCreatePost = () => {
    if (!postTitle.trim()) { toast.error("Post title is required"); return; }
    if (!postContent.trim()) { toast.error("Post content is required"); return; }

    createPost.mutate({
      title: postTitle.trim(),
      content: postContent.trim(),
      visibility: postVisibility,
      requiredTierId: postMinTier,
    });
  };

  const tiers = tiersQuery.data || [];
  const members = membersQuery.data || [];
  const posts = postsQuery.data || [];

  const totalMonthlyRevenue = members.reduce((sum, m) => {
    const tier = tiers.find(t => t.id === m.tierId);
    return sum + (tier?.priceMonthly || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              Fan Club Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your membership tiers, exclusive content, and fan community.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{members.length}</p>
                  <p className="text-sm text-muted-foreground">Active Members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">${(totalMonthlyRevenue / 100).toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Monthly Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Crown className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">{tiers.length}</p>
                  <p className="text-sm text-muted-foreground">Membership Tiers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Tiers</TabsTrigger>
            <TabsTrigger value="posts">Exclusive Content</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
          </TabsList>

          {/* Tiers Tab */}
          <TabsContent value="overview">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Membership Tiers</h2>
                <Button onClick={() => setShowTierForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> New Tier
                </Button>
              </div>

              {showTierForm && (
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-base">{editingTierId ? "Edit Tier" : "Create New Tier"}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="tierName">Tier Name *</Label>
                      <Input
                        id="tierName"
                        value={tierName}
                        onChange={(e) => setTierName(e.target.value)}
                        placeholder="e.g., VIP, Inner Circle, All Access"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tierDesc">Description</Label>
                      <Textarea
                        id="tierDesc"
                        value={tierDescription}
                        onChange={(e) => setTierDescription(e.target.value)}
                        placeholder="What members get at this tier..."
                        rows={2}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tierPrice">Monthly Price ($) *</Label>
                      <Input
                        id="tierPrice"
                        value={tierPrice}
                        onChange={(e) => setTierPrice(e.target.value)}
                        placeholder="5.00"
                        inputMode="decimal"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Minimum $1.00/month</p>
                    </div>
                    <div>
                      <Label htmlFor="tierBenefits">Benefits (one per line)</Label>
                      <Textarea
                        id="tierBenefits"
                        value={tierBenefits}
                        onChange={(e) => setTierBenefits(e.target.value)}
                        placeholder={"Exclusive behind-the-scenes content\nEarly access to tickets\nMonthly Q&A sessions\nMerch discounts"}
                        rows={4}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleCreateTier} disabled={createTier.isPending || updateTier.isPending}>
                        {(createTier.isPending || updateTier.isPending) ? (
                          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</>
                        ) : editingTierId ? "Save Changes" : "Create Tier"}
                      </Button>
                      <Button variant="outline" onClick={resetTierForm}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {tiers.length === 0 && !showTierForm ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Membership Tiers Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first tier to start building your fan community. Fans pay a monthly fee to access exclusive content and perks.
                    </p>
                    <Button onClick={() => setShowTierForm(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Create Your First Tier
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {tiers.map((tier) => (
                    <Card key={tier.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Crown className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{tier.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                ${(tier.priceMonthly / 100).toFixed(2)}/month
                                {tier.description && ` — ${tier.description}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {members.filter(m => m.tierId === tier.id).length} members
                            </Badge>
                            <Button variant="ghost" size="icon" onClick={() => handleEditTier(tier)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Delete this tier? Existing members will be notified.")) {
                                  deleteTier.mutate({ tierId: tier.id });
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        {tier.perks && tier.perks.length > 0 && (
                          <div className="mt-3 pl-13">
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {tier.perks.map((b: string, i: number) => (
                                <li key={i} className="flex items-center gap-2">
                                  <span className="text-primary">✓</span> {b}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Exclusive Content</h2>
                <Button onClick={() => setShowPostForm(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> New Post
                </Button>
              </div>

              {showPostForm && (
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="text-base">Create Post</CardTitle>
                    <CardDescription>Share exclusive content with your fan club members.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="postTitle">Title *</Label>
                      <Input
                        id="postTitle"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        placeholder="Post title..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postContent">Content *</Label>
                      <Textarea
                        id="postContent"
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Write your exclusive content here..."
                        rows={6}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">{postContent.length}/5000 characters</p>
                    </div>
                    <div>
                      <Label>Visibility</Label>
                      <div className="flex gap-3 mt-2">
                        <button
                          type="button"
                          onClick={() => setPostVisibility("public")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                            postVisibility === "public"
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          }`}
                        >
                          <Globe className="h-4 w-4" />
                          <span className="text-sm">Public</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPostVisibility("members_only")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                            postVisibility === "members_only"
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          }`}
                        >
                          <Lock className="h-4 w-4" />
                          <span className="text-sm">Members Only</span>
                        </button>
                      </div>
                    </div>
                    {postVisibility === "members_only" && tiers.length > 0 && (
                      <div>
                        <Label>Minimum Tier Required</Label>
                        <select
                          value={postMinTier || ""}
                          onChange={(e) => setPostMinTier(e.target.value ? Number(e.target.value) : undefined)}
                          className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                        >
                          <option value="">Any paid tier</option>
                          {tiers.map((tier) => (
                            <option key={tier.id} value={tier.id}>
                              {tier.name} (${(tier.priceMonthly / 100).toFixed(2)}/mo)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button onClick={handleCreatePost} disabled={createPost.isPending}>
                        {createPost.isPending ? (
                          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Publishing...</>
                        ) : "Publish Post"}
                      </Button>
                      <Button variant="outline" onClick={resetPostForm}>Cancel</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {posts.length === 0 && !showPostForm ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Posts Yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Share exclusive behind-the-scenes content, updates, and more with your fan club members.
                    </p>
                    <Button onClick={() => setShowPostForm(true)}>
                      <Plus className="h-4 w-4 mr-1" /> Create Your First Post
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Card key={post.id}>
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{post.title}</h3>
                              <Badge variant={post.visibility === "public" ? "secondary" : "default"} className="text-xs">
                                {post.visibility === "public" ? (
                                  <><Globe className="h-3 w-3 mr-1" /> Public</>
                                ) : (
                                  <><Lock className="h-3 w-3 mr-1" /> Members Only</>
                                )}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Delete this post?")) {
                                deletePost.mutate({ postId: post.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Fan Club Members</h2>
              {members.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No Members Yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Once fans join your tiers, they'll appear here. Share your profile to grow your community!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const tier = tiers.find(t => t.id === member.tierId);
                    return (
                      <Card key={member.id}>
                        <CardContent className="py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">Fan #{member.fanUserId}</p>
                                <p className="text-xs text-muted-foreground">
                                  Joined {new Date(member.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary">{tier?.name || "Unknown Tier"}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
