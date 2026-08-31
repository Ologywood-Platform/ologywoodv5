import { useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, BookOpen, Download, ExternalLink, FileText, ImageIcon, MapPin, Package, Share2, ShoppingCart, Truck } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { MerchCheckoutDialog } from '@/components/MerchCheckoutDialog';
import { MerchShareDialog } from '@/components/MerchShareDialog';
import { ExternalStoreDialog } from '@/components/ExternalStoreDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';

export default function MerchItem() {
  const { slug = '' } = useParams<{ slug: string }>();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [externalStoreOpen, setExternalStoreOpen] = useState(false);
  const itemId = useMemo(() => {
    const match = slug.match(/(?:^|-)(\d+)$/);
    return match ? Number(match[1]) : 0;
  }, [slug]);

  const { data: item, isLoading } = trpc.merch.getPublicItem.useQuery(
    { itemId },
    { enabled: itemId > 0 },
  );

  if (isLoading) {
    return <><SiteHeader /><main className="min-h-[620px] flex items-center justify-center"><div className="h-9 w-9 animate-spin rounded-full border-2 border-purple-200 border-t-purple-700" /></main></>;
  }

  if (!item || itemId <= 0) {
    return <><SiteHeader /><main className="min-h-[620px] flex items-center justify-center px-4"><Card className="max-w-lg w-full"><CardContent className="pt-8 text-center space-y-4"><Package className="h-12 w-12 text-muted-foreground mx-auto" /><h1 className="text-2xl font-bold">Creator Shop product not found</h1><p className="text-muted-foreground">This product may be unavailable or the link may be incorrect.</p><Button asChild><Link href="/browse">Browse creators</Link></Button></CardContent></Card></main></>;
  }

  const image = item.imageUrls?.[0] || null;
  const isBook = item.productCategory === 'book';
  const isDigitalBook = isBook && item.bookFormat === 'ebook';
  const soldOut = item.sellingMethod === 'ologywood' && item.trackInventory && (item.inventoryQuantity ?? 0) <= 0;
  function buyItem() {
    if (item.sellingMethod === 'external') {
      if (item.externalUrl) setExternalStoreOpen(true);
      return;
    }
    if (!soldOut) setCheckoutOpen(true);
  }

  return (
    <>
      <SiteHeader />
      <main className="min-h-[720px] bg-gradient-to-br from-purple-50 via-white to-cyan-50 dark:from-gray-950 dark:via-gray-950 dark:to-purple-950/30 px-4 py-10">
        <div className="max-w-6xl mx-auto">
          <Link href={item.sellerProfileUrl} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-purple-700 mb-6"><ArrowLeft className="h-4 w-4" />Back to {item.sellerName}</Link>
          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div className="aspect-square rounded-2xl overflow-hidden bg-white dark:bg-gray-900 border shadow-sm">
              {image ? <img src={image} alt={item.title} className="w-full h-full object-contain" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-20 w-20 text-gray-300" /></div>}
            </div>
            <div className="space-y-6 pt-1">
              <div className="flex items-start justify-between gap-4">
                <div><div className="flex flex-wrap gap-2"><Badge className={item.sellingMethod === 'ologywood' ? 'bg-purple-700' : 'bg-slate-800'}>{item.sellingMethod === 'ologywood' ? 'Buy on OlogyWood' : 'External store'}</Badge>{isBook && <Badge variant="outline" className="gap-1"><BookOpen className="h-3 w-3" />{item.bookFormat === 'ebook' ? 'eBook' : item.bookFormat === 'hardcover' ? 'Hardcover' : 'Paperback'}</Badge>}{item.isSigned && <Badge variant="outline">Signed copy</Badge>}</div><h1 className="text-4xl font-bold tracking-tight mt-3">{item.title}</h1><Link href={item.sellerProfileUrl} className="text-purple-700 hover:underline font-medium">by {item.sellerName}</Link></div>
                <Button variant="outline" aria-label="Share this product" className="shrink-0 gap-2" onClick={() => setShareOpen(true)}><Share2 className="h-4 w-4" />Share Product</Button>
              </div>
              <p className="text-3xl font-bold text-purple-700">{item.priceDisplay}</p>
              {item.description && <p className="text-base leading-7 text-muted-foreground whitespace-pre-line">{item.description}</p>}
              {isBook && <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 rounded-xl border bg-white/70 dark:bg-gray-900/70 p-4 text-sm"><p><strong>Format:</strong> {item.bookFormat === 'ebook' ? 'eBook' : item.bookFormat === 'hardcover' ? 'Hardcover' : 'Paperback'}</p>{item.publisher && <p><strong>Publisher:</strong> {item.publisher}</p>}{item.publicationDate && <p><strong>Published:</strong> {item.publicationDate}</p>}{item.edition && <p><strong>Edition:</strong> {item.edition}</p>}{item.pageCount && <p><strong>Pages:</strong> {item.pageCount}</p>}{item.language && <p><strong>Language:</strong> {item.language}</p>}{item.isbn && <p><strong>ISBN:</strong> {item.isbn}</p>}</div>}
              {item.sellingMethod === 'ologywood' && (isDigitalBook ? <div className="flex items-center gap-3 rounded-xl border border-purple-200 bg-purple-50/80 dark:bg-purple-950/30 p-4"><Download className="h-5 w-5 text-purple-700" /><div><p className="font-medium">Secure digital delivery</p><p className="text-xs text-muted-foreground">Access your purchased PDF or EPUB from OlogyWood orders after verified payment.</p></div></div> : <div className="grid sm:grid-cols-2 gap-3">{item.shippingAvailable && <div className="flex items-center gap-3 rounded-xl border bg-white/80 dark:bg-gray-900/80 p-4"><Truck className="h-5 w-5 text-purple-700" /><div><p className="font-medium">Shipping available</p><p className="text-xs text-muted-foreground">Author-managed fulfillment</p></div></div>}{item.pickupAvailable && <div className="flex items-center gap-3 rounded-xl border bg-white/80 dark:bg-gray-900/80 p-4"><MapPin className="h-5 w-5 text-purple-700" /><div><p className="font-medium">Local pickup</p><p className="text-xs text-muted-foreground">Details provided after purchase</p></div></div>}</div>)}
              {!isDigitalBook && item.fulfillmentTime && <p className="text-sm text-muted-foreground">Estimated fulfillment: {item.fulfillmentTime}</p>}
              <Button size="lg" className="w-full sm:w-auto gap-2 bg-purple-700 hover:bg-purple-800" disabled={soldOut || (item.sellingMethod === 'external' && !item.externalUrl)} onClick={buyItem}>{item.sellingMethod === 'ologywood' ? (isDigitalBook ? <Download className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />) : <ExternalLink className="h-5 w-5" />}{soldOut ? 'Sold out' : item.sellingMethod === 'ologywood' ? isDigitalBook ? 'Buy eBook securely' : isBook ? 'Order book securely' : 'Order securely' : 'Buy from external store'}</Button>
              <p className="text-xs text-muted-foreground">{item.sellingMethod === 'ologywood' ? isDigitalBook ? 'OlogyWood processes payment and provides purchase-authorized access. The author owns and supplies the eBook; OlogyWood is not the publisher.' : 'OlogyWood processes payment and tracks the order. The creator fulfills physical products directly.' : 'You’ll review the destination before leaving OlogyWood. Checkout and store access are handled by the creator’s external provider.'}</p>
            </div>
          </div>
        </div>
      </main>
      <MerchCheckoutDialog item={item} open={checkoutOpen} onOpenChange={setCheckoutOpen} />
      <MerchShareDialog item={item} open={shareOpen} onOpenChange={setShareOpen} />
      {item.externalUrl && <ExternalStoreDialog open={externalStoreOpen} onOpenChange={setExternalStoreOpen} externalUrl={item.externalUrl} productTitle={item.title} sellerName={item.sellerName} />}
    </>
  );
}
