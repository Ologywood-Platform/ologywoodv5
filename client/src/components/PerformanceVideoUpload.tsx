import { useState, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Upload, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Crown, Loader2, X, ShieldCheck, Ban, FileVideo, Users } from 'lucide-react';
import { toast } from 'sonner';

interface PerformanceVideoUploadProps {
  onUpgradeClick?: () => void;
}

export function PerformanceVideoUpload({ onUpgradeClick }: PerformanceVideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    if (!uploading) setShowGuidelines(true);
  };

  const handleGuidelinesAccept = () => {
    setShowGuidelines(false);
    fileInputRef.current?.click();
  };

  const { data: videoStatus, refetch } = trpc.artist.getPerformanceVideoStatus.useQuery();
  const deleteMutation = trpc.artist.deletePerformanceVideo.useMutation({
    onSuccess: () => {
      toast.success('Performance video removed');
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete video');
    },
  });

  // Upload via multipart FormData to /api/video/upload with real progress tracking
  const uploadVideoFile = useCallback(async (file: File, durationSeconds: number) => {
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('video', file);
    formData.append('durationSeconds', String(Math.round(durationSeconds)));

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 90); // 0-90% for upload
          setUploadProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          toast.success('Video uploaded! It\'s now live on your profile.');
          refetch();
          resolve();
        } else {
          try {
            const resp = JSON.parse(xhr.responseText);
            toast.error(resp.error || 'Upload failed');
          } catch {
            toast.error('Upload failed');
          }
          reject(new Error('Upload failed'));
        }
        setUploading(false);
        setUploadProgress(0);
      });

      xhr.addEventListener('error', () => {
        toast.error('Network error during upload');
        setUploading(false);
        setUploadProgress(0);
        reject(new Error('Network error'));
      });

      xhr.addEventListener('abort', () => {
        toast.error('Upload cancelled');
        setUploading(false);
        setUploadProgress(0);
        reject(new Error('Upload cancelled'));
      });

      xhr.open('POST', '/api/video/upload');
      // Cookies are sent automatically (same origin)
      xhr.send(formData);
    });
  }, [refetch]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only MP4, MOV, and WebM videos are allowed');
      return;
    }

    // Validate file size (500MB max)
    if (file.size > 500 * 1024 * 1024) {
      toast.error('Video file must be under 500MB');
      return;
    }

    // Get video duration
    const duration = await getVideoDuration(file);
    if (duration > 300) {
      toast.error('Video must be 5 minutes or less');
      return;
    }

    try {
      await uploadVideoFile(file, duration);
    } catch {
      // Error already handled in uploadVideoFile
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadVideoFile]);

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => reject(new Error('Failed to load video metadata'));
      video.src = URL.createObjectURL(file);
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle className="h-3 w-3" /> Live
          </span>
        );
      case 'flagged':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <AlertCircle className="h-3 w-3" /> Under Review
          </span>
        );
      case 'taken_down':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <XCircle className="h-3 w-3" /> Removed
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Clock className="h-3 w-3" /> Processing
          </span>
        );
      default:
        return null;
    }
  };

  // Determine tier from the API response (user_subscriptions table)
  const effectiveTier = videoStatus?.tier || 'free';
  const isPaidTier = effectiveTier === 'starter' || effectiveTier === 'professional' || effectiveTier === 'enterprise';

  // Free tier — show upgrade prompt
  if (!isPaidTier) {
    return (
      <Card className="border-dashed border-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Performance Video</CardTitle>
          </div>
          <CardDescription>
            Upgrade your subscription to showcase a 5-minute performance video on your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Video className="h-12 w-12 mx-auto mb-3 text-purple-400 opacity-50" />
            <p className="text-sm text-muted-foreground mb-4">
              Starter and Professional tier artists can upload a performance video that appears on their public profile, helping venues see their talent in action.
            </p>
            <Button
              onClick={onUpgradeClick}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Paid tier — show upload/manage section
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Performance Video</CardTitle>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              <Crown className="h-3 w-3" /> {effectiveTier === 'enterprise' ? 'Enterprise' : effectiveTier === 'professional' ? 'Professional' : 'Starter'}
            </span>
          </div>
          {videoStatus?.status && getStatusBadge(videoStatus.status)}
        </div>
        <CardDescription>
          Upload a performance video (up to 5 min, max 500MB) to showcase on your profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        {videoStatus?.url ? (
          // Video exists — show preview and manage options
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
              <video
                src={videoStatus.url}
                controls
                className="w-full h-full object-contain"
                preload="metadata"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-muted-foreground">
                {videoStatus.duration && (
                  <span>Duration: {formatDuration(videoStatus.duration)}</span>
                )}
                {videoStatus.uploadedAt && (
                  <span className="ml-3">
                    Uploaded: {new Date(videoStatus.uploadedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Replace
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm('Remove your performance video?')) {
                      deleteMutation.mutate();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            </div>
            {videoStatus.status === 'rejected' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700 dark:text-red-300">
                  <p className="font-medium">Video was rejected</p>
                  <p className="mt-1">Please upload a new video that meets our community guidelines.</p>
                </div>
              </div>
            )}
            {videoStatus.status === 'flagged' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium">Under review</p>
                  <p className="mt-1">Your video has been flagged by the community and is being reviewed. It may be temporarily hidden from your profile.</p>
                </div>
              </div>
            )}
            {videoStatus.status === 'taken_down' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-700 dark:text-red-300">
                  <p className="font-medium">Video removed</p>
                  <p className="mt-1">Your video was removed for violating community guidelines. You can upload a new video that meets our standards.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // No video — show upload area
            <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={handleUploadClick}
          >
            {uploading ? (
              <div className="space-y-3">
                <Loader2 className="h-10 w-10 mx-auto text-primary animate-spin" />
                <p className="text-sm font-medium">Uploading video...</p>
                <div className="w-full max-w-xs mx-auto bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium mb-1">Click to upload your performance video</p>
                <p className="text-xs text-muted-foreground">
                  MP4, MOV, or WebM — Max 5 minutes, 500MB
                </p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={handleFileSelect}
        />
      </CardContent>

      {/* Video Guidelines Modal */}
      {showGuidelines && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowGuidelines(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-6 pt-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileVideo className="w-5 h-5 text-primary" />
                  Video Guidelines
                </h3>
                <button onClick={() => setShowGuidelines(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Please review these guidelines before uploading your performance video.
              </p>
            </div>

            <div className="px-6 py-4 space-y-5">
              {/* Allowed Content */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Allowed Content</h4>
                </div>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300 ml-6">
                  <li>Live performance recordings (concerts, gigs, showcases)</li>
                  <li>Music videos or demo reels of your work</li>
                  <li>DJ sets, spoken word, comedy, or other performance art</li>
                  <li>Rehearsal footage or behind-the-scenes clips</li>
                </ul>
              </div>

              {/* Prohibited Content */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Ban className="w-4 h-4 text-red-600" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Prohibited Content</h4>
                </div>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300 ml-6">
                  <li>Nudity, sexual content, or graphic violence</li>
                  <li>Hate speech, harassment, or discriminatory material</li>
                  <li>Copyrighted material you don't have rights to use</li>
                  <li>Spam, misleading content, or unrelated material</li>
                </ul>
              </div>

              {/* Format Requirements */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FileVideo className="w-4 h-4 text-blue-600" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Format Requirements</h4>
                </div>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300 ml-6">
                  <li>Formats: MP4, MOV, or WebM</li>
                  <li>Maximum duration: 5 minutes</li>
                  <li>Maximum file size: 500 MB</li>
                </ul>
              </div>

              {/* Community Policy */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Community Policy</h4>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 ml-6">
                  Videos go live immediately. Community members can report content that violates these guidelines. Videos flagged by multiple users will be reviewed and may be removed.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-900 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => setShowGuidelines(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleGuidelinesAccept}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                I Agree — Upload Video
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
