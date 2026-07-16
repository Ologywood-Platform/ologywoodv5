import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Plus, Trash2, Link, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

type VideoCategory = typeof VIDEO_CATEGORIES[number]['value'];

export function VideoPortfolioManager({ talentType }: { talentType?: string }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<'url' | 'upload'>('url');
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [category, setCategory] = useState<VideoCategory>('highlights');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

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

  const uploadVideo = trpc.artist.uploadPortfolioVideo.useMutation({
    onSuccess: () => {
      toast.success("Video uploaded and added to portfolio!");
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
    if (uploadFile.size > 100 * 1024 * 1024) { toast.error("File must be under 100MB"); return; }

    const reader = new FileReader();
    reader.onloadend = () => {
      uploadVideo.mutate({
        title: title.trim(),
        category,
        fileName: uploadFile.name,
        mimeType: uploadFile.type,
        fileData: reader.result as string,
      });
    };
    reader.readAsDataURL(uploadFile);
  };

  const getCategoryInfo = (cat: string) => {
    return VIDEO_CATEGORIES.find(c => c.value === cat) || VIDEO_CATEGORIES[VIDEO_CATEGORIES.length - 1];
  };

  // Filter categories based on talent type
  const relevantCategories = talentType === 'athlete'
    ? VIDEO_CATEGORIES.filter(c => ['highlights', 'training', 'game_day', 'behind_the_scenes', 'other'].includes(c.value))
    : talentType === 'artist'
    ? VIDEO_CATEGORIES.filter(c => ['live_performance', 'studio', 'music_video', 'behind_the_scenes', 'other'].includes(c.value))
    : VIDEO_CATEGORIES;

  const isPending = addVideo.isPending || uploadVideo.isPending;

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
          Add up to 10 short clips (1-2 min each) to showcase your talent. {talentType === 'athlete' ? 'Highlight reels, training clips, and game day footage work great.' : 'Live performances, studio sessions, and music videos work great.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
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
                onClick={() => setAddMode('upload')}
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
                  placeholder="https://..."
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">Direct video link (MP4, WebM) or hosted URL</p>
              </div>
            ) : (
              <div>
                <Label htmlFor="videoFile">Video File * (max 100MB)</Label>
                <Input
                  id="videoFile"
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">MP4, MOV, or WebM — keep clips under 2 minutes for best engagement</p>
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
