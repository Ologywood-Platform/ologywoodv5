/**
 * ContentReleases — Creator Commerce Content Release System
 * "OlogyWood is the business platform for creators. The content lives wherever the creator chooses."
 * Creators can create releases (movies, albums, courses, etc.) hosted externally and monetize them here.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, Edit, Trash2, Eye, EyeOff, Loader2, DollarSign, ArrowLeft,
  ExternalLink, Film, Music, Mic, BookOpen, Video, Globe, Play
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import SiteHeader from "@/components/SiteHeader";
import PageBreadcrumb from '@/components/PageBreadcrumb';

// Release type icons
function getReleaseTypeIcon(type: string) {
  switch (type) {
    case 'movie': case 'documentary': case 'short_film': case 'web_series':
      return <Film className="h-4 w-4" />;
    case 'concert': case 'livestream':
      return <Video className="h-4 w-4" />;
    case 'podcast_episode': case 'interview':
      return <Mic className="h-4 w-4" />;
    case 'album': case 'music_video':
      return <Music className="h-4 w-4" />;
    case 'course': case 'masterclass':
      return <BookOpen className="h-4 w-4" />;
    default:
      return <Play className="h-4 w-4" />;
  }
}

// Access model badges
function getAccessBadge(model: string) {
  switch (model) {
    case 'free': return <Badge variant="secondary">✅ Free</Badge>;
    case 'ticketed': return <Badge className="bg-amber-100 text-amber-800">🎟 Ticketed</Badge>;
    case 'fan_club_only': return <Badge className="bg-purple-100 text-purple-800">⭐ Fan Club Only</Badge>;
    case 'pay_what_you_want': return <Badge className="bg-green-100 text-green-800">💰 Pay What You Want</Badge>;
    case 'unlock_after_purchase': return <Badge className="bg-blue-100 text-blue-800">🔓 Unlock After Purchase</Badge>;
    default: return <Badge variant="outline">{model}</Badge>;
  }
}

// Hosting platform labels
function getPlatformLabel(platform: string) {
  const map: Record<string, string> = {
    youtube: 'YouTube', vimeo: 'Vimeo', twitch: 'Twitch', spotify: 'Spotify',
    apple_podcasts: 'Apple Podcasts', soundcloud: 'SoundCloud',
    personal_website: 'Personal Website', other: 'Other',
  };
  return map[platform] || platform;
}

export default function ContentReleases() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Fetch releases
  const { data: releases, isLoading, refetch } = trpc.contentRelease.myReleases.useQuery(undefined, {
    enabled: !!user,
  });

  // Fetch options
  const { data: options } = trpc.contentRelease.getOptions.useQuery();

  // Mutations
  const createMutation = trpc.contentRelease.create.useMutation({
    onSuccess: () => { toast.success("Release created!"); refetch(); setShowCreateForm(false); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.contentRelease.update.useMutation({
    onSuccess: () => { toast.success("Release updated!"); refetch(); setEditingId(null); resetForm(); },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.contentRelease.delete.useMutation({
    onSuccess: () => { toast.success("Release deleted"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [releaseType, setReleaseType] = useState("movie");
  const [genre, setGenre] = useState("");
  const [duration, setDuration] = useState("");
  const [hostingPlatform, setHostingPlatform] = useState("youtube");
  const [contentUrl, setContentUrl] = useState("");
  const [accessModel, setAccessModel] = useState("free");
  const [price, setPrice] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [includesLiveQA, setIncludesLiveQA] = useState(false);
  const [includesBonusContent, setIncludesBonusContent] = useState(false);
  const [bonusContentDescription, setBonusContentDescription] = useState("");

  function resetForm() {
    setTitle(""); setDescription(""); setReleaseType("movie"); setGenre("");
    setDuration(""); setHostingPlatform("youtube"); setContentUrl("");
    setAccessModel("free"); setPrice(""); setMinPrice(""); setIsPublished(false);
    setIncludesLiveQA(false); setIncludesBonusContent(false); setBonusContentDescription("");
  }

  function startEdit(release: any) {
    setEditingId(release.id);
    setTitle(release.title);
    setDescription(release.description || "");
    setReleaseType(release.releaseType);
    setGenre(release.genre || "");
    setDuration(release.duration || "");
    setHostingPlatform(release.hostingPlatform);
    setContentUrl(release.contentUrl);
    setAccessModel(release.accessModel);
    setPrice(release.price ? String(parseFloat(release.price)) : "");
    setMinPrice(release.minPrice ? String(parseFloat(release.minPrice)) : "");
    setIsPublished(release.isPublished);
    setIncludesLiveQA(release.includesLiveQA);
    setIncludesBonusContent(release.includesBonusContent);
    setBonusContentDescription(release.bonusContentDescription || "");
    setShowCreateForm(true);
  }

  function handleSubmit() {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!contentUrl.trim()) { toast.error("Content URL is required"); return; }
    try { new URL(contentUrl); } catch { toast.error("Please enter a valid URL"); return; }

    const data = {
      title: title.trim(),
      description: description.trim() || undefined,
      releaseType,
      genre: genre.trim() || undefined,
      duration: duration.trim() || undefined,
      hostingPlatform,
      contentUrl: contentUrl.trim(),
      accessModel,
      price: price ? parseFloat(price) : undefined,
      minPrice: minPrice ? parseFloat(minPrice) : undefined,
      isPublished,
      includesLiveQA,
      includesBonusContent,
      bonusContentDescription: bonusContentDescription.trim() || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center"><p>Please log in.</p></div>;
  }

  // ===== CREATE/EDIT FORM =====
  if (showCreateForm) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <PageBreadcrumb className="mb-4" segments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Content Releases', href: '/content-releases' },
            { label: editingId ? 'Edit Release' : 'New Release' },
          ]} />

          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => { setShowCreateForm(false); setEditingId(null); resetForm(); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{editingId ? 'Edit Release' : 'Create New Release'}</h1>
              <p className="text-sm text-muted-foreground">Your content lives wherever you choose. OlogyWood powers the business.</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Content Info */}
            <Card>
              <CardHeader>
                <CardTitle>Content Details</CardTitle>
                <CardDescription>What are you releasing?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title *</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Summer Vibes Documentary" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell your audience what this release is about..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Release Type *</Label>
                    <select className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" value={releaseType} onChange={(e) => setReleaseType(e.target.value)}>
                      {(options?.releaseTypes || []).map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Genre</Label>
                    <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="e.g., Hip-Hop, Drama" />
                  </div>
                </div>
                <div>
                  <Label>Duration</Label>
                  <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g., 1h 45m, 3 episodes, 12 tracks" />
                </div>
              </CardContent>
            </Card>

            {/* Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribution Channel</CardTitle>
                <CardDescription>Where is your content hosted?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Hosting Platform *</Label>
                  <select className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm" value={hostingPlatform} onChange={(e) => setHostingPlatform(e.target.value)}>
                    {(options?.hostingPlatforms || []).map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Content URL *</Label>
                  <Input value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                  <p className="text-xs text-muted-foreground mt-1">Paste the link where your content lives</p>
                </div>
              </CardContent>
            </Card>

            {/* Monetization */}
            <Card>
              <CardHeader>
                <CardTitle>How do you want to monetize this release?</CardTitle>
                <CardDescription>Choose your business model</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(options?.accessModels || []).map((model) => (
                    <button
                      key={model.value}
                      type="button"
                      onClick={() => setAccessModel(model.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        accessModel === model.value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <span className="text-lg mr-2">{model.icon}</span>
                      <span className="font-medium text-sm">{model.label}</span>
                      <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
                    </button>
                  ))}
                </div>

                {(accessModel === 'ticketed' || accessModel === 'unlock_after_purchase') && (
                  <div>
                    <Label>Price (USD) *</Label>
                    <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="9.99" />
                  </div>
                )}
                {accessModel === 'pay_what_you_want' && (
                  <div>
                    <Label>Minimum Price (USD)</Label>
                    <Input type="number" min="0" step="0.01" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0.00 (optional)" />
                    <p className="text-xs text-muted-foreground mt-1">Leave at 0 for truly pay-what-you-want</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Extras */}
            <Card>
              <CardHeader>
                <CardTitle>Extras</CardTitle>
                <CardDescription>Add value to your release</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={includesLiveQA} onChange={(e) => setIncludesLiveQA(e.target.checked)} className="rounded" />
                  <span className="text-sm">🎤 Includes Live Q&A</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={includesBonusContent} onChange={(e) => setIncludesBonusContent(e.target.checked)} className="rounded" />
                  <span className="text-sm">🎁 Includes Digital Bonus Content</span>
                </label>
                {includesBonusContent && (
                  <div className="ml-7">
                    <Input value={bonusContentDescription} onChange={(e) => setBonusContentDescription(e.target.value)} placeholder="Describe the bonus content..." />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Publish */}
            <Card>
              <CardContent className="pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="rounded" />
                  <div>
                    <span className="text-sm font-medium">Publish immediately</span>
                    <p className="text-xs text-muted-foreground">Make this release visible on your public profile</p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="flex-1">
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</>
                ) : editingId ? 'Update Release' : 'Create Release'}
              </Button>
              <Button variant="outline" onClick={() => { setShowCreateForm(false); setEditingId(null); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===== LIST VIEW =====
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <PageBreadcrumb className="mb-4" segments={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Content Releases' },
        ]} />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Content Releases</h1>
            <p className="text-sm text-muted-foreground">Monetize your content — movies, albums, courses, and more</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Release
          </Button>
        </div>

        {/* Help Tips Banner */}
        {(!releases || releases.length < 3) && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100 mb-2">How Content Releases Work</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-purple-800 dark:text-purple-200">
              <div className="flex items-start gap-2">
                <span className="text-base">1&#xFE0F;&#x20E3;</span>
                <span><strong>Host anywhere</strong> — Keep your content on YouTube, Vimeo, Spotify, or your own site.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">2&#xFE0F;&#x20E3;</span>
                <span><strong>Set your price</strong> — Choose free, ticketed, fan-club-only, or pay-what-you-want.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-base">3&#xFE0F;&#x20E3;</span>
                <span><strong>Fans pay here</strong> — OlogyWood handles ticketing, access, and payments. You keep the revenue.</span>
              </div>
            </div>
            <p className="text-[11px] text-purple-600 dark:text-purple-300 mt-2 italic">Tip: Use an unlisted YouTube link for ticketed releases — fans only get the link after purchase.</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !releases || releases.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Releases Yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                Create your first content release. Your content stays where it performs best — YouTube, Vimeo, Spotify, or anywhere else. OlogyWood handles the business.
              </p>
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="h-4 w-4" /> Create Your First Release
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {releases.map((release: any) => (
              <Card key={release.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {getReleaseTypeIcon(release.releaseType)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm truncate">{release.title}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {getAccessBadge(release.accessModel)}
                          <Badge variant="outline" className="text-[10px]">
                            {getPlatformLabel(release.hostingPlatform)}
                          </Badge>
                          {release.isPublished ? (
                            <Badge className="bg-green-100 text-green-800 text-[10px]"><Eye className="h-3 w-3 mr-1" /> Published</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]"><EyeOff className="h-3 w-3 mr-1" /> Draft</Badge>
                          )}
                        </div>
                        {release.price && parseFloat(release.price) > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <DollarSign className="h-3 w-3 inline" />{parseFloat(release.price).toFixed(2)}
                            {release.purchaseCount > 0 && ` · ${release.purchaseCount} sales`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => window.open(release.contentUrl, '_blank')}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => startEdit(release)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                        if (confirm('Delete this release?')) deleteMutation.mutate({ id: release.id });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
