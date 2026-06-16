import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Crown, FileText, Save, Globe, Eye, EyeOff, Plus, X, Loader2, ArrowLeft, Share2, Copy, Check, Info, Lightbulb, Rocket, Download, MonitorSmartphone, Edit3, Music, Mail, Phone, Award, BarChart3 } from 'lucide-react';
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

function formatNumber(num: number | string | null | undefined): string {
  if (!num) return '—';
  const n = typeof num === 'string' ? parseInt(num) : num;
  if (isNaN(n)) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

/* ─── Preview Component ─── */
function MediaKitPreview({ form, userName }: { form: any; userName: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" id="media-kit-preview">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-800 px-8 py-10 text-white">
        <div className="flex items-center gap-2 mb-2">
          <Music className="h-5 w-5" />
          <span className="text-sm font-medium opacity-80">MEDIA KIT</span>
        </div>
        <h1 className="text-3xl font-bold mb-1">{userName || 'Artist Name'}</h1>
        {form.genres.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {form.genres.map((genre: string, i: number) => (
              <span key={i} className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
                {genre}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="p-8 space-y-8">
        {/* Bio */}
        {form.bio && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-amber-600" /> About
            </h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{form.bio}</p>
          </div>
        )}

        {/* Stats */}
        {(form.monthlyListeners || form.totalStreams || form.averageEventAttendance) && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-600" /> Key Metrics
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {form.monthlyListeners && (
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-700">{formatNumber(form.monthlyListeners)}</p>
                  <p className="text-xs text-gray-600 mt-1">Monthly Listeners</p>
                </div>
              )}
              {form.totalStreams && (
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-700">{formatNumber(form.totalStreams)}</p>
                  <p className="text-xs text-gray-600 mt-1">Total Streams</p>
                </div>
              )}
              {form.averageEventAttendance && (
                <div className="text-center p-4 bg-amber-50 rounded-lg">
                  <p className="text-2xl font-bold text-amber-700">{formatNumber(form.averageEventAttendance)}</p>
                  <p className="text-xs text-gray-600 mt-1">Avg. Attendance</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Achievements */}
        {form.achievements.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-600" /> Notable Achievements
            </h2>
            <ul className="space-y-2">
              {form.achievements.map((achievement: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  {achievement}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact */}
        {(form.contactEmail || form.managementContact || form.bookingContact) && (
          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-amber-600" /> Contact
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {form.contactEmail && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Press / General</p>
                  <p className="text-sm text-gray-800">{form.contactEmail}</p>
                </div>
              )}
              {form.managementContact && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Management</p>
                  <p className="text-sm text-gray-800">{form.managementContact}</p>
                </div>
              )}
              {form.bookingContact && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">Booking</p>
                  <p className="text-sm text-gray-800">{form.bookingContact}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-100 pt-4 text-center">
          <p className="text-xs text-gray-400">Generated on Ologywood • ologywood.com</p>
        </div>
      </div>
    </div>
  );
}

export default function MediaKit() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const toastCtx = useToast();
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadPdf = async () => {
    setGeneratingPdf(true);
    try {
      // Generate a clean HTML string for PDF
      const artistName = user?.name || user?.email?.split('@')[0] || 'Artist';
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; line-height: 1.6; }
    .header { background: linear-gradient(135deg, #d97706, #92400e); color: white; padding: 48px 40px; }
    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
    .header .subtitle { font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .genres { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .genre-tag { background: rgba(255,255,255,0.2); color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; }
    .content { padding: 40px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 12px; border-bottom: 2px solid #f59e0b; padding-bottom: 6px; display: inline-block; }
    .bio { color: #374151; font-size: 14px; white-space: pre-wrap; }
    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .stat-card { text-align: center; padding: 20px; background: #fffbeb; border-radius: 8px; }
    .stat-value { font-size: 24px; font-weight: 700; color: #b45309; }
    .stat-label { font-size: 11px; color: #6b7280; margin-top: 4px; }
    .achievement { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 13px; color: #374151; }
    .achievement-dot { width: 6px; height: 6px; border-radius: 50%; background: #f59e0b; margin-top: 7px; flex-shrink: 0; }
    .contact-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .contact-item label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: 600; }
    .contact-item p { font-size: 13px; color: #1f2937; margin-top: 2px; }
    .footer { text-align: center; padding: 20px 40px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="header">
    <div class="subtitle">&#9835; MEDIA KIT</div>
    <h1>${artistName}</h1>
    ${form.genres.length > 0 ? `<div class="genres">${form.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}</div>` : ''}
  </div>
  <div class="content">
    ${form.bio ? `<div class="section"><div class="section-title">About</div><p class="bio">${form.bio.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p></div>` : ''}
    ${(form.monthlyListeners || form.totalStreams || form.averageEventAttendance) ? `
    <div class="section">
      <div class="section-title">Key Metrics</div>
      <div class="stats-grid">
        ${form.monthlyListeners ? `<div class="stat-card"><div class="stat-value">${formatNumber(form.monthlyListeners)}</div><div class="stat-label">Monthly Listeners</div></div>` : ''}
        ${form.totalStreams ? `<div class="stat-card"><div class="stat-value">${formatNumber(form.totalStreams)}</div><div class="stat-label">Total Streams</div></div>` : ''}
        ${form.averageEventAttendance ? `<div class="stat-card"><div class="stat-value">${formatNumber(form.averageEventAttendance)}</div><div class="stat-label">Avg. Attendance</div></div>` : ''}
      </div>
    </div>` : ''}
    ${form.achievements.length > 0 ? `
    <div class="section">
      <div class="section-title">Notable Achievements</div>
      ${form.achievements.map(a => `<div class="achievement"><div class="achievement-dot"></div><span>${a.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span></div>`).join('')}
    </div>` : ''}
    ${(form.contactEmail || form.managementContact || form.bookingContact) ? `
    <div class="section">
      <div class="section-title">Contact</div>
      <div class="contact-grid">
        ${form.contactEmail ? `<div class="contact-item"><label>Press / General</label><p>${form.contactEmail}</p></div>` : ''}
        ${form.managementContact ? `<div class="contact-item"><label>Management</label><p>${form.managementContact}</p></div>` : ''}
        ${form.bookingContact ? `<div class="contact-item"><label>Booking</label><p>${form.bookingContact}</p></div>` : ''}
      </div>
    </div>` : ''}
  </div>
  <div class="footer">Generated on Ologywood &bull; ologywood.com</div>
</body>
</html>`;

      // Use the browser's print-to-PDF via a new window
      const printWindow = window.open('', '_blank', 'width=800,height=1100');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
        toastCtx.addSuccess('PDF Ready', 'Use the print dialog to save as PDF.');
      } else {
        // Fallback: download as HTML
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${artistName.replace(/\s+/g, '_')}_Media_Kit.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toastCtx.addSuccess('Downloaded', 'Media kit downloaded as HTML. Open and print to PDF.');
      }
    } catch (err) {
      toastCtx.addError('Error', 'Could not generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(false);
    }
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
            {/* Preview / Edit Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              className={previewMode ? 'bg-amber-50 border-amber-300 text-amber-700' : ''}
            >
              {previewMode ? <Edit3 className="h-4 w-4 mr-1" /> : <MonitorSmartphone className="h-4 w-4 mr-1" />}
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            {/* PDF Download */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={generatingPdf}
            >
              {generatingPdf ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
              PDF
            </Button>
            {form.isPublic && (
              <Button variant="outline" size="sm" onClick={copyPublicLink}>
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </Button>
            )}
            {!previewMode && (
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : previewMode ? (
          /* ─── PREVIEW MODE ─── */
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
              <MonitorSmartphone className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700">
                <span className="font-medium">Preview Mode</span> — This is how your media kit appears to sponsors and press contacts who visit your public link.
              </p>
            </div>
            <div ref={previewRef}>
              <MediaKitPreview form={form} userName={user?.name || user?.email?.split('@')[0] || 'Artist'} />
            </div>
          </div>
        ) : (
          /* ─── EDIT MODE ─── */
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
                            <p className="text-xs text-gray-600">Click "Preview" to see how it looks to others</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                            <p className="text-xs text-gray-600">Download as PDF or share the public link</p>
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
