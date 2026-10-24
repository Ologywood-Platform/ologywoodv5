import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadMedia } from '@/lib/mediaUpload';
import { getSafeUploadErrorMessage } from '@/lib/uploadResponse';
import { toast } from 'sonner';
import { CONTENT_RELEASE_COVER_ACCEPT, validateContentReleaseCoverFile } from '@shared/contentReleaseCover';

export function ContentReleaseArtwork({url, title, className = '', fallback}: {url?:string | null; title:string; className?:string; fallback?:ReactNode}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  return <div className={`overflow-hidden rounded-lg bg-muted flex items-center justify-center shrink-0 ${className}`}>
    {url && failedUrl !== url ? (
      <img src={url} alt={`Cover art for ${title || 'your release'}`} loading="lazy" className="h-full w-full object-contain" onError={() => setFailedUrl(url)} />
    ) : fallback || <ImageIcon aria-hidden="true" className="h-8 w-8 text-muted-foreground/50" />}
  </div>;
}

export function ContentReleaseCoverUpload({url, releaseId, onChange, onBusyChange, disabled = false}: {
  url:string; releaseId?:number; onChange:(url:string) => void; onBusyChange:(busy:boolean) => void; disabled?:boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const onChangeRef = useRef(onChange);
  const onBusyChangeRef = useRef(onBusyChange);
  const uploadAbortController = useRef<AbortController | null>(null);
  const operationGeneration = useRef(0);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ stage: 'uploading' | 'processing'; percent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { onBusyChangeRef.current = onBusyChange; }, [onBusyChange]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      operationGeneration.current += 1;
      uploadAbortController.current?.abort();
      uploadAbortController.current = null;
      mounted.current = false;
      onBusyChangeRef.current(false);
    };
  }, []);
  // A different release/draft value invalidates any in-flight replacement so it
  // cannot write a URL into a newly selected form.
  useEffect(() => {
    operationGeneration.current += 1;
    uploadAbortController.current?.abort();
    uploadAbortController.current = null;
    setUploading(false);
    setProgress(null);
    onBusyChangeRef.current(false);
  }, [releaseId, url]);

  async function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // Re-selecting the same file works after any failure.
    if (!file) return;
    const validationError = validateContentReleaseCoverFile(file);
    setError(validationError);
    if (validationError) { toast.error(validationError); return; }
    const generation = ++operationGeneration.current;
    const controller = new AbortController();
    uploadAbortController.current?.abort();
    uploadAbortController.current = controller;
    setUploading(true);
    setProgress({ stage: 'uploading', percent: 0 });
    onBusyChangeRef.current(true);
    try {
      const result = await uploadMedia(file, {
        purpose: 'content-cover',
        releaseId,
        signal: controller.signal,
        onProgress: (nextProgress) => {
          if (mounted.current && operationGeneration.current === generation) setProgress(nextProgress);
        },
      });
      if (!mounted.current || operationGeneration.current !== generation) return;
      // uploadMedia resolves only after a purpose-shaped done status.
      onChangeRef.current(result.url!);
      toast.success('Cover art uploaded. Save your release to apply it.');
    } catch (cause) {
      if (!mounted.current || operationGeneration.current !== generation || controller.signal.aborted) return;
      // Preserve the current artwork; only a validated done result can replace it.
      const message = getSafeUploadErrorMessage(cause);
      setError(message);
      toast.error(message);
    } finally {
      if (mounted.current && operationGeneration.current === generation) {
        setUploading(false);
        setProgress(null);
        onBusyChangeRef.current(false);
      }
      if (uploadAbortController.current === controller) uploadAbortController.current = null;
    }
  }

  return <div className="space-y-3">
    <p className="text-sm text-muted-foreground">Add your song or project's artwork. JPG, PNG, or WebP up to 10 MB. A square image is recommended; your artwork is not cropped.</p>
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <ContentReleaseArtwork url={url} title="your release" className="h-32 w-32 border border-border" />
      <div className="space-y-2">
        <input ref={input} type="file" accept={CONTENT_RELEASE_COVER_ACCEPT} aria-label="Upload cover art file" className="hidden" onChange={chooseFile} disabled={disabled || uploading} />
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => input.current?.click()} disabled={disabled || uploading}>
            {uploading ? <Loader2 aria-hidden="true" className="h-4 w-4 mr-2 animate-spin" /> : <Upload aria-hidden="true" className="h-4 w-4 mr-2" />}
            {uploading ? 'Uploading cover art...' : url ? 'Replace cover art' : 'Upload cover art'}
          </Button>
          {url && <Button type="button" variant="ghost" disabled={disabled || uploading} onClick={() => {onChange(''); setError(null);}}><X aria-hidden="true" className="h-4 w-4 mr-2" />Remove cover art</Button>}
        </div>
        <p className="text-xs text-muted-foreground">Uploads are optimized for display. Uploading or removing artwork changes the release only when you save.</p>
      </div>
    </div>
    {uploading && <p role="status" className="text-xs text-muted-foreground">
      {progress?.stage === 'processing'
        ? 'Cover art uploaded. Processing on the server; this can take a moment. Please wait before saving.'
        : `Uploading cover art${progress ? ` (${progress.percent}%)` : ''}. Please wait before saving.`}
    </p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
