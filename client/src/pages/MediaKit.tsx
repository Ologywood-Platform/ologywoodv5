import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Crown, FileText, Save, Globe, Eye, EyeOff, Plus, X, Loader2, ArrowLeft, Share2, Copy, Check, Info, Lightbulb, Rocket } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/components/ErrorToast';
import SiteHeader from '@/components/SiteHeader';

function Tip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-1">
      <Info className="h-3.5 w-3.5 text-gray-400 hover:text-amber-600 cursor-help inline" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-60 p-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-white border-b border-r border-gray-200 rotate-45" />
      </div>
    </div>
  );
}

export default function MediaKit() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const toastCtx = useToast();
  const [copied, setCopied] = useState(false);

  const { data: mediaKit, isLoading, refetch } = (trpc.sponsor as any).getMyMediaKit.useQuery(undefined, {
    retry: false,
    enabled: !!user,
  });

  const updateMutation = (trpc.sponsor as any).updateMediaKit.useMutation({
    onSuccess: () => {
      toastCtx.addSuccess('Media Kit saved', 'Your media kit has been updated.');
      refetch();
    },
    onError: (err: any) => {
      toastCtx.addError('Error', err?.message || 'Could not save media kit.');
    },
  });

  const [form, setForm] = useState({
    bio: '',
    contactEmail: '',
    managementContact: '',
    bookingContact: '',
    monthlyListeners: '',
    totalStreams: '',
    averageEventAttendance: '',
    achievements: [] as string[],
    genres: [] as string[],
    isPublic: false,
  });

  const [newAchievement, setNewAchievement] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [showGettingStarted, setShowGettingStarted] = useState(true);

  useEffect(() => {
    if (mediaKit) {
      setForm({
        bio: mediaKit.bio || '',
        contactEmail: mediaKit.contactEmail || '',
        managementContact: mediaKit.managementContact || '',
        bookingContact: mediaKit.bookingContact || '',
        monthlyListeners: mediaKit.monthlyListeners?.toString() || '',
        totalStreams: mediaKit.totalStreams?.toString() || '',
        averageEventAttendance: mediaKit.averageEventAttendance?.toString() || '',
        achievements: mediaKit.achievements || [],
        genres: mediaKit.genres || [],
        isPublic: mediaKit.isPublic || false,
      });
      // Hide getting started if they've already filled in some data
      if (mediaKit.bio || mediaKit.contactEmail || (mediaKit.achievements && mediaKit.achievements.length > 0)) {
        setShowGettingStarted(false);
      }
    }
  }, [mediaKit]);

  const handleSave = () => {
    updateMutation.mutate({
      bio: form.bio || null,
      contactEmail: form.contactEmail || null,
      managementContact: form.managementContact || null,
      bookingContact: form.bookingContact || null,
      monthlyListeners: form.monthlyListeners ? parseInt(form.monthlyListeners) : null,
      totalStreams: form.totalStreams ? parseInt(form.totalStreams) : null,
      averageEventAttendance: form.averageEventAttendance ? parseInt(form.averageEventAttendance) : null,
      achievements: form.achievements,
      genres: form.genres,
      isPublic: form.isPublic,
    });
  };

  const addAchievement = () => {
    if (newAchievement.trim() && form.achievements.length < 20) {
      setForm(prev => ({ ...prev, achievements: [...prev.achievements, newAchievement.trim()] }));
      setNewAchievement('');
    }
  };

  const removeAchievement = (index: number) => {
    setForm(prev => ({ ...prev, achievements: prev.achievements.filter((_, i) => i !== index) }));
  };

  const addGenre = () => {
    if (newGenre.trim() && form.genres.length < 10) {
      setForm(prev => ({ ...prev, genres: [...prev.genres, newGenre.trim()] }));
      setNewGenre('');
    }
  };

  const removeGenre = (index: number) => {
    setForm(prev => ({ ...prev, genres: prev.genres.filter((_, i) => i !== index) }));
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/artist/${user?.id}/media-kit`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">Please log in to manage your media kit.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileText className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Media Kit</h1>
              <p className="text-sm text-gray-600">Auto-generated press kit for sponsors and media</p>
            </div>
          </div>
          <div className="flex gap-2">
            {form.isPublic && (
              <Button variant="outline" size="sm" onClick={copyPublicLink}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Getting Started Card */}
            {showGettingStarted && (
              <Card className="border-amber-200 bg-amber-50/30">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Rocket className="h-6 w-6 text-amber-500 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Welcome to Your Media Kit</h3>
                        <p className="text-sm text-gray-600 mb-3">
                          Your media kit is a professional one-page press sheet you can share with potential sponsors, labels, and press contacts.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                            <p className="text-xs text-gray-600">Fill in your bio, stats, and achievements below</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                            <p className="text-xs text-gray-600">Add your contact info for booking inquiries</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                            <p className="text-xs text-gray-600">Toggle to "Public" when ready to share</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                            <p className="text-xs text-gray-600">Copy the link and send to sponsors or press</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2 bg-white rounded p-2 border border-amber-100">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-gray-600"><span className="font-medium">Tip:</span> Keep your stats updated monthly. Sponsors look for growth trends, not just raw numbers.</p>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setShowGettingStarted(false)} className="text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Visibility Toggle */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {form.isPublic ? (
                      <Globe className="h-5 w-5 text-green-600" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {form.isPublic ? 'Public' : 'Private'}
                        <Tip text="When public, anyone with the link can view your media kit. Keep it private while you're still filling it in." />
                      </p>
                      <p className="text-xs text-gray-500">
                        {form.isPublic ? 'Anyone with the link can view your media kit' : 'Only you can see your media kit'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setForm(prev => ({ ...prev, isPublic: !prev.isPublic }))}
                  >
                    {form.isPublic ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                    {form.isPublic ? 'Make Private' : 'Make Public'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Artist Bio
                  <Tip text="Write in third person for a professional feel. Focus on your story, sound, and notable accomplishments. This is what press and sponsors will read first." />
                </CardTitle>
                <CardDescription>A professional bio for press and sponsors</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={form.bio}
                  onChange={(e) => setForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Write a professional bio for your media kit..."
                  rows={5}
                  maxLength={2000}
                  className="resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">{form.bio.length}/2000</p>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Key Stats
                  <Tip text="These numbers help sponsors evaluate your reach. Update them monthly for accuracy. Leave blank if you don't have the data yet." />
                </CardTitle>
                <CardDescription>Numbers that matter to sponsors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">
                      Monthly Listeners
                      <Tip text="From Spotify for Artists, Apple Music for Artists, or your primary streaming platform." />
                    </label>
                    <Input
                      type="number"
                      value={form.monthlyListeners}
                      onChange={(e) => setForm(prev => ({ ...prev, monthlyListeners: e.target.value }))}
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">
                      Total Streams
                      <Tip text="Combined streams across all platforms and releases. Check your distributor dashboard for this number." />
                    </label>
                    <Input
                      type="number"
                      value={form.totalStreams}
                      onChange={(e) => setForm(prev => ({ ...prev, totalStreams: e.target.value }))}
                      placeholder="e.g., 1000000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">
                      Avg. Event Attendance
                      <Tip text="Average number of people at your live shows. Sponsors care about in-person reach too." />
                    </label>
                    <Input
                      type="number"
                      value={form.averageEventAttendance}
                      onChange={(e) => setForm(prev => ({ ...prev, averageEventAttendance: e.target.value }))}
                      placeholder="e.g., 500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Genres */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Genres
                  <Tip text="Add your primary genres so sponsors can quickly understand your audience demographic. Be specific (e.g., 'Neo-Soul' rather than just 'R&B')." />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.genres.map((genre, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm">
                      {genre}
                      <button onClick={() => removeGenre(i)} className="hover:text-red-600">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                {form.genres.length < 10 && (
                  <div className="flex gap-2">
                    <Input
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                      placeholder="Add genre"
                      maxLength={50}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGenre())}
                    />
                    <Button variant="outline" size="sm" onClick={addGenre}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Notable Achievements
                  <Tip text="Include awards, chart positions, notable collaborations, festival appearances, press features, or streaming milestones. These build credibility with sponsors." />
                </CardTitle>
                <CardDescription>Awards, milestones, notable performances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-3">
                  {form.achievements.map((achievement, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded border border-gray-100">
                      <span className="flex-1 text-sm text-gray-800">{achievement}</span>
                      <button onClick={() => removeAchievement(i)} className="text-gray-400 hover:text-red-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {form.achievements.length < 20 && (
                  <div className="flex gap-2">
                    <Input
                      value={newAchievement}
                      onChange={(e) => setNewAchievement(e.target.value)}
                      placeholder="e.g., Performed at SXSW 2024"
                      maxLength={200}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                    />
                    <Button variant="outline" size="sm" onClick={addAchievement}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Contact Information
                  <Tip text="These contacts are shown on your public media kit page. Use professional emails — sponsors and press will reach out here." />
                </CardTitle>
                <CardDescription>How sponsors and media can reach you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Contact Email</label>
                    <Input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) => setForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                      placeholder="press@artist.com"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Management</label>
                    <Input
                      value={form.managementContact}
                      onChange={(e) => setForm(prev => ({ ...prev, managementContact: e.target.value }))}
                      placeholder="Manager name or email"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Booking</label>
                    <Input
                      value={form.bookingContact}
                      onChange={(e) => setForm(prev => ({ ...prev, bookingContact: e.target.value }))}
                      placeholder="Booking agent or email"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
