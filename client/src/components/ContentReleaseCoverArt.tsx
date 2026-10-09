import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ImageIcon, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { CONTENT_RELEASE_COVER_ACCEPT, CONTENT_RELEASE_COVER_UPLOAD_ERROR, getContentReleaseCoverMimeType, validateContentReleaseCoverFile } from '@shared/contentReleaseCover';

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
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = trpc.contentRelease.uploadCoverArt.useMutation();
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; onBusyChange(false); };
  }, [onBusyChange]);

  async function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ''; // Re-selecting the same file works after any failure.
    if (!file) return;
    const validationError = validateContentReleaseCoverFile(file);
    setError(validationError);
    if (validationError) { toast.error(validationError); return; }
    setUploading(true);
    onBusyChange(true);
    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Image read failed'));
        reader.onerror = () => reject(new Error('Image read failed'));
        reader.readAsDataURL(file);
      });
      if (!mounted.current) return;
      const result = await upload.mutateAsync({fileData, mimeType:getContentReleaseCoverMimeType(file) as 'image/jpeg' | 'image/png' | 'image/webp', releaseId});
      if (!mounted.current) return;
      onChange(result.url);
      toast.success('Cover art uploaded. Save your release to apply it.');
    } catch (cause: any) {
      if (!mounted.current) return;
      const message = cause?.data?.code && cause.data.code !== 'INTERNAL_SERVER_ERROR'
        ? cause.message : CONTENT_RELEASE_COVER_UPLOAD_ERROR;
      setError(message);
      toast.error(message);
    } finally {
      if (mounted.current) { setUploading(false); onBusyChange(false); }
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
    {uploading && <p role="status" className="text-xs text-muted-foreground">Uploading cover art. Please wait before saving.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
