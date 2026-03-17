import { useState, useRef, useCallback } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Video, Upload, Trash2, Clock, CheckCircle, XCircle, AlertCircle, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PerformanceVideoUploadProps {
  onUpgradeClick?: () => void;
}

export function PerformanceVideoUpload({ onUpgradeClick }: PerformanceVideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: videoStatus, refetch } = trpc.artist.getPerformanceVideoStatus.useQuery();
  const uploadMutation = trpc.artist.uploadPerformanceVideo.useMutation({
    onSuccess: () => {
      toast.success('Video uploaded! It will be reviewed by our team before going live on your profile.');
      refetch();
      setUploading(false);
      setUploadProgress(0);
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to upload video');
      setUploading(false);
      setUploadProgress(0);
    },
  });

  const deleteMutation = trpc.artist.deletePerformanceVideo.useMutation({
    onSuccess: () => {
      toast.success('Performance video removed');
      refetch();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to delete video');
    },
  });

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

    setUploading(true);
    setUploadProgress(10);

    // Read file as base64
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setUploadProgress(Math.round((event.loaded / event.total) * 50));
      }
    };
    reader.onload = async () => {
      setUploadProgress(60);
      try {
        const base64 = (reader.result as string).split(',')[1];
        setUploadProgress(70);
        await uploadMutation.mutateAsync({
          fileData: base64,
          fileName: file.name,
          mimeType: file.type,
          durationSeconds: Math.round(duration),
        });
        setUploadProgress(100);
      } catch {
        // Error handled by mutation
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read video file');
      setUploading(false);
      setUploadProgress(0);
    };
    reader.readAsDataURL(file);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [uploadMutation]);

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
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
            <Clock className="h-3 w-3" /> Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            <CheckCircle className="h-3 w-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
            <XCircle className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Determine tier from the API response (user_subscriptions table)
  const effectiveTier = videoStatus?.tier || 'free';
  const isPaidTier = effectiveTier === 'starter' || effectiveTier === 'professional';

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

  // Pro tier — show upload/manage section
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Performance Video</CardTitle>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              <Crown className="h-3 w-3" /> Pro
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
            <div className="flex items-center justify-between">
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
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
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
            {videoStatus.status === 'pending' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800">
                <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium">Under review</p>
                  <p className="mt-1">Your video is being reviewed by our team. It will appear on your profile once approved.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // No video — show upload area
          <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => !uploading && fileInputRef.current?.click()}
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
    </Card>
  );
}
