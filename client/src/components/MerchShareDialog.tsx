import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import {
  Check,
  Copy,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  Smartphone,
  Users,
} from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { merchUrl } from '@/lib/slugify';
import {
  buildMerchFanUpdate,
  buildMerchShareText,
  buildMerchShareUrls,
} from '@/lib/merchShare';
import { toast } from 'sonner';
import { SendUpdateDialog } from './SendUpdateDialog';

interface MerchShareItem {
  id: number;
  userId: number;
  userType: 'artist' | 'venue';
  title: string;
  description?: string | null;
  priceDisplay: string;
  sellerName: string;
  imageUrls?: string[] | null;
}

interface MerchShareDialogProps {
  item: MerchShareItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const socialDestinations = [
  { key: 'facebook', label: 'Facebook', mark: 'f', className: 'bg-[#1877F2] text-white' },
  { key: 'x', label: 'X', mark: 'X', className: 'bg-black text-white dark:bg-white dark:text-black' },
  { key: 'linkedin', label: 'LinkedIn', mark: 'in', className: 'bg-[#0A66C2] text-white' },
  { key: 'whatsapp', label: 'WhatsApp', mark: 'W', className: 'bg-[#25D366] text-white' },
] as const;

export function MerchShareDialog({ item, open, onOpenChange }: MerchShareDialogProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [copied, setCopied] = useState(false);
  const [fanDialogOpen, setFanDialogOpen] = useState(false);
  const isArtistOwner = user?.id === item.userId && item.userType === 'artist';

  const shareDetails = useMemo(() => {
    const canonicalPath = merchUrl(item.title, item.id);
    const url = typeof window === 'undefined' ? canonicalPath : `${window.location.origin}${canonicalPath}`;
    return {
      title: item.title,
      sellerName: item.sellerName,
      priceDisplay: item.priceDisplay,
      url,
    };
  }, [item.id, item.priceDisplay, item.sellerName, item.title]);

  const shareText = buildMerchShareText(shareDetails);
  const shareUrls = buildMerchShareUrls(shareDetails);
  const fanUpdate = buildMerchFanUpdate(shareDetails);
  const socialPreviewImage = `/api/og-image/merch/${item.id}`;

  const { data: fanStats, isLoading: fanStatsLoading } = trpc.follows.getStats.useQuery(
    { userId: item.userId },
    { enabled: open && isArtistOwner },
  );
  const { data: fanAccess, isLoading: fanAccessLoading } = trpc.artistUpdates.canSend.useQuery(
    undefined,
    { enabled: open && isArtistOwner, retry: false },
  );
  const followerCount = fanStats?.followersCount ?? 0;

  function openDestination(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer,width=720,height=720');
  }

  async function copyProductLink() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareDetails.url);
      } else {
        const field = document.createElement('textarea');
        field.value = shareDetails.url;
        field.setAttribute('readonly', '');
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        document.execCommand('copy');
        document.body.removeChild(field);
      }
      setCopied(true);
      toast.success('Product link copied');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy the product link.');
    }
  }

  async function openDeviceShare() {
    if (!navigator.share) {
      await copyProductLink();
      return;
    }
    try {
      await navigator.share({ title: item.title, text: shareText, url: shareDetails.url });
    } catch (error: any) {
      if (error?.name !== 'AbortError') toast.error('Could not open device sharing.');
    }
  }

  function openFanComposer() {
    if (fanAccess?.hasAccess === false) {
      onOpenChange(false);
      navigate('/pricing');
      return;
    }
    onOpenChange(false);
    setFanDialogOpen(true);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[660px] max-h-[92vh] overflow-y-auto p-0">
          <div className="px-6 pt-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <Share2 className="h-5 w-5 text-purple-700" />
                Share Product
              </DialogTitle>
              <DialogDescription>
                Share this exact product page. Social posts will use the product image, creator, and price shown below.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-6 space-y-5">
            <div className="overflow-hidden rounded-xl border bg-white text-slate-950 shadow-sm" data-testid="merch-social-preview-card">
              <div className="aspect-[1.905/1] bg-gradient-to-br from-slate-50 via-white to-purple-50">
                <img
                  src={socialPreviewImage}
                  alt={`${item.title} social sharing preview`}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-1 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">OLOGYWOOD.COM</p>
                <p className="line-clamp-1 text-base font-bold">{item.title} — {item.priceDisplay} | {item.sellerName}</p>
                <p className="line-clamp-2 text-sm text-slate-600">
                  {item.title} by {item.sellerName} — {item.priceDisplay}. {item.description || 'Shop this creator product on OlogyWood.'}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Share on social</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {socialDestinations.map((destination) => (
                  <button
                    key={destination.key}
                    type="button"
                    aria-label={`Share on ${destination.label}`}
                    onClick={() => openDestination(shareUrls[destination.key])}
                    className="group flex min-w-0 flex-col items-center gap-2 rounded-xl border bg-background px-2 py-3 text-xs font-medium transition-colors hover:border-purple-300 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-600 focus-visible:ring-offset-2 dark:hover:bg-purple-950/40"
                  >
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold ${destination.className}`}>
                      {destination.mark}
                    </span>
                    <span className="truncate max-w-full">{destination.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-sm font-semibold">Share directly</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Button variant="outline" className="h-auto flex-col gap-2 py-3" onClick={() => window.location.assign(shareUrls.email)}>
                  <Mail className="h-5 w-5 text-purple-700" /> Email
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-3" onClick={() => window.location.assign(shareUrls.sms)}>
                  <Smartphone className="h-5 w-5 text-purple-700" /> Text
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-3" onClick={copyProductLink}>
                  {copied ? <Check className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5 text-purple-700" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </Button>
                <Button variant="outline" className="h-auto flex-col gap-2 py-3" onClick={openDeviceShare}>
                  <MoreHorizontal className="h-5 w-5 text-purple-700" /> More Options
                </Button>
              </div>
            </div>

            {isArtistOwner && (
              <div className="rounded-xl border border-purple-200 bg-purple-50/70 p-4 dark:border-purple-800 dark:bg-purple-950/30">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-purple-100 p-2 text-purple-700 dark:bg-purple-900/60 dark:text-purple-200">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Share directly with your fans</p>
                      <p className="text-sm text-muted-foreground">
                        {fanStatsLoading || fanAccessLoading
                          ? 'Checking your fan list…'
                          : `${followerCount} ${followerCount === 1 ? 'fan' : 'fans'} will receive a prefilled product update for your review.`}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="shrink-0 gap-2 bg-purple-700 hover:bg-purple-800"
                    onClick={openFanComposer}
                    disabled={fanStatsLoading || fanAccessLoading || followerCount === 0}
                  >
                    <Send className="h-4 w-4" />
                    {fanAccess?.hasAccess === false ? 'Unlock Fan Updates' : 'Send to Fans'}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  Nothing is sent automatically. You can edit, preview, and confirm the message first.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-6 py-4">
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="truncate">{shareDetails.url}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {isArtistOwner && (
        <SendUpdateDialog
          open={fanDialogOpen}
          onOpenChange={setFanDialogOpen}
          followerCount={followerCount}
          initialSubject={fanUpdate.subject}
          initialBody={fanUpdate.body}
          prefillKey={`merch-${item.id}`}
        />
      )}
    </>
  );
}
