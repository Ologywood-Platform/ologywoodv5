import { useCallback, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Upload, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Crown, Loader2, X, ShieldCheck, Ban, FileVideo, Users, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { parsePortfolioVideoUrl } from '@shared/videoPortfolio';
import {
  PERFORMANCE_VIDEO_ACCEPT,
  PERFORMANCE_VIDEO_FORMAT_LABEL,
  PERFORMANCE_VIDEO_MAX_DURATION_SECONDS,
  PERFORMANCE_VIDEO_URL_HELP,
  getPerformanceVideoDurationError,
  getPerformanceVideoFileValidationError,
} from '@shared/performanceVideoUpload';
import {
  PORTFOLIO_VIDEO_READ_TIMEOUT_MS,
  getPortfolioUploadChunks,
  preparePortfolioVideoForBrowser,
  preparePortfolioVideoForServerConversion,
} from '@/lib/portfolioVideoUpload';
import {
  getPortfolioVideoSourceFormat,
  portfolioVideoRequiresConversion,
} from '@shared/videoPortfolioUpload';
import {
  finalizePerformanceUpload,
  startPerformanceUpload,
  uploadPerformanceChunk,
} from '@/lib/performanceVideoUpload';

interface PerformanceVideoUploadProps {
  onUpgradeClick?: () => void;
}

export function PerformanceVideoUpload({ onUpgradeClick }: PerformanceVideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'converting'>('uploading');
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showSourceOptions, setShowSourceOptions] = useState(false);
  const [sourceMode, setSourceMode] = useState<'url' | 'upload'>('url');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: videoStatus, refetch } = trpc.artist.getPerformanceVideoStatus.useQuery();
  const deleteMutation = trpc.artist.deletePerformanceVideo.useMutation({
    onSuccess: () => {
      toast.success('Performance video removed');
      resetSourceOptions();
      refetch();
    },
    onError: (err) => toast.error(err.message || 'Failed to delete video'),
  });
  const saveUrlMutation = trpc.artist.setPerformanceVideoByUrl.useMutation({
    onSuccess: async () => {
      toast.success('Performance video added! It is now live on your profile.');
      resetSourceOptions();
      await refetch();
    },
    onError: (err) => toast.error(err.message || 'Could not add this video URL'),
  });

  const resetSourceOptions = () => {
    setShowSourceOptions(false);
    setSourceMode('url');
    setVideoUrl('');
    setUploadFile(null);
    setUploadProgress(0);
    setUploadStage('uploading');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadClick = () => {
    if (!uploading && !saveUrlMutation.isPending) setShowGuidelines(true);
  };

  const handleGuidelinesAccept = () => {
    setShowGuidelines(false);
    setShowSourceOptions(true);
  };

  const handleAddByUrl = () => {
    const value = videoUrl.trim();
    if (!value) {
      toast.error('Please enter a video URL');
      return;
    }
    if (!parsePortfolioVideoUrl(value)) {
      toast.error(PERFORMANCE_VIDEO_URL_HELP);
      return;
    }
    saveUrlMutation.mutate({ videoUrl: value });
  };

  const getVideoDuration = (file: File): Promise<number> => new Promise((resolve, reject) => {
    const element = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      action();
    };
    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error('We could not read this video in time. Try an H.264/AAC MP4 file.')));
    }, PORTFOLIO_VIDEO_READ_TIMEOUT_MS);
    element.preload = 'metadata';
    element.onloadedmetadata = () => finish(() => resolve(element.duration));
    element.onerror = () => finish(() => reject(new Error('We could not read this video in your browser. Try an H.264/AAC MP4, or use AVI or MKV for secure conversion.')));
    element.src = objectUrl;
  });

  const createVideoThumbnail = (file: File, duration: number): Promise<Blob> => new Promise((resolve, reject) => {
    const element = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    element.preload = 'auto';
    element.muted = true;
    element.playsInline = true;
    let settled = false;
    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      URL.revokeObjectURL(objectUrl);
      action();
    };
    const timeout = window.setTimeout(() => {
      finish(() => reject(new Error('We could not create a thumbnail in time. Try an H.264/AAC MP4 file.')));
    }, PORTFOLIO_VIDEO_READ_TIMEOUT_MS);
    element.onerror = () => finish(() => reject(new Error('We could not create a thumbnail from this video. Try an H.264/AAC MP4, or use AVI or MKV for secure conversion.')));
    element.onloadedmetadata = () => {
      element.currentTime = Math.min(Math.max(duration * 0.25, 1), 15);
    };
    element.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 630;
      const context = canvas.getContext('2d');
      if (!context || !element.videoWidth || !element.videoHeight) {
        finish(() => reject(new Error('We could not create a thumbnail from this video.')));
        return;
      }
      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / element.videoWidth, canvas.height / element.videoHeight);
      const width = element.videoWidth * scale;
      const height = element.videoHeight * scale;
      context.drawImage(element, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
      canvas.toBlob((blob) => {
        if (blob) finish(() => resolve(blob));
        else finish(() => reject(new Error('We could not create a thumbnail from this video.')));
      }, 'image/jpeg', 0.88);
    };
    element.src = objectUrl;
  });

  const handleUpload = useCallback(async () => {
    if (!uploadFile) {
      toast.error('Please select a video file');
      return;
    }
    const fileValidationError = getPerformanceVideoFileValidationError(uploadFile);
    if (fileValidationError) {
      toast.error(fileValidationError);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadStage('uploading');
    try {
      const selectedFormat = getPortfolioVideoSourceFormat(uploadFile.name, uploadFile.type);
      if (!selectedFormat) throw new Error(`Choose ${PERFORMANCE_VIDEO_FORMAT_LABEL}.`);
      let requiresConversion = portfolioVideoRequiresConversion(selectedFormat) && selectedFormat !== 'mov';
      let sourceFormat = selectedFormat;
      let uploadSource = preparePortfolioVideoForServerConversion(uploadFile, selectedFormat).file;
      let duration = 0;
      let thumbnail: Blob | null = null;

      if (!requiresConversion) {
        const prepared = preparePortfolioVideoForBrowser(uploadFile);
        try {
          duration = await getVideoDuration(prepared.file);
          const durationError = getPerformanceVideoDurationError(duration);
          if (durationError) throw new Error(durationError);
          thumbnail = await createVideoThumbnail(prepared.file, duration);
          sourceFormat = prepared.relabeledMov ? 'mp4' : selectedFormat;
          uploadSource = preparePortfolioVideoForServerConversion(prepared.file, sourceFormat).file;
        } catch (error) {
          if (selectedFormat !== 'mov') throw error;
          requiresConversion = true;
          sourceFormat = 'mov';
          uploadSource = preparePortfolioVideoForServerConversion(uploadFile, 'mov').file;
          duration = 0;
          thumbnail = null;
        }
      }

      setUploadProgress(2);
      const session = await startPerformanceUpload({
        durationSeconds: Math.round(duration),
        sourceFormat,
        videoSize: uploadSource.size,
        thumbnailSize: thumbnail?.size || 0,
        videoMimeType: uploadSource.type,
        thumbnailMimeType: thumbnail?.type || '',
      });
      const videoChunks = getPortfolioUploadChunks(uploadSource, session.chunkBytes);
      const thumbnailChunks = thumbnail ? getPortfolioUploadChunks(thumbnail, session.chunkBytes) : [];
      if (videoChunks.length !== session.videoChunkCount || thumbnailChunks.length !== session.thumbnailChunkCount) {
        throw new Error('The Performance Video upload session did not match the selected files. Please retry.');
      }

      const totalBytes = uploadSource.size + (thumbnail?.size || 0);
      let completedBytes = 0;
      const uploadChunks = async (kind: 'video' | 'thumbnail', chunks: Blob[]) => {
        for (let index = 0; index < chunks.length; index += 1) {
          const chunk = chunks[index];
          await uploadPerformanceChunk({
            token: session.token,
            kind,
            index,
            chunk,
            onProgress: (loaded) => {
              const percent = 2 + Math.round(((completedBytes + loaded) / totalBytes) * 90);
              setUploadProgress(Math.min(92, percent));
            },
          });
          completedBytes += chunk.size;
        }
      };

      await uploadChunks('video', videoChunks);
      await uploadChunks('thumbnail', thumbnailChunks);
      setUploadProgress(95);
      if (requiresConversion || session.requiresConversion) setUploadStage('converting');
      await finalizePerformanceUpload(session.token);
      setUploadProgress(100);
      toast.success(requiresConversion ? 'Video converted and published on your profile' : 'Video uploaded! It is now live on your profile.');
      resetSourceOptions();
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Performance Video upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [uploadFile, refetch]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="h-3 w-3" /> Live</span>;
      case 'flagged':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"><AlertCircle className="h-3 w-3" /> Under Review</span>;
      case 'taken_down':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3" /> Removed</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"><XCircle className="h-3 w-3" /> Rejected</span>;
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"><Clock className="h-3 w-3" /> Processing</span>;
      default:
        return null;
    }
  };

  const effectiveTier = videoStatus?.tier || 'free';
  const isPaidTier = effectiveTier === 'starter' || effectiveTier === 'professional' || effectiveTier === 'enterprise';
  const isPending = uploading || saveUrlMutation.isPending;
  const source = videoStatus?.url ? parsePortfolioVideoUrl(videoStatus.url) : null;

  if (!isPaidTier) {
    return (
      <Card className="border-dashed border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
        <CardHeader>
          <div className="flex items-center gap-2"><Crown className="h-5 w-5 text-purple-600" /><CardTitle className="text-lg">Performance Video</CardTitle></div>
          <CardDescription>Upgrade your subscription to showcase a 5-minute performance video on your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Video className="h-12 w-12 mx-auto mb-3 text-purple-400 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">Starter, Professional, and Enterprise artists can add a performance video that appears on their public profile, helping venues see their talent in action.</p>
            <Button onClick={onUpgradeClick} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"><Crown className="h-4 w-4 mr-2" />Upgrade Now</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <Video className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Performance Video</CardTitle>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"><Crown className="h-3 w-3" /> {effectiveTier === 'enterprise' ? 'Enterprise' : effectiveTier === 'professional' ? 'Professional' : 'Starter'}</span>
          </div>
          {videoStatus?.status && getStatusBadge(videoStatus.status)}
        </div>
        <CardDescription>Paste a supported video URL or upload {PERFORMANCE_VIDEO_FORMAT_LABEL} (up to 5 minutes, max 500 MB)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {videoStatus?.url && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              {source?.embedUrl ? (
                <iframe
                  src={source.embedUrl}
                  title="Performance Video"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <video src={source?.normalizedUrl || videoStatus.url} controls className="w-full h-full object-contain" preload="metadata" playsInline poster={videoStatus.thumbnail || undefined} />
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                {videoStatus.duration && <span>Duration: {formatDuration(videoStatus.duration)}</span>}
                {videoStatus.uploadedAt && <span className="ml-3">Added: {new Date(videoStatus.uploadedAt).toLocaleDateString()}</span>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={handleUploadClick} disabled={isPending}><Upload className="h-4 w-4 mr-1" />Replace</Button>
                <Button variant="destructive" size="sm" onClick={() => { if (confirm('Remove your performance video?')) deleteMutation.mutate(); }} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4 mr-1" />Remove</Button>
              </div>
            </div>
          </div>
        )}

        {showSourceOptions ? (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={sourceMode === 'url' ? 'default' : 'outline'} onClick={() => setSourceMode('url')} disabled={isPending} className="gap-1"><LinkIcon className="h-3 w-3" />Paste URL</Button>
              <Button size="sm" variant={sourceMode === 'upload' ? 'default' : 'outline'} onClick={() => setSourceMode('upload')} disabled={isPending} className="gap-1"><Upload className="h-3 w-3" />Upload File</Button>
            </div>

            {sourceMode === 'url' ? (
              <div>
                <Label htmlFor="performanceVideoUrl">Video URL *</Label>
                <Input id="performanceVideoUrl" value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} placeholder="Paste a YouTube, Vimeo, or direct video link" className="mt-1" disabled={isPending} />
                <p className="text-xs text-muted-foreground mt-1">{PERFORMANCE_VIDEO_URL_HELP}</p>
              </div>
            ) : (
              <div>
                <Label htmlFor="performanceVideoFile">Video File * (max 500 MB)</Label>
                <Button type="button" variant="outline" className="mt-1 w-full justify-start gap-2" onClick={() => fileInputRef.current?.click()} disabled={isPending}><Upload className="h-4 w-4" />{uploadFile ? 'Choose a different video' : 'Choose video file'}</Button>
                <p className="text-xs text-muted-foreground mt-1">{uploadFile ? `${uploadFile.name} · ${(uploadFile.size / 1024 / 1024).toFixed(1)} MB` : `${PERFORMANCE_VIDEO_FORMAT_LABEL} · 5 minutes or less · 500 MB maximum`}</p>
                {uploadFile && (uploadFile.type === 'video/quicktime' || /\.mov$/i.test(uploadFile.name)) && <p className="text-xs text-muted-foreground mt-1">Browser-compatible MOV files are safely uploaded as MP4. If needed, OlogyWood will convert the video for reliable playback.</p>}
                {uploadFile && /\.(avi|mkv)$/i.test(uploadFile.name) && <p className="text-xs text-muted-foreground mt-1">OlogyWood will securely convert this file to a browser-ready MP4 and create its thumbnail after upload.</p>}
                {uploading && (
                  <div className="mt-3 space-y-1" aria-live="polite">
                    <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary transition-[width]" style={{ width: `${uploadProgress}%` }} /></div>
                    <p className="text-xs text-muted-foreground">{uploadStage === 'converting' ? 'Preparing a browser-ready MP4…' : `Uploading ${uploadProgress}%`}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
              <Button variant="ghost" onClick={resetSourceOptions} disabled={isPending}>Cancel</Button>
              <Button onClick={sourceMode === 'url' ? handleAddByUrl : handleUpload} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {sourceMode === 'url' ? 'Add Video' : uploadStage === 'converting' ? 'Converting…' : 'Upload Video'}
              </Button>
            </div>
          </div>
        ) : !videoStatus?.url ? (
          <button type="button" className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={handleUploadClick}>
            <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <span className="block text-sm font-medium mb-1">Add your performance video</span>
            <span className="block text-xs text-muted-foreground">Paste a supported URL or upload {PERFORMANCE_VIDEO_FORMAT_LABEL}</span>
          </button>
        ) : null}

        <input
          ref={fileInputRef}
          id="performanceVideoFile"
          type="file"
          accept={PERFORMANCE_VIDEO_ACCEPT}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            if (!file) { setUploadFile(null); return; }
            const error = getPerformanceVideoFileValidationError(file);
            if (error) {
              toast.error(error);
              setUploadFile(null);
              event.currentTarget.value = '';
              return;
            }
            setUploadFile(file);
          }}
        />

        {videoStatus?.status === 'rejected' && <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"><AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" /><div className="text-sm text-red-700 dark:text-red-300"><p className="font-medium">Video was rejected</p><p className="mt-1">Please add a new video that meets our community guidelines.</p></div></div>}
        {videoStatus?.status === 'flagged' && <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800"><AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" /><div className="text-sm text-yellow-700 dark:text-yellow-300"><p className="font-medium">Under review</p><p className="mt-1">Your video has been flagged by the community and is being reviewed. It may be temporarily hidden from your profile.</p></div></div>}
        {videoStatus?.status === 'taken_down' && <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800"><XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" /><div className="text-sm text-red-700 dark:text-red-300"><p className="font-medium">Video removed</p><p className="mt-1">Your video was removed for violating community guidelines. You can add a new video that meets our standards.</p></div></div>}
      </CardContent>

      {showGuidelines && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowGuidelines(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2"><FileVideo className="w-5 h-5 text-primary" />Video Guidelines</h3>
                <button onClick={() => setShowGuidelines(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close video guidelines"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please review these guidelines before uploading your performance video.</p>
            </div>

            <div className="px-6 py-4 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2"><ShieldCheck className="w-4 h-4 text-green-600" /><h4 className="text-sm font-semibold text-gray-900 dark:text-white">Allowed Content</h4></div>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300 ml-6"><li>Live performance recordings (concerts, gigs, showcases)</li><li>Music videos or demo reels of your work</li><li>DJ sets, spoken word, comedy, or other performance art</li><li>Rehearsal footage or behind-the-scenes clips</li></ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><Ban className="w-4 h-4 text-red-600" /><h4 className="text-sm font-semibold text-gray-900 dark:text-white">Prohibited Content</h4></div>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300 ml-6"><li>Nudity, sexual content, or graphic violence</li><li>Hate speech, harassment, or discriminatory material</li><li>Copyrighted material you don't have rights to use</li><li>Spam, misleading content, or unrelated material</li></ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><FileVideo className="w-4 h-4 text-blue-600" /><h4 className="text-sm font-semibold text-gray-900 dark:text-white">Format Requirements</h4></div>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300 ml-6"><li>Formats: MP4, MOV, WebM, AVI, or MKV</li><li>Maximum duration: 5 minutes</li><li>Maximum file size: 500 MB</li></ul>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-purple-600" /><h4 className="text-sm font-semibold text-gray-900 dark:text-white">Community Policy</h4></div>
                <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">Videos go live immediately. Community members can report content that violates these guidelines. Videos flagged by multiple users will be reviewed and may be removed.</p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button onClick={() => setShowGuidelines(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleGuidelinesAccept} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4" />I Agree — Upload Video</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
