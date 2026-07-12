/**
 * Promote — AI Ad Assistant + Boost My Event
 * Two tabs:
 * 1. AI Ad Copy Generator (self-service) — generates platform-specific ad copy
 * 2. Boost My Event (managed service) — submit a request for hands-off promotion
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles, Megaphone, Copy, Download, Calculator, Send,
  Loader2, ArrowLeft, Instagram, Facebook, Clock, Target,
  DollarSign, TrendingUp, CheckCircle, AlertCircle
} from "lucide-react";
import { useToast } from "@/components/ErrorToast";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

type AdCopyResult = {
  headline: string;
  primaryCopy: string;
  hashtags: string[];
  callToAction: string;
  targetingTips: {
    age: string;
    interests: string[];
    locations: string;
  };
  creativeDirection: string;
  alternateVersions: string[];
};

export default function Promote() {
  const [, navigate] = useLocation();
  const toast = useToast();

  // AI Ad Copy state
  const [adType, setAdType] = useState<"event" | "release" | "profile">("event");
  const [adName, setAdName] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [adGenre, setAdGenre] = useState("");
  const [adLocation, setAdLocation] = useState("");
  const [adDate, setAdDate] = useState("");
  const [adPlatform, setAdPlatform] = useState<"instagram" | "facebook" | "tiktok" | "youtube" | "twitter">("instagram");
  const [adTone, setAdTone] = useState<"hype" | "professional" | "casual" | "urgent">("hype");
  const [adResult, setAdResult] = useState<AdCopyResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Budget Calculator state
  const [calcBudget, setCalcBudget] = useState(20);
  const [calcDays, setCalcDays] = useState(7);
  const [calcPlatform, setCalcPlatform] = useState<"instagram" | "facebook" | "tiktok" | "youtube" | "twitter">("instagram");
  const [calcLocation, setCalcLocation] = useState("");

  // Boost Request state
  const [boostType, setBoostType] = useState<"event" | "release" | "profile">("event");
  const [boostName, setBoostName] = useState("");
  const [boostBudget, setBoostBudget] = useState(100);
  const [boostGoals, setBoostGoals] = useState("");
  const [boostAudience, setBoostAudience] = useState("");
  const [boostPlatforms, setBoostPlatforms] = useState<string[]>(["instagram"]);
  const [boostTimeline, setBoostTimeline] = useState("7 days");
  const [boostNotes, setBoostNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateAdCopy = trpc.promote.generateAdCopy.useMutation();
  const budgetCalc = trpc.promote.calculateBudget.useQuery(
    { dailyBudget: calcBudget, days: calcDays, platform: calcPlatform, location: calcLocation || undefined },
    { enabled: calcBudget >= 5 && calcDays >= 1 }
  );
  const submitBoost = trpc.promote.submitBoostRequest.useMutation();
  const myRequests = trpc.promote.getMyRequests.useQuery();

  const handleGenerateAd = async () => {
    if (!adName.trim()) {
      toast.addError("Missing Info", "Please enter a name for what you're promoting.");
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateAdCopy.mutateAsync({
        type: adType,
        name: adName,
        description: adDescription || undefined,
        genre: adGenre || undefined,
        location: adLocation || undefined,
        date: adDate || undefined,
        platform: adPlatform,
        tone: adTone,
      });
      setAdResult(result);
      toast.addSuccess("Generated!", "Your ad copy is ready. Copy and use it!");
    } catch (error: any) {
      toast.addError("Generation Failed", error.message || "Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmitBoost = async () => {
    if (!boostName.trim() || !boostGoals.trim()) {
      toast.addError("Missing Info", "Please fill in the name and goals.");
      return;
    }
    if (boostBudget < 50) {
      toast.addError("Budget Too Low", "Minimum budget is $50.");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitBoost.mutateAsync({
        type: boostType,
        targetName: boostName,
        budget: boostBudget * 100, // convert to cents
        goals: boostGoals,
        targetAudience: boostAudience || undefined,
        platforms: boostPlatforms,
        timeline: boostTimeline || undefined,
        additionalNotes: boostNotes || undefined,
      });
      toast.addSuccess("Request Submitted!", "Our team will review your promotion request and get started.");
      setBoostName("");
      setBoostGoals("");
      setBoostAudience("");
      setBoostNotes("");
      myRequests.refetch();
    } catch (error: any) {
      toast.addError("Submission Failed", error.message || "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.addSuccess("Copied!", "Text copied to clipboard.");
  };

  const platformIcons: Record<string, string> = {
    instagram: "📸",
    facebook: "📘",
    tiktok: "🎵",
    youtube: "▶️",
    twitter: "🐦",
  };

  const statusColors: Record<string, string> = {
    submitted: "bg-yellow-100 text-yellow-800",
    in_review: "bg-blue-100 text-blue-800",
    in_progress: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-purple-600" />
            Promote
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Generate ad copy instantly with AI, or let our team run your campaign for you.
          </p>
        </div>

        <Tabs defaultValue="ai-generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="ai-generator" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> AI Generator
            </TabsTrigger>
            <TabsTrigger value="boost" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" /> Boost
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="flex items-center gap-1">
              <Clock className="h-4 w-4" /> My Requests
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB 1: AI AD COPY GENERATOR ===== */}
          <TabsContent value="ai-generator" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Input Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    AI Ad Copy Generator
                  </CardTitle>
                  <CardDescription>
                    Tell us what you're promoting and we'll generate ready-to-use ad copy.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>What are you promoting?</Label>
                    <Select value={adType} onValueChange={(v) => setAdType(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">An Event / Show</SelectItem>
                        <SelectItem value="release">A Music Release</SelectItem>
                        <SelectItem value="profile">My Profile</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Name *</Label>
                    <Input
                      placeholder={adType === "event" ? "e.g. Summer Jam 2026" : adType === "release" ? "e.g. My New Single" : "e.g. DJ Adonis"}
                      value={adName}
                      onChange={(e) => setAdName(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      placeholder="Brief description to help the AI write better copy..."
                      value={adDescription}
                      onChange={(e) => setAdDescription(e.target.value)}
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Genre/Category</Label>
                      <Input placeholder="e.g. R&B, Hip-Hop" value={adGenre} onChange={(e) => setAdGenre(e.target.value)} />
                    </div>
                    <div>
                      <Label>Location</Label>
                      <Input placeholder="e.g. Atlanta, GA" value={adLocation} onChange={(e) => setAdLocation(e.target.value)} />
                    </div>
                  </div>

                  {adType === "event" && (
                    <div>
                      <Label>Event Date</Label>
                      <Input type="date" value={adDate} onChange={(e) => setAdDate(e.target.value)} />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Platform</Label>
                      <Select value={adPlatform} onValueChange={(v) => setAdPlatform(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instagram">📸 Instagram</SelectItem>
                          <SelectItem value="facebook">📘 Facebook</SelectItem>
                          <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                          <SelectItem value="youtube">▶️ YouTube</SelectItem>
                          <SelectItem value="twitter">🐦 X / Twitter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Tone</Label>
                      <Select value={adTone} onValueChange={(v) => setAdTone(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hype">🔥 Hype / Exciting</SelectItem>
                          <SelectItem value="professional">💼 Professional</SelectItem>
                          <SelectItem value="casual">😎 Casual</SelectItem>
                          <SelectItem value="urgent">⚡ Urgent / FOMO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateAd}
                    disabled={isGenerating || !adName.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isGenerating ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Generate Ad Copy</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Results */}
              <div className="space-y-4">
                {adResult ? (
                  <>
                    <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {platformIcons[adPlatform]} Generated Copy
                          </CardTitle>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(`${adResult.headline}\n\n${adResult.primaryCopy}\n\n${adResult.hashtags.map(h => `#${h}`).join(" ")}`)}>
                            <Copy className="h-3 w-3 mr-1" /> Copy All
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-xs text-gray-500">HEADLINE</Label>
                          <p className="font-bold text-lg">{adResult.headline}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">AD COPY</Label>
                          <p className="whitespace-pre-wrap text-sm">{adResult.primaryCopy}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">HASHTAGS</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {adResult.hashtags.map((tag, i) => (
                              <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => copyToClipboard(`#${tag}`)}>
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">CALL TO ACTION</Label>
                          <p className="font-medium text-purple-700 dark:text-purple-300">{adResult.callToAction}</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-1">
                          <Target className="h-4 w-4" /> Targeting Suggestions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p><span className="font-medium">Age:</span> {adResult.targetingTips.age}</p>
                        <p><span className="font-medium">Location:</span> {adResult.targetingTips.locations}</p>
                        <p><span className="font-medium">Interests:</span> {adResult.targetingTips.interests.join(", ")}</p>
                        <p className="pt-2 text-gray-600 dark:text-gray-400"><span className="font-medium">Creative Direction:</span> {adResult.creativeDirection}</p>
                      </CardContent>
                    </Card>

                    {adResult.alternateVersions.length > 0 && (
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Alternate Versions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {adResult.alternateVersions.map((v, i) => (
                            <div key={i} className="flex items-start justify-between gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <p className="text-sm">{v}</p>
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(v)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                      <Sparkles className="h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-500 font-medium">Your generated ad copy will appear here</p>
                      <p className="text-gray-400 text-sm mt-1">Fill in the form and click Generate</p>
                    </CardContent>
                  </Card>
                )}

                {/* Budget Calculator */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-1">
                      <Calculator className="h-4 w-4" /> Ad Budget Calculator
                    </CardTitle>
                    <CardDescription className="text-xs">Estimate your reach based on budget</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-xs">$/day</Label>
                        <Input type="number" min={5} max={1000} value={calcBudget} onChange={(e) => setCalcBudget(Number(e.target.value))} />
                      </div>
                      <div>
                        <Label className="text-xs">Days</Label>
                        <Input type="number" min={1} max={90} value={calcDays} onChange={(e) => setCalcDays(Number(e.target.value))} />
                      </div>
                      <div>
                        <Label className="text-xs">Platform</Label>
                        <Select value={calcPlatform} onValueChange={(v) => setCalcPlatform(v as any)}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instagram">IG</SelectItem>
                            <SelectItem value="facebook">FB</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="youtube">YT</SelectItem>
                            <SelectItem value="twitter">X</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {budgetCalc.data && (
                      <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 space-y-1 text-sm">
                        <p className="font-medium">Total: ${budgetCalc.data.totalBudget}</p>
                        <p>Est. Reach: {budgetCalc.data.estimatedReach.low.toLocaleString()} – {budgetCalc.data.estimatedReach.high.toLocaleString()} people</p>
                        <p>Est. Engagements: {budgetCalc.data.estimatedEngagements.low.toLocaleString()} – {budgetCalc.data.estimatedEngagements.high.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 pt-1">{budgetCalc.data.recommendation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 2: BOOST MY EVENT ===== */}
          <TabsContent value="boost" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Boost My Event
                </CardTitle>
                <CardDescription>
                  Submit your promotion request and our team will handle everything — from ad creation to campaign management. Sit back and watch the results.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-2xl">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>What are you promoting? *</Label>
                    <Select value={boostType} onValueChange={(v) => setBoostType(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="event">An Event / Show</SelectItem>
                        <SelectItem value="release">A Music Release</SelectItem>
                        <SelectItem value="profile">My Profile / Brand</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Name *</Label>
                    <Input
                      placeholder="Name of your event, release, or profile"
                      value={boostName}
                      onChange={(e) => setBoostName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Budget ($) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        min={50}
                        className="pl-8"
                        value={boostBudget}
                        onChange={(e) => setBoostBudget(Number(e.target.value))}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Minimum $50. This covers ad spend + our management fee.</p>
                  </div>
                  <div>
                    <Label>Campaign Duration</Label>
                    <Select value={boostTimeline} onValueChange={setBoostTimeline}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3 days">3 Days</SelectItem>
                        <SelectItem value="7 days">7 Days</SelectItem>
                        <SelectItem value="14 days">14 Days</SelectItem>
                        <SelectItem value="30 days">30 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Goals * — What do you want to achieve?</Label>
                  <Textarea
                    placeholder="e.g. Sell 200 tickets to my show on Aug 15, get 1000 new followers, drive streams to my new single..."
                    value={boostGoals}
                    onChange={(e) => setBoostGoals(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Target Audience (optional)</Label>
                  <Textarea
                    placeholder="e.g. 18-35 year olds in Atlanta who like R&B, hip-hop, and live music"
                    value={boostAudience}
                    onChange={(e) => setBoostAudience(e.target.value)}
                    rows={2}
                  />
                </div>

                <div>
                  <Label>Platforms to advertise on *</Label>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {["instagram", "facebook", "tiktok", "youtube", "twitter"].map((p) => (
                      <label key={p} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={boostPlatforms.includes(p)}
                          onCheckedChange={(checked) => {
                            if (checked) setBoostPlatforms([...boostPlatforms, p]);
                            else setBoostPlatforms(boostPlatforms.filter((x) => x !== p));
                          }}
                        />
                        <span className="text-sm capitalize">{platformIcons[p]} {p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Additional Notes (optional)</Label>
                  <Textarea
                    placeholder="Any other details, links to assets, or preferences..."
                    value={boostNotes}
                    onChange={(e) => setBoostNotes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">How it works:</h4>
                  <ol className="text-sm text-purple-700 dark:text-purple-300 space-y-1 list-decimal list-inside">
                    <li>Submit your request with budget and goals</li>
                    <li>Our team reviews and creates your campaign (1-2 business days)</li>
                    <li>We run the ads on your selected platforms</li>
                    <li>You get a performance report when the campaign ends</li>
                  </ol>
                </div>

                <Button
                  onClick={handleSubmitBoost}
                  disabled={isSubmitting || !boostName.trim() || !boostGoals.trim() || boostBudget < 50}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isSubmitting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Submit Promotion Request — ${boostBudget}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== TAB 3: MY REQUESTS ===== */}
          <TabsContent value="my-requests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Promotion Requests</CardTitle>
                <CardDescription>Track the status of your managed promotion campaigns.</CardDescription>
              </CardHeader>
              <CardContent>
                {myRequests.data && myRequests.data.length > 0 ? (
                  <div className="space-y-3">
                    {myRequests.data.map((req: any) => (
                      <div key={req.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{req.targetName}</p>
                          <p className="text-sm text-gray-500">
                            {req.type} • ${(req.budget / 100).toFixed(0)} budget • {req.timeline || "No timeline"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            Submitted {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={statusColors[req.status] || "bg-gray-100"}>
                            {req.status.replace("_", " ")}
                          </Badge>
                          {req.reportUrl && (
                            <a href={req.reportUrl} target="_blank" rel="noopener" className="block text-xs text-purple-600 mt-1 underline">
                              View Report
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Megaphone className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                    <p>No promotion requests yet.</p>
                    <p className="text-sm">Submit a Boost request to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
