import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Crown, FileText, Save, Globe, Eye, EyeOff, Plus, X, Loader2, ArrowLeft, Share2, Copy, Check } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/components/ErrorToast';
import SiteHeader from '@/components/SiteHeader';

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
                      <p className="font-medium text-gray-900">{form.isPublic ? 'Public' : 'Private'}</p>
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
                <CardTitle className="text-lg">Artist Bio</CardTitle>
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
                <CardTitle className="text-lg">Key Stats</CardTitle>
                <CardDescription>Numbers that matter to sponsors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-700">Monthly Listeners</label>
                    <Input
                      type="number"
                      value={form.monthlyListeners}
                      onChange={(e) => setForm(prev => ({ ...prev, monthlyListeners: e.target.value }))}
                      placeholder="e.g., 50000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Total Streams</label>
                    <Input
                      type="number"
                      value={form.totalStreams}
                      onChange={(e) => setForm(prev => ({ ...prev, totalStreams: e.target.value }))}
                      placeholder="e.g., 1000000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Avg. Event Attendance</label>
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
                <CardTitle className="text-lg">Genres</CardTitle>
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
                <CardTitle className="text-lg">Notable Achievements</CardTitle>
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
                <CardTitle className="text-lg">Contact Information</CardTitle>
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
