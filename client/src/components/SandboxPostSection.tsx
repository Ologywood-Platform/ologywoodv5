import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Flag, Image as ImageIcon, Loader2, Pencil, RefreshCw, Share2, Sparkles, Trash2, Upload, Video, X } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { SandboxPostShareDialog } from '@/components/SandboxPostShareDialog';
import { ReportContentModal } from '@/components/ReportContentModal';
import {
  SANDBOX_POST_IMAGE_MIME_TYPES,
  SANDBOX_POST_MAX_CHARACTERS,
  SANDBOX_POST_MAX_IMAGE_BYTES,
  SANDBOX_POST_MAX_VIDEO_BYTES,
  SANDBOX_POST_MAX_VIDEO_DURATION_SECONDS,
  SANDBOX_POST_VIDEO_MIME_TYPES,
  sandboxPostPath,
} from '@shared/sandboxPost';

interface SandboxPostSectionProps {
  artistProfileId: number;
  artistUserId: number;
  artistName: string;
  isOwner: boolean;
}

type PreparedMedia = {
  file: File;
  type: 'image' | 'video';
  previewUrl: string;
  durationSeconds?: number;
  thumbnailData?: string;
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

function prepareVideo(file: File): Promise<{ durationSeconds: number; thumbnailData?: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    const cleanup = () => URL.revokeObjectURL(url);
    video.onerror = () => { cleanup(); reject(new Error('Could not read this video. Try an MP4 or WebM file.')); };
    video.onloadedmetadata = () => {
      const durationSeconds = Math.ceil(video.duration);
      if (!Number.isFinite(durationSeconds) || durationSeconds < 1) {
        cleanup(); reject(new Error('Could not determine the video duration.')); return;
      }
      video.currentTime = Math.min(1, Math.max(0, video.duration / 3));
      video.onseeked = () => {
        let thumbnailData: string | undefined;
        try {
          const canvas = document.createElement('canvas');
          const scale = Math.min(1, 1200 / Math.max(1, video.videoWidth));
          canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
          canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
          canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
          thumbnailData = canvas.toDataURL('image/jpeg', 0.86);
        } catch {
          thumbnailData = undefined;
        }
        cleanup();
        resolve({ durationSeconds, thumbnailData });
      };
    };
    video.src = url;
  });
}

export function SandboxPostSection({ artistProfileId, artistUserId, artistName, isOwner }: SandboxPostSectionProps) {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [confirmReplaceOpen, setConfirmReplaceOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<PreparedMedia | null>(null);
  const [preparingMedia, setPreparingMedia] = useState(false);

  const { data: publicPost, isLoading: publicLoading } = trpc.sandboxPost.getPublic.useQuery(
    { artistProfileId },
    { enabled: artistProfileId > 0 },
  );
  const { data: ownerPost, isLoading: ownerLoading } = trpc.sandboxPost.getCurrent.useQuery(
    undefined,
    { enabled: isOwner, retry: false },
  );
  const currentPost = isOwner ? ownerPost : publicPost;
  const isHidden = currentPost?.status === 'hidden';
  const isLoading = publicLoading || (isOwner && ownerLoading);

  const replaceMutation = trpc.sandboxPost.replace.useMutation({
    onSuccess: async (result) => {
      await Promise.all([
        utils.sandboxPost.getCurrent.invalidate(),
        utils.sandboxPost.getPublic.invalidate({ artistProfileId }),
      ]);
      toast.success(result.previousPostPermanentlyDeleted ? 'Sandbox Post replaced' : 'Sandbox Post published', {
        description: result.previousPostPermanentlyDeleted ? 'Your previous post was permanently deleted and cannot be restored.' : 'Your post is now live on your profile.',
      });
      closeComposer();
    },
    onError: (error) => toast.error(error.message || 'Could not publish your Sandbox Post.'),
  });
  const deleteMutation = trpc.sandboxPost.deleteCurrent.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.sandboxPost.getCurrent.invalidate(),
        utils.sandboxPost.getPublic.invalidate({ artistProfileId }),
      ]);
      toast.success('Sandbox Post permanently deleted');
      setConfirmDeleteOpen(false);
    },
    onError: (error) => toast.error(error.message || 'Could not delete the Sandbox Post.'),
  });

  useEffect(() => () => { if (media?.previewUrl) URL.revokeObjectURL(media.previewUrl); }, [media]);

  function openComposer() {
    setContent(currentPost?.content || '');
    setMedia(null);
    setComposerOpen(true);
  }

  function closeComposer() {
    setComposerOpen(false);
    setConfirmReplaceOpen(false);
    setContent('');
    setMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function selectMedia(file: File) {
    const isImage = (SANDBOX_POST_IMAGE_MIME_TYPES as readonly string[]).includes(file.type);
    const isVideo = (SANDBOX_POST_VIDEO_MIME_TYPES as readonly string[]).includes(file.type);
    if (!isImage && !isVideo) { toast.error('Choose a JPEG, PNG, WebP, MP4, MOV, or WebM file.'); return; }
    if (isImage && file.size > SANDBOX_POST_MAX_IMAGE_BYTES) { toast.error('Images must be 8 MB or smaller.'); return; }
    if (isVideo && file.size > SANDBOX_POST_MAX_VIDEO_BYTES) { toast.error('Videos must be 25 MB or smaller.'); return; }
    setPreparingMedia(true);
    try {
      const details: { durationSeconds?: number; thumbnailData?: string } = isVideo ? await prepareVideo(file) : {};
      if (details.durationSeconds && details.durationSeconds > SANDBOX_POST_MAX_VIDEO_DURATION_SECONDS) {
        toast.error('Sandbox Post videos must be 30 seconds or shorter.');
        return;
      }
      setMedia({
        file,
        type: isImage ? 'image' : 'video',
        previewUrl: URL.createObjectURL(file),
        durationSeconds: details.durationSeconds,
        thumbnailData: details.thumbnailData,
      });
    } catch (error: any) {
      toast.error(error?.message || 'Could not prepare the selected media.');
    } finally {
      setPreparingMedia(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function publish() {
    const trimmed = content.trim();
    if (!trimmed) { toast.error('Write something before publishing.'); return; }
    const mediaInput = media ? {
      type: media.type,
      fileName: media.file.name,
      mimeType: media.file.type,
      fileSizeBytes: media.file.size,
      durationSeconds: media.durationSeconds,
      fileData: await readAsDataUrl(media.file),
      thumbnailData: media.thumbnailData,
    } : undefined;
    replaceMutation.mutate({ content: trimmed, media: mediaInput });
  }

  const sharePost = useMemo(() => currentPost ? {
    id: currentPost.id,
    artistName,
    content: currentPost.content,
    canonicalPath: sandboxPostPath(artistName),
  } : null, [artistName, currentPost]);

  if (isLoading) {
    return <Card data-testid="sandbox-post-loading"><CardContent className="py-6"><div className="h-24 animate-pulse rounded-lg bg-muted" /></CardContent></Card>;
  }
  if (!currentPost && !isOwner) return null;

  return (
    <>
      <Card className="overflow-hidden border-purple-200 dark:border-purple-900" data-testid="sandbox-post-section">
        <div className="h-1.5 bg-gradient-to-r from-purple-700 via-fuchsia-500 to-cyan-400" />
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-700 dark:text-purple-300">One post at a time</p>
              <CardTitle className="mt-1 flex items-center gap-2"><Sparkles className="h-5 w-5 text-fuchsia-500" />Sandbox Post</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">A playful space for {artistName} to share what is happening right now.</p>
            </div>
            {currentPost && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => setShareOpen(true)} disabled={isHidden}><Share2 className="h-4 w-4" />Share</Button>
                {!isOwner && <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => setReportOpen(true)}><Flag className="h-4 w-4" />Report</Button>}
                {isOwner && <Button size="sm" className="gap-2 bg-purple-700 hover:bg-purple-800" onClick={openComposer}><RefreshCw className="h-4 w-4" />Replace</Button>}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {currentPost ? (
            <div className="space-y-4">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-foreground">{currentPost.content}</p>
              {isHidden && <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">This post is hidden from public view while it is under moderation review.</p>}
              {currentPost.mediaType === 'image' && currentPost.mediaUrl && (
                <img src={currentPost.mediaUrl} alt={`Sandbox Post by ${artistName}`} className="max-h-[520px] w-full rounded-xl object-contain bg-muted" />
              )}
              {currentPost.mediaType === 'video' && currentPost.mediaUrl && (
                <video src={currentPost.mediaUrl} poster={currentPost.mediaThumbnailUrl || undefined} controls playsInline preload="metadata" className="max-h-[520px] w-full rounded-xl bg-black" aria-label={`Sandbox Post video by ${artistName}`} />
              )}
              <div className="flex flex-col gap-2 border-t pt-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>Posted {new Date(currentPost.createdAt).toLocaleString()}</span>
                <span>When a new post is published, this one is permanently deleted.</span>
              </div>
              {isOwner && (
                <Button variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive" onClick={() => setConfirmDeleteOpen(true)}><Trash2 className="h-4 w-4" />Delete current post</Button>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 p-5 dark:from-purple-950/40 dark:to-fuchsia-950/30">
              <div className="flex items-start gap-3"><div className="rounded-full bg-white p-2.5 text-purple-700 shadow-sm dark:bg-purple-950"><Pencil className="h-5 w-5" /></div><div><p className="font-semibold">Express yourself in the Sandbox</p><p className="mt-1 text-sm text-muted-foreground">Share one short update, photo, or 30-second video. Your next post permanently replaces this one.</p></div></div>
              <Button className="mt-4 gap-2 bg-purple-700 hover:bg-purple-800" onClick={openComposer}><Sparkles className="h-4 w-4" />Create Sandbox Post</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={composerOpen} onOpenChange={(open) => { if (!open && !replaceMutation.isPending) closeComposer(); }}>
        <DialogContent className="z-[10002] max-h-[92vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader><DialogTitle>{currentPost ? 'Replace Sandbox Post' : 'Create Sandbox Post'}</DialogTitle><DialogDescription>Say what is happening now. There is no feed—only your current post.</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="sandbox-content">Your post</Label><span className={`text-xs ${content.length > SANDBOX_POST_MAX_CHARACTERS ? 'text-destructive' : 'text-muted-foreground'}`}>{content.length}/{SANDBOX_POST_MAX_CHARACTERS}</span></div><Textarea id="sandbox-content" value={content} onChange={(event) => setContent(event.target.value.slice(0, SANDBOX_POST_MAX_CHARACTERS))} rows={6} placeholder="What are you creating, promoting, thinking about, or celebrating?" className="resize-y" /></div>
            <div className="space-y-2"><Label>Photo or short video <span className="font-normal text-muted-foreground">(optional)</span></Label><input ref={fileInputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" onChange={(event) => { const file = event.target.files?.[0]; if (file) void selectMedia(file); }} /><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={preparingMedia || replaceMutation.isPending}>{preparingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{preparingMedia ? 'Preparing…' : 'Choose media'}</Button>{media && <Button type="button" variant="ghost" className="gap-2" onClick={() => setMedia(null)}><X className="h-4 w-4" />Remove</Button>}</div><p className="text-xs text-muted-foreground">Images up to 8 MB. MP4, MOV, or WebM video up to 25 MB and 30 seconds.</p></div>
            {media && <div className="rounded-xl border bg-muted/30 p-3"><div className="mb-2 flex items-center gap-2 text-sm font-medium">{media.type === 'image' ? <ImageIcon className="h-4 w-4" /> : <Video className="h-4 w-4" />}<span className="truncate">{media.file.name}</span></div>{media.type === 'image' ? <img src={media.previewUrl} alt="Selected Sandbox Post preview" className="max-h-64 w-full rounded-lg object-contain" /> : <video src={media.previewUrl} controls playsInline className="max-h-64 w-full rounded-lg bg-black" />}</div>}
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"><p className="font-semibold">One post means one post.</p><p className="mt-1">Publishing replaces and permanently deletes your current Sandbox Post from OlogyWood’s active database. The previous post cannot be restored.</p></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={closeComposer} disabled={replaceMutation.isPending}>Cancel</Button><Button className="gap-2 bg-purple-700 hover:bg-purple-800" disabled={!content.trim() || preparingMedia || replaceMutation.isPending} onClick={() => currentPost ? setConfirmReplaceOpen(true) : void publish()}>{replaceMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}{replaceMutation.isPending ? 'Publishing…' : currentPost ? 'Review replacement' : 'Publish post'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmReplaceOpen} onOpenChange={setConfirmReplaceOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Permanently replace this Sandbox Post?</AlertDialogTitle><AlertDialogDescription>Your current post and its database record will be permanently deleted and cannot be restored. The new post will take its place at the same share link.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep current post</AlertDialogCancel><AlertDialogAction className="bg-purple-700 hover:bg-purple-800" onClick={() => void publish()}>Delete old post and publish</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Permanently delete this Sandbox Post?</AlertDialogTitle><AlertDialogDescription>The current post and its active database record will be permanently deleted. This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate()} disabled={deleteMutation.isPending}>{deleteMutation.isPending ? 'Deleting…' : 'Delete permanently'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
      {sharePost && <SandboxPostShareDialog open={shareOpen} onOpenChange={setShareOpen} post={sharePost} />}
      <ReportContentModal open={reportOpen} onOpenChange={setReportOpen} contentType="content" contentName={`${artistName}'s Sandbox Post`} />
    </>
  );
}
