import { useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Plus, Trash2, Link, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PORTFOLIO_VIDEO_URL_HELP } from '@shared/videoPortfolio';
import {
  PORTFOLIO_VIDEO_ACCEPT,
  PORTFOLIO_VIDEO_FORMAT_LABEL,
  PORTFOLIO_VIDEO_MAX_DURATION_SECONDS,
  formatPortfolioDuration,
  getPortfolioFileValidationError,
  getPortfolioVideoSourceFormat,
  portfolioVideoRequiresConversion,
} from '@shared/videoPortfolioUpload';
import {
  PORTFOLIO_VIDEO_READ_TIMEOUT_MS,
  finalizePortfolioUpload,
  getPortfolioUploadChunks,
  preparePortfolioVideoForBrowser,
  preparePortfolioVideoForServerConversion,
  startPortfolioUpload,
  uploadPortfolioChunk,
} from '@/lib/portfolioVideoUpload';

const VIDEO_CATEGORIES = [
  { value: 'highlights', label: 'Highlights', color: 'bg-amber-100 text-amber-800' },
  { value: 'training', label: 'Training', color: 'bg-blue-100 text-blue-800' },
  { value: 'game_day', label: 'Game Day', color: 'bg-green-100 text-green-800' },
  { value: 'behind_the_scenes', label: 'Behind the Scenes', color: 'bg-purple-100 text-purple-800' },
  { value: 'live_performance', label: 'Live Performance', color: 'bg-red-100 text-red-800' },
  { value: 'studio', label: 'Studio', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'music_video', label: 'Music Video', color: 'bg-pink-100 text-pink-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' },
] as const;

const VISUAL_ART_VIDEO_CATEGORIES = [
  { value: 'highlights', label: 'Exhibition Highlights', color: 'bg-amber-100 text-amber-800' },
  { value: 'behind_the_scenes', label: 'Creative Process', color: 'bg-purple-100 text-purple-800' },
  { value: 'studio', label: 'Studio Practice', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' },
] as const;

const AUTHOR_VIDEO_CATEGORIES = [
  { value: 'highlights', label: 'Reading or Book Event', color: 'bg-amber-100 text-amber-800' },
  { value: 'behind_the_scenes', label: 'Writing Process', color: 'bg-purple-100 text-purple-800' },
  { value: 'studio', label: 'Author Interview', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' },
] as const;

type VideoCategory = typeof VIDEO_CATEGORIES[number]['value'];

export function VideoPortfolioManager({ talentType }: { talentType?: string }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<'url' | 'upload'>('url');
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState<VideoCategory>('highlights');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'converting'>('uploading');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: videos = [], isLoading } = trpc.artist.getMyVideoPortfolio.useQuery();

  const addVideo = trpc.artist.addPortfolioVideo.useMutation({
    onSuccess: () => {
      toast.success("Video added to portfolio!");
      resetForm();
      utils.artist.getMyVideoPortfolio.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeVideo = trpc.artist.removePortfolioVideo.useMutation({
    onSuccess: () => {
      toast.success("Video removed from portfolio");
      utils.artist.getMyVideoPortfolio.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetForm = () => {
    setTitle("");
    setVideoUrl("");
    setCategory('highlights');
    setUploadFile(null);
    setUploadProgress(0);
    setUploadStage('uploading');
    setShowAddForm(false);
    setAddMode('url');
  };

  const handleAddByUrl = () => {
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    if (!videoUrl.trim()) { toast.error("Please enter a video URL"); return; }
    addVideo.mutate({ title: title.trim(), videoUrl: videoUrl.trim(), category });
  };

  const handleUpload = async () => {
    if (!title.trim()) { toast.error("Please enter a title"); return; }
    if (!uploadFile) { toast.error("Please select a video file"); return; }
    const fileValidationError = getPortfolioFileValidationError(uploadFile);
    if (fileValidationError) { toast.error(fileValidationError); return; }

    setUploading(true);
    setUploadProgress(0);
    setUploadStage('uploading');
    try {
      const selectedFormat = getPortfolioVideoSourceFormat(uploadFile.name, uploadFile.type);
      if (!selectedFormat) throw new Error(`Choose ${PORTFOLIO_VIDEO_FORMAT_LABEL}.`);
      let requiresConversion = portfolioVideoRequiresConversion(selectedFormat) && selectedFormat !== 'mov';
      let sourceFormat = selectedFormat;
      let uploadSource = preparePortfolioVideoForServerConversion(uploadFile, selectedFormat).file;
      let duration = 0;
      let thumbnail: Blob | null = null;

      if (!requiresConversion) {
        const prepared = preparePortfolioVideoForBrowser(uploadFile);
        try {
          duration = await getVideoDuration(prepared.file);
          if (duration > PORTFOLIO_VIDEO_MAX_DURATION_SECONDS) {
            throw new Error(`This video is ${formatPortfolioDuration(duration)}. Video Portfolio clips must be 2:00 or shorter.`);
          }
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
      const session = await startPortfolioUpload({
        title: title.trim(),
        category,
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
        throw new Error('The video upload session did not match the selected files. Please retry.');
      }

      const totalBytes = uploadSource.size + (thumbnail?.size || 0);
      let completedBytes = 0;
      const uploadChunks = async (kind: 'video' | 'thumbnail', chunks: Blob[]) => {
        for (let index = 0; index < chunks.length; index += 1) {
          const chunk = chunks[index];
          await uploadPortfolioChunk({
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
      await finalizePortfolioUpload(session.token);
      setUploadProgress(100);

      toast.success(requiresConversion ? 'Video converted and added to your portfolio' : 'Video uploaded and added to your portfolio');
      resetForm();
      await utils.artist.getMyVideoPortfolio.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Portfolio video upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
    element.onloadedmetadata = () => {
      finish(() => resolve(element.duration));
    };
    element.onerror = () => {
      finish(() => reject(new Error('We could not read this video in your browser. Try an H.264/AAC MP4, or use AVI or MKV for secure conversion.')));
    };
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
    element.onerror = () => {
      finish(() => reject(new Error('We could not create a thumbnail from this video. Try an H.264/AAC MP4, or use AVI or MKV for secure conversion.')));
    };
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

  // Filter categories based on talent type
  const relevantCategories = talentType === 'athlete'
    ? VIDEO_CATEGORIES.filter(c => ['highlights', 'training', 'game_day', 'behind_the_scenes', 'other'].includes(c.value))
    : talentType === 'artist'
    ? VIDEO_CATEGORIES.filter(c => ['highlights', 'live_performance', 'studio', 'music_video', 'behind_the_scenes', 'other'].includes(c.value))
    : talentType === 'visual_artist'
    ? [...VISUAL_ART_VIDEO_CATEGORIES]
    : talentType === 'author_writer'
    ? [...AUTHOR_VIDEO_CATEGORIES]
    : VIDEO_CATEGORIES;

  const getCategoryInfo = (cat: string) => {
    return relevantCategories.find(c => c.value === cat) || VIDEO_CATEGORIES[VIDEO_CATEGORIES.length - 1];
  };

  const isPending = addVideo.isPending || uploading;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Video Portfolio</CardTitle>
            <Badge variant="secondary" className="text-xs">{(videos as any[]).length}/10</Badge>
          </div>
          {!showAddForm && (videos as any[]).length < 10 && (
            <Button size="sm" variant="outline" onClick={() => setShowAddForm(true)} className="gap-1">
              <Plus className="h-4 w-4" /> Add Video
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Add up to 10 short clips (2 minutes or less) to showcase your work. Paste a YouTube or Vimeo link, or upload MP4, MOV, WebM, AVI, or MKV.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <input
              ref={fileInputRef}
              id="videoFile"
              type="file"
              accept={PORTFOLIO_VIDEO_ACCEPT}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (!file) { setUploadFile(null); return; }
                const error = getPortfolioFileValidationError(file);
                if (error) {
                  toast.error(error);
                  setUploadFile(null);
                  e.currentTarget.value = '';
                  return;
                }
                setUploadFile(file);
              }}
              className="sr-only"
            />
            <div className="flex gap-2 mb-3">
              <Button
                size="sm"
                variant={addMode === 'url' ? 'default' : 'outline'}
                onClick={() => setAddMode('url')}
                className="gap-1"
              >
                <Link className="h-3 w-3" /> Paste URL
              </Button>
              <Button
                size="sm"
                variant={addMode === 'upload' ? 'default' : 'outline'}
                onClick={() => {
                  setAddMode('upload');
                  fileInputRef.current?.click();
                }}
                className="gap-1"
              >
                <Upload className="h-3 w-3" /> Upload File
              </Button>
            </div>

            <div>
              <Label htmlFor="videoTitle">Title *</Label>
              <Input
                id="videoTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Season Highlights 2025"
                className="mt-1"
              />
            </div>

            {addMode === 'url' ? (
              <div>
                <Label htmlFor="videoUrl">Video URL *</Label>
                <Input
                  id="videoUrl"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="Paste a YouTube, Vimeo, or direct video link"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">{PORTFOLIO_VIDEO_URL_HELP}</p>
              </div>
            ) : (
              <div>
                <Label htmlFor="videoFile">Video File * (max 100MB)</Label>
                <Button type="button" variant="outline" className="mt-1 w-full justify-start gap-2" onClick={() => fileInputRef.current?.click()} disabled={isPending}>
                  <Upload className="h-4 w-4" />
                  {uploadFile ? 'Choose a different video' : 'Choose video file'}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  {uploadFile ? `${uploadFile.name} · ${(uploadFile.size / 1024 / 1024).toFixed(1)} MB` : 'MP4, MOV, WebM, AVI, or MKV · 2 minutes or less · 100 MB maximum'}
                </p>
                {uploadFile && (uploadFile.type === 'video/quicktime' || /\.mov$/i.test(uploadFile.name)) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Browser-compatible MOV files are safely uploaded as MP4. If needed, OlogyWood will convert the video for reliable playback.
                  </p>
                )}
                {uploadFile && /\.(avi|mkv)$/i.test(uploadFile.name) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    OlogyWood will securely convert this file to a browser-ready MP4 and create its thumbnail after upload.
                  </p>
                )}
                {uploading && (
                  <div className="mt-2 space-y-1" aria-live="polite">
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary transition-[width]" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {uploadStage === 'converting' ? 'Preparing a browser-ready MP4…' : `Uploading ${uploadProgress}%`}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div>
              <Label>Category</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {relevantCategories.map((cat) => (
                  <Badge
                    key={cat.value}
                    variant={category === cat.value ? "default" : "outline"}
                    className="cursor-pointer select-none"
                    onClick={() => setCategory(cat.value)}
                  >
                    {cat.label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={addMode === 'url' ? handleAddByUrl : handleUpload}
                disabled={isPending}
              >
                {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                {addMode === 'url' ? 'Add Video' : 'Upload & Add'}
              </Button>
              <Button size="sm" variant="ghost" onClick={resetForm} disabled={isPending}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Video List */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading videos...</div>
        ) : (videos as any[]).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Video className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No videos yet. Add your first clip to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(videos as any[]).map((video: any) => {
              const catInfo = getCategoryInfo(video.category);
              return (
                <div key={video.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 w-16 h-12 bg-black rounded overflow-hidden">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-5 w-5 text-white/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{video.title}</div>
                    <Badge className={`text-[10px] mt-1 ${catInfo.color}`} variant="secondary">
                      {catInfo.label}
                    </Badge>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeVideo.mutate({ id: video.id })}
                    disabled={removeVideo.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
