import { useEffect, useRef, useState } from 'react';
import { Loader2, Play, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import {
  MAX_SECONDS as RELEASE_PREVIEW_MAX_SECONDS,
  MAX_INPUT_SECONDS,
  RELEASE_PREVIEW_ACCEPT,
  getReleasePreviewMimeType,
  validateReleasePreviewFile,
  type ReleasePreviewKind,
} from '@shared/releasePreview';

type PreviewSource = {
  previewUrl: string;
  kind: ReleasePreviewKind;
  durationSeconds: number;
};

function safePreviewError(error: unknown): string {
  const candidate = error as { data?: { code?: string }; message?: string } | undefined;
  if (!candidate?.message || candidate.data?.code === 'INTERNAL_SERVER_ERROR') {
    return 'The preview could not be processed. Please try another file or try again.';
  }
  return candidate.message;
}

/** Native, deliberately capped player for only the signed preview asset — never a release's paid source URL. */
export function ReleasePreviewPlayer({
  preview,
  title,
  className = '',
  onError,
}: {
  preview: PreviewSource;
  title: string;
  className?: string;
  onError?: () => void;
}) {
  const media = useRef<HTMLMediaElement>(null);
  const cap = Math.min(Math.max(preview.durationSeconds || RELEASE_PREVIEW_MAX_SECONDS, 0), RELEASE_PREVIEW_MAX_SECONDS);
  const setMedia = (element: HTMLMediaElement | null) => {
    if (media.current && media.current !== element) media.current.pause();
    media.current = element;
  };

  function stopAtCap() {
    const element = media.current;
    if (!element || !cap || element.currentTime < cap) return;
    element.pause();
    // Clamp even if an unexpectedly longer signed asset was returned.
    element.currentTime = cap;
  }

  function clampSeek() {
    const element = media.current;
    if (element && cap && element.currentTime > cap) element.currentTime = cap;
  }

  useEffect(() => {
    const element = media.current;
    if (element) element.pause();
  }, [preview.previewUrl]);

  useEffect(() => () => {
    const element = media.current;
    if (!element) return;
    element.pause();
    element.removeAttribute('src');
    element.load();
  }, []);

  const commonProps = {
    ref: setMedia,
    src: preview.previewUrl,
    controls: true,
    preload: 'metadata' as const,
    'aria-label': `${title} preview, up to 30 seconds`,
    onTimeUpdate: stopAtCap,
    onSeeking: clampSeek,
    onLoadedMetadata: clampSeek,
    onPlay: clampSeek,
    onError,
    className: `w-full max-w-md ${className}`,
  };

  return preview.kind === 'video'
    ? <video {...commonProps} playsInline />
    : <audio {...commonProps} />;
}

/** Creator-side upload. Uploading is separate from saving so a token can be attached to a create or update mutation. */
export function ContentReleasePreviewUpload({
  previewMedia,
  releaseId,
  onChange,
  onBusyChange,
  disabled = false,
}: {
  previewMedia: string;
  releaseId?: number;
  onChange: (previewMedia: string) => void;
  onBusyChange: (busy: boolean) => void;
  disabled?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const onBusyChangeRef = useRef(onBusyChange);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewSource | null>(null);
  const upload = trpc.contentRelease.uploadPreview.useMutation();
  // Existing preview URLs are signed and fetched only if the owner asks to play one.
  const currentPreview = trpc.contentRelease.getPreview.useQuery(
    { releaseId: releaseId ?? 0 },
    { enabled: false, retry: false },
  );

  useEffect(() => { onBusyChangeRef.current = onBusyChange; }, [onBusyChange]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      onBusyChangeRef.current(false);
    };
  }, []);

  async function readDataUrl(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Preview read failed'));
      reader.onerror = () => reject(new Error('Preview read failed'));
      reader.readAsDataURL(file);
    });
  }

  async function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // The same file can be selected again after a validation or upload failure.
    if (!file) return;

    const validationError = validateReleasePreviewFile(file);
    setError(validationError);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    const mimeType = getReleasePreviewMimeType(file);
    if (!mimeType) return;

    setUploading(true);
    onBusyChangeRef.current(true);
    try {
      const fileData = await readDataUrl(file);
      if (!mounted.current) return;
      const result = await upload.mutateAsync({ fileData, mimeType, releaseId });
      if (!mounted.current) return;
      onChange(result.previewMedia);
      // Use the returned signed preview URL immediately; never construct a URL from the opaque token.
      setPreview({ previewUrl: result.previewUrl, kind: result.kind, durationSeconds: result.durationSeconds });
      setError(null);
      toast.success('Preview uploaded. Save your release to apply it.');
    } catch (cause) {
      if (!mounted.current) return;
      // Do not clear previewMedia or an already playable signed URL when a replacement fails.
      const message = safePreviewError(cause);
      setError(message);
      toast.error(message);
    } finally {
      if (mounted.current) {
        setUploading(false);
        onBusyChangeRef.current(false);
      }
    }
  }

  async function loadCurrentPreview() {
    setError(null);
    try {
      const result = await currentPreview.refetch();
      if (!mounted.current) return;
      if (result.isError || !result.data) throw new Error('Preview is unavailable.');
      setPreview(result.data);
    } catch (cause) {
      if (!mounted.current) return;
      setError(safePreviewError(cause));
    }
  }

  function removePreview() {
    onChange('');
    setPreview(null);
    setError(null);
  }

  return <div className="space-y-3">
    <p className="text-sm text-muted-foreground">
      Add a public preview from the first 30 seconds of your own audio or video. MP3, WAV, FLAC, AAC, M4A, MP4, MOV, or WebM; 20 MB and {MAX_INPUT_SECONDS / 60} minutes maximum. The uploaded preview is clipped to 0:30.
    </p>
    <input
      ref={input}
      type="file"
      accept={RELEASE_PREVIEW_ACCEPT}
      aria-label="Upload 30-second release preview"
      className="hidden"
      onChange={chooseFile}
      disabled={disabled || uploading}
    />
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={disabled || uploading}>
        {uploading ? <Loader2 aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" /> : <Upload aria-hidden="true" className="h-4 w-4 mr-2" />}
        {uploading ? 'Uploading preview...' : previewMedia ? 'Replace preview' : 'Upload preview'}
      </Button>
      {previewMedia && releaseId && !preview && (
        <Button type="button" variant="ghost" onClick={loadCurrentPreview} disabled={disabled || currentPreview.isFetching}>
          {currentPreview.isFetching ? <Loader2 aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" /> : <Play aria-hidden="true" className="h-4 w-4 mr-2" />}
          Open current preview
        </Button>
      )}
      {previewMedia && (
        <Button type="button" variant="ghost" onClick={removePreview} disabled={disabled || uploading}>
          <X aria-hidden="true" className="h-4 w-4 mr-2" /> Remove preview
        </Button>
      )}
    </div>
    {uploading && <p role="status" className="text-xs text-muted-foreground">Uploading preview. Please wait before saving.</p>}
    {preview && <ReleasePreviewPlayer preview={preview} title="Your release" onError={() => {setPreview(null);setError('Preview playback failed. Try opening the current preview again or re-uploading your sample.');}} />}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}

/** Public card control. The signed preview query is never issued until the visitor asks to preview it. */
export function ContentReleasePublicPreview({ releaseId, hasPreview, title }: { releaseId: number; hasPreview: boolean; title: string }) {
  const mounted = useRef(true);
  const [preview, setPreview] = useState<PreviewSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewQuery = trpc.contentRelease.getPreview.useQuery(
    { releaseId },
    { enabled: false, retry: false },
  );

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function loadPreview() {
    setError(null);
    try {
      const result = await previewQuery.refetch();
      if (!mounted.current) return;
      if (result.isError || !result.data) throw new Error('Preview is unavailable.');
      setPreview(result.data);
    } catch {
      if (!mounted.current) return;
      setError('Preview is temporarily unavailable. Please retry.');
    }
  }

  function clearPreview() {
    // Unmounting the player pauses it and drops its signed URL from the DOM.
    setPreview(null);
    setError(null);
  }

  if (!hasPreview) return <p className="text-xs text-muted-foreground mt-2">Preview not added yet</p>;

  return <div className="mt-3 space-y-2">
    <Button type="button" size="sm" variant="outline" className="gap-1 text-xs" onClick={loadPreview} disabled={previewQuery.isFetching}>
      {previewQuery.isFetching ? <Loader2 aria-hidden="true" className="h-3 w-3 animate-spin" /> : <Play aria-hidden="true" className="h-3 w-3" />}
      Preview (0:30)
    </Button>
    {preview && (
      <div className="space-y-2">
        <ReleasePreviewPlayer preview={preview} title={title} onError={() => {setPreview(null);setError('Preview is temporarily unavailable. Please retry.');}} />
        <Button type="button" size="sm" variant="ghost" className="text-xs" onClick={clearPreview}>Clear preview</Button>
      </div>
    )}
    {error && (
      <div className="flex flex-wrap items-center gap-2" role="alert">
        <p className="text-xs text-destructive">{error}</p>
        <Button type="button" size="sm" variant="outline" className="text-xs" onClick={loadPreview} disabled={previewQuery.isFetching}>Retry preview</Button>
      </div>
    )}
  </div>;
}
