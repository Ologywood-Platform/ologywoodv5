import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Mail, MoreHorizontal, Music, Share2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { musicReleasePrice, musicReleaseShareDetails, type MusicShareDetails } from '@shared/musicReleaseShare';

export function MusicReleaseShareButton({ release, artistName, size = 'sm', className }: {
  release: Omit<MusicShareDetails, 'artistName'> & { coverArtUrl?: string | null };
  artistName: string;
  size?: 'sm' | 'default';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const busy = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const details = musicReleaseShareDetails({ ...release, artistName });
  useEffect(() => {
    setCopied(false);
    return () => { if (resetTimer.current) clearTimeout(resetTimer.current); };
  }, [open, release.id]);
  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(details.url);
      else {
        const field = document.createElement('textarea');
        field.value = details.url; field.setAttribute('readonly', ''); field.style.position = 'fixed'; field.style.opacity = '0';
        document.body.appendChild(field);
        try { field.select(); if (!document.execCommand('copy')) throw new Error('Copy unavailable'); }
        finally { field.remove(); }
      }
      setCopied(true); toast.success('Single link copied');
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 1800);
    } catch { toast.error('Could not copy the link. Select and copy the link below.'); }
  };
  const deviceShare = async () => {
    if (!navigator.share) return copyLink();
    if (busy.current) return;
    busy.current = true; setSharing(true);
    try { await navigator.share({ title: release.title, text: details.text, url: details.url }); }
    catch (error) { if (!(error && typeof error === 'object' && 'name' in error && error.name === 'AbortError')) toast.error('Could not open device sharing. Try Copy Link.'); }
    finally { busy.current = false; setSharing(false); }
  };
  return (
    <>
      <Button type="button" variant="outline" size={size} className={className} onClick={() => setOpen(true)} aria-label={`Share ${release.title}`}>
        <Share2 className="mr-1.5 h-4 w-4" aria-hidden="true" /> Share
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent overlayClassName="z-[70]" className="z-[71] max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Share Single</DialogTitle>
            <DialogDescription>Share this single's own page. Fans can preview it and use the existing purchase flow; no full song or private download link is shared.</DialogDescription>
          </DialogHeader>
          <div className="overflow-hidden rounded-lg border bg-card text-card-foreground">
            <div className="flex items-center gap-3 p-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
                {release.coverArtUrl ? <img src={release.coverArtUrl} alt={`${release.title} cover art`} className="h-full w-full object-contain" /> : <Music className="h-8 w-8 text-muted-foreground" />}
              </div>
              <div className="min-w-0 [overflow-wrap:anywhere]">
                <p className="text-xs font-medium text-muted-foreground">OLOGYWOOD.COM</p>
                <p className="font-semibold">{release.title}</p>
                <p className="text-sm text-muted-foreground">{artistName}</p>
                <p className="text-sm font-medium text-primary">{musicReleasePrice(release)}</p>
              </div>
            </div>
            {release.description && <p className="line-clamp-3 border-t p-3 text-sm text-muted-foreground [overflow-wrap:anywhere]">{release.description}</p>}
          </div>
          <p className="text-xs text-muted-foreground">Social previews use this single's cover art, title, creator, and price. Cached previews may need a refresh after edits.</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['facebook', 'x', 'linkedin', 'whatsapp'] as const).map(key => <Button key={key} type="button" variant="outline" onClick={() => window.open(details.social[key], '_blank', 'noopener,noreferrer,width=720,height=720')}>{({ facebook: 'Facebook', x: 'X', linkedin: 'LinkedIn', whatsapp: 'WhatsApp' })[key]}</Button>)}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" onClick={copyLink}>{copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{copied ? 'Copied' : 'Copy Link'}</Button>
            <Button type="button" variant="outline" onClick={deviceShare} disabled={sharing}><MoreHorizontal className="mr-2 h-4 w-4" /> Device Share</Button>
            <Button type="button" variant="outline" onClick={() => window.location.assign(details.social.email)}><Mail className="mr-2 h-4 w-4" /> Email</Button>
            <Button type="button" variant="outline" onClick={() => window.location.assign(details.social.sms)}><Smartphone className="mr-2 h-4 w-4" /> Text</Button>
          </div>
          <p className="text-xs text-muted-foreground">For Instagram, copy the link into your bio or a Story link sticker, or use Device Share where supported. Nothing is posted or emailed automatically.</p>
          <label className="space-y-1 text-xs text-muted-foreground">Single link
            <input aria-label="Single share link" readOnly value={details.url} onFocus={event => event.currentTarget.select()} className="block w-full min-w-0 rounded border bg-background px-2 py-2 text-foreground" />
          </label>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Done</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
