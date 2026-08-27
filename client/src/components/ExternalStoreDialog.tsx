import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, ExternalLink, ShieldCheck, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getExternalStoreDestination } from '@shared/externalStore';

type ExternalStoreDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  externalUrl: string;
  productTitle: string;
  sellerName: string;
};

export function ExternalStoreDialog({ open, onOpenChange, externalUrl, productTitle, sellerName }: ExternalStoreDialogProps) {
  const [copied, setCopied] = useState(false);
  const destination = useMemo(() => {
    try {
      return getExternalStoreDestination(externalUrl);
    } catch {
      return null;
    }
  }, [externalUrl]);
  const storeName = destination?.storeName || 'the external store';

  const copyLink = async () => {
    if (!destination) return;
    try {
      await navigator.clipboard.writeText(destination.url);
      setCopied(true);
      toast.success('Store link copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy automatically. Select and copy the link below.');
    }
  };

  const continueToStore = () => {
    if (!destination) return;
    window.open(destination.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[70] max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
            <Store className="h-5 w-5" />
          </div>
          <DialogTitle>{destination ? `Continue to ${storeName}` : 'External store link unavailable'}</DialogTitle>
          <DialogDescription>
            {destination
              ? <>You are leaving OlogyWood to view and purchase <strong>{productTitle}</strong> from {sellerName}’s external store.</>
              : <>The creator needs to update the external link for <strong>{productTitle}</strong> before fans can continue.</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 rounded-xl border bg-muted/40 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
            <div>
              <p className="font-medium">Checkout is handled by {storeName}</p>
              <p className="mt-1 text-sm text-muted-foreground">Prices, availability, payment, shipping, returns, and store access are controlled by the external provider.</p>
            </div>
          </div>

          {destination && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Destination</p>
              <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm">{destination.displayDomain}</span>
                <Button type="button" size="sm" variant="ghost" className="shrink-0 gap-1.5" onClick={copyLink}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">If the store temporarily restricts access</p>
              <p className="mt-1 text-sm">Close the restricted tab, copy the store link, and open it in your regular browser. Turning off a VPN or waiting before retrying may also help. OlogyWood cannot remove restrictions imposed by an outside store.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Stay on OlogyWood</Button>
          <Button type="button" className="gap-2 bg-purple-700 hover:bg-purple-800" disabled={!destination} onClick={continueToStore}>
            Continue to {storeName}
            <ExternalLink className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
