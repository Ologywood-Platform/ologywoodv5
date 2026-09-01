import { useMemo, useState } from 'react';
import { Check, Copy, Mail, MoreHorizontal, Share2, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { buildSandboxPostShareText, buildSandboxPostShareUrls } from '@/lib/sandboxPostShare';

interface SandboxPostShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: {
    id: number;
    artistName: string;
    content: string;
    canonicalPath: string;
  };
}

const destinations = [
  { key: 'facebook', label: 'Facebook', mark: 'f', className: 'bg-[#1877F2] text-white' },
  { key: 'x', label: 'X', mark: 'X', className: 'bg-black text-white dark:bg-white dark:text-black' },
  { key: 'linkedin', label: 'LinkedIn', mark: 'in', className: 'bg-[#0A66C2] text-white' },
  { key: 'whatsapp', label: 'WhatsApp', mark: 'W', className: 'bg-[#25D366] text-white' },
] as const;

export function SandboxPostShareDialog({ open, onOpenChange, post }: SandboxPostShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const details = useMemo(() => {
    const url = typeof window === 'undefined' ? post.canonicalPath : `${window.location.origin}${post.canonicalPath}`;
    return { artistName: post.artistName, content: post.content, url };
  }, [post.artistName, post.canonicalPath, post.content]);
  const shareText = buildSandboxPostShareText(details);
  const shareUrls = buildSandboxPostShareUrls(details);

  function openDestination(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer,width=720,height=720');
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(details.url);
      setCopied(true);
      toast.success('Sandbox Post link copied');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy the Sandbox Post link.');
    }
  }

  async function deviceShare() {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title: `${post.artistName}'s Sandbox Post`, text: shareText, url: details.url });
    } catch (error: any) {
      if (error?.name !== 'AbortError') toast.error('Could not open device sharing.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-purple-700" />
            Share Sandbox Post
          </DialogTitle>
          <DialogDescription>
            Share the current post. This same link will show the talent's newest Sandbox Post after replacement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl border bg-gradient-to-br from-purple-950 via-violet-900 to-fuchsia-800 p-5 text-white" data-testid="sandbox-social-preview-card">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-200">Sandbox Post · OlogyWood</p>
            <p className="mt-3 line-clamp-3 text-lg font-semibold leading-relaxed">“{post.content}”</p>
            <p className="mt-3 text-sm text-purple-100">{post.artistName}</p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Share on social</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {destinations.map((destination) => (
                <button
                  key={destination.key}
                  type="button"
                  aria-label={`Share on ${destination.label}`}
                  onClick={() => openDestination(shareUrls[destination.key])}
                  className="flex min-w-0 flex-col items-center gap-2 rounded-xl border bg-background px-2 py-3 text-xs font-medium transition-colors hover:border-purple-300 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 dark:hover:bg-purple-950/40"
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${destination.className}`}>{destination.mark}</span>
                  <span className="truncate max-w-full">{destination.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold">Share directly</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Button variant="outline" className="h-auto flex-col gap-2 py-3" onClick={() => window.location.assign(shareUrls.email)}><Mail className="h-5 w-5 text-purple-700" />Email</Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-3" onClick={() => window.location.assign(shareUrls.sms)}><Smartphone className="h-5 w-5 text-purple-700" />Text</Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-3" onClick={copyLink}>{copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5 text-purple-700" />}{copied ? 'Copied' : 'Copy Link'}</Button>
              <Button variant="outline" className="h-auto flex-col gap-2 py-3" onClick={deviceShare}><MoreHorizontal className="h-5 w-5 text-purple-700" />More</Button>
            </div>
          </div>

          <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Sandbox Posts are one-at-a-time updates. If this post is replaced or deleted, the shared link will no longer show this version.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
