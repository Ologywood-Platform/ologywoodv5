import { useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Banknote,
  BookOpen,
  CheckCircle2,
  Crown,
  Edit2,
  ExternalLink,
  Image as ImageIcon,
  Link2,
  Loader2,
  PackageCheck,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import {
  BOOK_FORMAT_OPTIONS,
  BOOK_LANGUAGE_OPTIONS,
  MAX_EBOOK_SIZE_BYTES,
  isEbook,
  type BookFormat,
  type ProductCategory,
} from '@shared/bookCommerce';

interface MerchManagerProps {
  userType: 'artist' | 'venue';
}

type SellingMethod = 'ologywood' | 'external';
type VariantRow = { name: string; optionsText: string };

const emptyVariant: VariantRow = { name: '', optionsText: '' };

export function MerchManager({ userType }: MerchManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ebookFileInputRef = useRef<HTMLInputElement>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sellingMethod, setSellingMethod] = useState<SellingMethod>('ologywood');
  const [priceDollars, setPriceDollars] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);
  const [trackInventory, setTrackInventory] = useState(false);
  const [inventoryQuantity, setInventoryQuantity] = useState('');
  const [shippingAvailable, setShippingAvailable] = useState(true);
  const [pickupAvailable, setPickupAvailable] = useState(false);
  const [shippingDollars, setShippingDollars] = useState('0');
  const [fulfillmentTime, setFulfillmentTime] = useState('3–5 business days');
  const [productCategory, setProductCategory] = useState<ProductCategory>('merch');
  const [bookFormat, setBookFormat] = useState<BookFormat>('paperback');
  const [isbn, setIsbn] = useState('');
  const [publisher, setPublisher] = useState('');
  const [publicationDate, setPublicationDate] = useState('');
  const [edition, setEdition] = useState('');
  const [pageCount, setPageCount] = useState('');
  const [language, setLanguage] = useState('English');
  const [isSigned, setIsSigned] = useState(false);
  const [ebookRightsConfirmed, setEbookRightsConfirmed] = useState(false);
  const [ebookFile, setEbookFile] = useState<File | null>(null);
  const [uploadingEbookItemId, setUploadingEbookItemId] = useState<number | null>(null);

  const label = userType === 'venue' ? 'Shop' : 'Creator Shop';
  const { data: items, refetch: refetchItems } = trpc.merch.myItems.useQuery();
  const { data: limitInfo } = trpc.merch.getLimitInfo.useQuery();
  const { data: payoutStatus } = trpc.stripeConnect.getAccountStatus.useQuery();
  const nativeSellingReady = !!(payoutStatus?.connected && payoutStatus.chargesEnabled && payoutStatus.payoutsEnabled);

  const createMutation = trpc.merch.create.useMutation();

  const updateMutation = trpc.merch.update.useMutation();

  const deleteMutation = trpc.merch.delete.useMutation({
    onSuccess: () => {
      toast.success('Item deleted.');
      refetchItems();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadImageMutation = trpc.merch.uploadImage.useMutation({
    onSuccess: () => {
      toast.success('Image uploaded.');
      setUploadingItemId(null);
      refetchItems();
    },
    onError: (err) => {
      toast.error(err.message);
      setUploadingItemId(null);
    },
  });

  const deleteImageMutation = trpc.merch.deleteImage.useMutation({
    onSuccess: () => {
      toast.success('Image removed.');
      refetchItems();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setTitle('');
    setDescription('');
    setSellingMethod('ologywood');
    setPriceDollars('');
    setPriceDisplay('');
    setExternalUrl('');
    setVariantRows([]);
    setTrackInventory(false);
    setInventoryQuantity('');
    setShippingAvailable(true);
    setPickupAvailable(false);
    setShippingDollars('0');
    setFulfillmentTime('3–5 business days');
    setProductCategory('merch');
    setBookFormat('paperback');
    setIsbn('');
    setPublisher('');
    setPublicationDate('');
    setEdition('');
    setPageCount('');
    setLanguage('English');
    setIsSigned(false);
    setEbookRightsConfirmed(false);
    setEbookFile(null);
  }

  function closeForm() {
    setShowAddDialog(false);
    setEditingItem(null);
    resetForm();
  }

  function openEdit(item: any) {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setSellingMethod(item.sellingMethod || 'external');
    setPriceDollars(item.priceInCents != null ? (item.priceInCents / 100).toFixed(2) : '');
    setPriceDisplay(item.priceDisplay || '');
    setExternalUrl(item.externalUrl || '');
    setVariantRows(((item.variants || []) as Array<{ name: string; options: string[] }>).map((variant) => ({
      name: variant.name,
      optionsText: variant.options.join(', '),
    })));
    setTrackInventory(!!item.trackInventory);
    setInventoryQuantity(item.inventoryQuantity != null ? String(item.inventoryQuantity) : '');
    setShippingAvailable(item.shippingAvailable ?? true);
    setPickupAvailable(!!item.pickupAvailable);
    setShippingDollars(((item.shippingAmountCents || 0) / 100).toFixed(2));
    setFulfillmentTime(item.fulfillmentTime || '3–5 business days');
    setProductCategory(item.productCategory || 'merch');
    setBookFormat(item.bookFormat || 'paperback');
    setIsbn(item.isbn || '');
    setPublisher(item.publisher || '');
    setPublicationDate(item.publicationDate || '');
    setEdition(item.edition || '');
    setPageCount(item.pageCount != null ? String(item.pageCount) : '');
    setLanguage(item.language || 'English');
    setIsSigned(!!item.isSigned);
    setEbookRightsConfirmed(!!item.ebookRightsConfirmed);
    setEbookFile(null);
  }

  function buildVariants() {
    return variantRows
      .map((row) => ({
        name: row.name.trim(),
        options: [...new Set(row.optionsText.split(',').map((value) => value.trim()).filter(Boolean))],
      }))
      .filter((row) => row.name && row.options.length > 0);
  }

  async function uploadEbook(itemId: number, file: File) {
    setUploadingEbookItemId(itemId);
    const formData = new FormData();
    formData.append('ebook', file);
    formData.append('rightsConfirmed', 'true');
    const response = await fetch(`/api/books/upload/${itemId}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'eBook upload failed');
    return payload;
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('Enter an item title.');
      return;
    }

    const variants = buildVariants();
    const nativePriceCents = Math.round(Number(priceDollars) * 100);
    const shippingAmountCents = Math.round(Number(shippingDollars || 0) * 100);
    const digitalDelivery = productCategory === 'book' && isEbook(bookFormat) && sellingMethod === 'ologywood';

    if (sellingMethod === 'ologywood') {
      if (!nativeSellingReady) {
        toast.error('Connect and finish setting up payouts before selling through OlogyWood.');
        return;
      }
      if (!Number.isFinite(nativePriceCents) || nativePriceCents < 50) {
        toast.error('Enter a price of at least $0.50.');
        return;
      }
      if (!digitalDelivery && !shippingAvailable && !pickupAvailable) {
        toast.error('Choose shipping, local pickup, or both.');
        return;
      }
      if (!digitalDelivery && trackInventory && (!inventoryQuantity || Number(inventoryQuantity) < 0)) {
        toast.error('Enter the quantity available.');
        return;
      }
    } else if (!externalUrl.trim()) {
      toast.error('Add the external purchase link, or choose Sell through OlogyWood.');
      return;
    }

    if (digitalDelivery) {
      if (!ebookRightsConfirmed) {
        toast.error('Confirm that you have the rights to sell this eBook.');
        return;
      }
      if (!ebookFile && !editingItem?.ebookFileName) {
        toast.error('Select a PDF or EPUB file before publishing this eBook.');
        return;
      }
    }

    const common = {
      title: title.trim(),
      description: description.trim() || undefined,
      sellingMethod,
      priceDisplay: sellingMethod === 'external' ? priceDisplay.trim() || 'See store' : undefined,
      priceInCents: sellingMethod === 'ologywood' ? nativePriceCents : null,
      externalUrl: sellingMethod === 'external' ? externalUrl.trim() : '',
      variants: sellingMethod === 'ologywood' && !digitalDelivery ? variants : [],
      trackInventory: sellingMethod === 'ologywood' && !digitalDelivery && trackInventory,
      inventoryQuantity: sellingMethod === 'ologywood' && !digitalDelivery && trackInventory ? Number(inventoryQuantity) : null,
      shippingAvailable: sellingMethod === 'ologywood' && !digitalDelivery && shippingAvailable,
      pickupAvailable: sellingMethod === 'ologywood' && !digitalDelivery && pickupAvailable,
      shippingAmountCents: sellingMethod === 'ologywood' && !digitalDelivery && shippingAvailable ? shippingAmountCents : 0,
      fulfillmentTime: sellingMethod === 'ologywood' && !digitalDelivery ? fulfillmentTime.trim() || undefined : null,
      productCategory,
      bookFormat: productCategory === 'book' ? bookFormat : null,
      isbn: productCategory === 'book' ? isbn.trim() || null : null,
      publisher: productCategory === 'book' ? publisher.trim() || null : null,
      publicationDate: productCategory === 'book' ? publicationDate || null : null,
      edition: productCategory === 'book' ? edition.trim() || null : null,
      pageCount: productCategory === 'book' && pageCount ? Number(pageCount) : null,
      language: productCategory === 'book' ? language : null,
      isSigned: productCategory === 'book' && !digitalDelivery && isSigned,
      ebookRightsConfirmed: digitalDelivery && ebookRightsConfirmed,
    };

    try {
      if (editingItem) {
        const hasNewEbook = digitalDelivery && Boolean(ebookFile);
        await updateMutation.mutateAsync({
          id: editingItem.id,
          ...common,
          isActive: hasNewEbook ? false : editingItem.isActive,
        });
        if (hasNewEbook && ebookFile) {
          await uploadEbook(editingItem.id, ebookFile);
          await updateMutation.mutateAsync({ id: editingItem.id, isActive: true, ebookRightsConfirmed: true });
        }
        toast.success(productCategory === 'book' ? 'Book updated.' : 'Item updated.');
      } else {
        const created = await createMutation.mutateAsync({
          ...common,
          priceInCents: common.priceInCents || undefined,
          inventoryQuantity: common.inventoryQuantity ?? undefined,
          fulfillmentTime: common.fulfillmentTime || undefined,
          bookFormat: productCategory === 'book' ? bookFormat : undefined,
          isbn: common.isbn || undefined,
          publisher: common.publisher || undefined,
          publicationDate: common.publicationDate || undefined,
          edition: common.edition || undefined,
          pageCount: common.pageCount || undefined,
          language: common.language || undefined,
          isActive: !digitalDelivery,
        });
        if (digitalDelivery && ebookFile) {
          await uploadEbook(created.id, ebookFile);
          await updateMutation.mutateAsync({ id: created.id, isActive: true, ebookRightsConfirmed: true });
        }
        toast.success(productCategory === 'book' ? 'Book added to your Creator Shop.' : `${label} item created.`);
      }
      closeForm();
      await refetchItems();
    } catch (error: any) {
      toast.error(error.message || 'Could not save this item.');
    } finally {
      setUploadingEbookItemId(null);
    }
  }

  function handleImageUpload(itemId: number, file: File) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed.');
      setUploadingItemId(null);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Images must be under 2MB. Please compress or resize.');
      setUploadingItemId(null);
      return;
    }
    setUploadingItemId(itemId);
    const reader = new FileReader();
    reader.onload = () => uploadImageMutation.mutate({
      itemId,
      fileData: reader.result as string,
      fileName: file.name,
      mimeType: file.type,
    });
    reader.readAsDataURL(file);
  }

  if (limitInfo && limitInfo.maxItems === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <Crown className="h-12 w-12 text-amber-600" />
            <div>
              <h3 className="font-semibold text-lg">{label} is a paid feature</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">Upgrade to Starter or Professional to add products to your profile.</p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => { window.location.href = '/pricing'; }}>View Plans</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2"><ShoppingBag className="h-5 w-5" />{userType === 'venue' ? 'Shop & Offers' : 'Creator Shop'}</h2>
          <p className="text-sm text-muted-foreground mt-1">Sell merchandise, physical books, or secure eBooks through OlogyWood, or link to an external store.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {limitInfo && <Badge variant="secondary">{limitInfo.currentCount}/{limitInfo.maxItems} items</Badge>}
          <Button variant="outline" onClick={() => { window.location.href = '/merch-orders'; }} className="gap-2"><PackageCheck className="h-4 w-4" />Shop Orders</Button>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }} disabled={limitInfo ? !limitInfo.canAdd : false} className="gap-2 bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4" />Add Product</Button>
        </div>
      </div>

      <Card className={nativeSellingReady ? 'border-emerald-200 bg-emerald-50/60' : 'border-violet-200 bg-violet-50/60'}>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              {nativeSellingReady ? <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" /> : <Banknote className="h-5 w-5 text-violet-600 mt-0.5" />}
              <div>
                <p className="font-medium text-sm">{nativeSellingReady ? 'OlogyWood checkout is ready' : 'Want OlogyWood to take the order and payment?'}</p>
                <p className="text-xs text-muted-foreground mt-1">You fulfill physical orders. OlogyWood securely processes payment, tracks orders, and unlocks paid eBooks.</p>
              </div>
            </div>
            {!nativeSellingReady && <Button size="sm" onClick={() => { window.location.href = '/dashboard?stripe=connect'; }}>Connect Payouts</Button>}
          </div>
        </CardContent>
      </Card>

      {limitInfo && !limitInfo.canAdd && limitInfo.maxItems > 0 && (
        <Card className="border-amber-200 bg-amber-50/50"><CardContent className="py-3"><div className="flex items-center gap-2 text-sm text-amber-800"><AlertTriangle className="h-4 w-4" />You've reached your item limit. Upgrade to add more.</div></CardContent></Card>
      )}

      {!items || items.length === 0 ? (
        <Card className="border-dashed border-2"><CardContent className="py-12 text-center"><ShoppingBag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" /><h3 className="font-semibold text-lg mb-2">No products yet</h3><p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">Add merchandise, a physical book, or an eBook. OlogyWood can process payment while you control the work and fulfillment.</p><Button onClick={() => setShowAddDialog(true)} className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />Add Your First Product</Button></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item: any) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                {item.imageUrls?.[0] ? <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-12 w-12 text-gray-300" /></div>}
                {item.productCategory === 'book' && <Badge className="absolute bottom-2 left-2 bg-amber-700"><BookOpen className="h-3 w-3 mr-1" />{BOOK_FORMAT_OPTIONS.find((option) => option.value === item.bookFormat)?.label || 'Book'}</Badge>}
                <Badge className={`absolute top-2 left-2 ${item.sellingMethod === 'ologywood' ? 'bg-purple-700' : 'bg-slate-700'}`}>{item.sellingMethod === 'ologywood' ? 'OlogyWood checkout' : 'External store'}</Badge>
                {!item.isActive && <Badge className="absolute top-2 right-2 bg-gray-800">Hidden</Badge>}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{item.title}</h3>
                <p className="text-purple-700 font-bold mt-0.5">{item.priceDisplay}</p>
                {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                {item.sellingMethod === 'ologywood' && <div className="flex flex-wrap gap-1.5 mt-3 text-xs">{item.productCategory === 'book' && item.bookFormat === 'ebook' ? <Badge variant="outline">Secure digital delivery</Badge> : <><Badge variant="outline">{item.shippingAvailable ? 'Shipping' : 'No shipping'}</Badge>{item.pickupAvailable && <Badge variant="outline">Pickup</Badge>}{item.trackInventory && <Badge variant="outline">{item.inventoryQuantity ?? 0} in stock</Badge>}</>}{item.isSigned && <Badge variant="outline">Signed copy</Badge>}</div>}
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t">
                  <Button variant="outline" size="sm" onClick={() => openEdit(item)}><Edit2 className="h-3 w-3 mr-1" />Edit</Button>
                  <Button variant="outline" size="sm" onClick={() => { setUploadingItemId(item.id); fileInputRef.current?.click(); }} disabled={uploadingItemId === item.id || item.imageUrls?.length >= 2}>{uploadingItemId === item.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Upload className="h-3 w-3 mr-1" />Photo</>}</Button>
                  {item.externalUrl && <Button variant="outline" size="sm" onClick={() => window.open(item.externalUrl, '_blank')}><ExternalLink className="h-3 w-3 mr-1" />Store</Button>}
                  <Button variant="outline" size="sm" className="text-red-600 ml-auto" onClick={() => { if (confirm('Delete this item?')) deleteMutation.mutate({ id: item.id }); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
                {item.imageUrls?.length > 0 && <div className="flex gap-2 mt-3">{item.imageUrls.map((url: string, idx: number) => <div key={idx} className="relative w-12 h-12 rounded overflow-hidden group"><img src={url} alt="" className="w-full h-full object-cover" /><button onClick={() => deleteImageMutation.mutate({ itemId: item.id, imageUrl: url })} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="h-3 w-3 text-white" /></button></div>)}</div>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file && uploadingItemId) handleImageUpload(uploadingItemId, file); else setUploadingItemId(null); event.target.value = ''; }} />

      <Dialog open={showAddDialog || !!editingItem} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="z-[10002] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingItem ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2">
              <Label>What are you selling?</Label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setProductCategory('merch')} className={`p-4 border rounded-lg text-left ${productCategory === 'merch' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'hover:border-purple-300'}`}><ShoppingBag className="h-5 w-5 text-purple-700 mb-2" /><p className="font-medium text-sm">Merchandise</p><p className="text-xs text-muted-foreground mt-1">Apparel, art, music, and other creator products.</p></button>
                <button type="button" onClick={() => setProductCategory('book')} className={`p-4 border rounded-lg text-left ${productCategory === 'book' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'hover:border-purple-300'}`}><BookOpen className="h-5 w-5 text-purple-700 mb-2" /><p className="font-medium text-sm">Book</p><p className="text-xs text-muted-foreground mt-1">Paperback, hardcover, or securely delivered eBook.</p></button>
              </div>
            </div>

            <div className="space-y-2"><Label htmlFor="merch-title">{productCategory === 'book' ? 'Book title' : 'Item title'} *</Label><Input id="merch-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder={productCategory === 'book' ? 'Enter the book title' : 'Tour T-shirt, signed vinyl, poster...'} maxLength={200} /></div>

            {productCategory === 'book' && (
              <div className="space-y-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <div className="space-y-2"><Label htmlFor="book-format">Book format *</Label><select id="book-format" value={bookFormat} onChange={(event) => setBookFormat(event.target.value as BookFormat)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">{BOOK_FORMAT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label} — {option.description}</option>)}</select></div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="book-isbn">ISBN-10 or ISBN-13</Label><Input id="book-isbn" value={isbn} onChange={(event) => setIsbn(event.target.value)} placeholder="Hyphens are optional" maxLength={32} /></div>
                  <div className="space-y-2"><Label htmlFor="book-publisher">Publisher or imprint</Label><Input id="book-publisher" value={publisher} onChange={(event) => setPublisher(event.target.value)} placeholder="Independent / self-published is okay" maxLength={255} /></div>
                  <div className="space-y-2"><Label htmlFor="book-publication-date">Publication date</Label><Input id="book-publication-date" type="date" value={publicationDate} onChange={(event) => setPublicationDate(event.target.value)} /></div>
                  <div className="space-y-2"><Label htmlFor="book-edition">Edition</Label><Input id="book-edition" value={edition} onChange={(event) => setEdition(event.target.value)} placeholder="First edition, revised edition..." maxLength={100} /></div>
                  <div className="space-y-2"><Label htmlFor="book-pages">Page count</Label><Input id="book-pages" type="number" min="1" value={pageCount} onChange={(event) => setPageCount(event.target.value)} placeholder="240" /></div>
                  <div className="space-y-2"><Label htmlFor="book-language">Language</Label><select id="book-language" value={language} onChange={(event) => setLanguage(event.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">{BOOK_LANGUAGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}</select></div>
                </div>
                {bookFormat !== 'ebook' && <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={isSigned} onChange={(event) => setIsSigned(event.target.checked)} className="h-4 w-4" />Offer this as a signed copy</label>}
              </div>
            )}

            <div className="space-y-2">
              <Label>How will readers or fans buy this product?</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <button type="button" onClick={() => setSellingMethod('ologywood')} className={`p-4 border rounded-lg text-left ${sellingMethod === 'ologywood' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'hover:border-purple-300'}`}><Banknote className="h-5 w-5 text-purple-700 mb-2" /><p className="font-medium text-sm">Sell through OlogyWood</p><p className="text-xs text-muted-foreground mt-1">We process payment and track the order. You fulfill physical products; eBooks unlock securely.</p></button>
                <button type="button" onClick={() => setSellingMethod('external')} className={`p-4 border rounded-lg text-left ${sellingMethod === 'external' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'hover:border-purple-300'}`}><Link2 className="h-5 w-5 text-purple-700 mb-2" /><p className="font-medium text-sm">Use an external store</p><p className="text-xs text-muted-foreground mt-1">Send buyers to Shopify, Etsy, Bandcamp, or another checkout.</p></button>
              </div>
            </div>

            {sellingMethod === 'external' ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="merch-price-display">Price display</Label><Input id="merch-price-display" value={priceDisplay} onChange={(event) => setPriceDisplay(event.target.value)} placeholder="$25.00 or From $15" maxLength={50} /></div>
                <div className="space-y-2"><Label htmlFor="merch-url">External purchase link *</Label><Input id="merch-url" value={externalUrl} onChange={(event) => setExternalUrl(event.target.value)} placeholder="https://your-store.com/product" type="url" /><p className="text-xs text-muted-foreground">Only required when using an external store.</p></div>
              </div>
            ) : (
              <>
                {!nativeSellingReady && <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><p className="font-medium">Connect payouts before publishing</p><p className="text-xs mt-1">OlogyWood cannot accept an order until Stripe confirms your account can receive payments and payouts.</p><Button size="sm" className="mt-3" onClick={() => { window.location.href = '/dashboard?stripe=connect'; }}>Connect Payouts</Button></div>}
                <div className={`grid gap-4 ${productCategory === 'book' && isEbook(bookFormat) ? '' : 'sm:grid-cols-2'}`}>
                  <div className="space-y-2"><Label htmlFor="merch-price">Price *</Label><div className="relative"><span className="absolute left-3 top-2.5 text-muted-foreground">$</span><Input id="merch-price" value={priceDollars} onChange={(event) => setPriceDollars(event.target.value)} className="pl-7" inputMode="decimal" placeholder="25.00" /></div></div>
                  {!(productCategory === 'book' && isEbook(bookFormat)) && <div className="space-y-2"><Label htmlFor="fulfillment-time">Estimated fulfillment time</Label><Input id="fulfillment-time" value={fulfillmentTime} onChange={(event) => setFulfillmentTime(event.target.value)} placeholder="3–5 business days" maxLength={100} /></div>}
                </div>

                {productCategory === 'book' && isEbook(bookFormat) ? (
                  <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 space-y-4">
                    <div><p className="font-medium text-sm">Private eBook file</p><p className="text-xs text-muted-foreground mt-1">PDF or EPUB, up to {Math.round(MAX_EBOOK_SIZE_BYTES / 1024 / 1024)} MB. The storage address is never shown publicly.</p></div>
                    <input ref={ebookFileInputRef} type="file" accept="application/pdf,application/epub+zip,.pdf,.epub" className="hidden" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      if (!['application/pdf', 'application/epub+zip'].includes(file.type) && !/\.(pdf|epub)$/i.test(file.name)) { toast.error('Choose a PDF or EPUB file.'); event.target.value = ''; return; }
                      if (file.size > MAX_EBOOK_SIZE_BYTES) { toast.error('eBook files must be under 25 MB.'); event.target.value = ''; return; }
                      setEbookFile(file);
                    }} />
                    <Button type="button" variant="outline" onClick={() => ebookFileInputRef.current?.click()} className="gap-2"><Upload className="h-4 w-4" />{ebookFile || editingItem?.ebookFileName ? 'Replace eBook file' : 'Select eBook file'}</Button>
                    {(ebookFile || editingItem?.ebookFileName) && <div className="rounded-md bg-white border px-3 py-2 text-sm"><p className="font-medium truncate">{ebookFile?.name || editingItem?.ebookFileName}</p><p className="text-xs text-muted-foreground">{ebookFile ? `${(ebookFile.size / 1024 / 1024).toFixed(1)} MB · uploads securely after product details are saved` : 'Private file already uploaded'}</p></div>}
                    <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={ebookRightsConfirmed} onChange={(event) => setEbookRightsConfirmed(event.target.checked)} className="h-4 w-4 mt-0.5" /><span>I own or control the rights needed to sell and distribute this eBook. OlogyWood provides commerce and access tools but is not the publisher.</span></label>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between"><div><Label>Options and variants</Label><p className="text-xs text-muted-foreground">Optional. Add sizes, colors, formats, or another choice.</p></div>{variantRows.length < 3 && <Button type="button" variant="outline" size="sm" onClick={() => setVariantRows([...variantRows, { ...emptyVariant }])}><Plus className="h-3 w-3 mr-1" />Add option</Button>}</div>
                      {variantRows.map((row, index) => <div key={index} className="grid grid-cols-[1fr_2fr_auto] gap-2"><Input value={row.name} onChange={(event) => setVariantRows(variantRows.map((item, rowIndex) => rowIndex === index ? { ...item, name: event.target.value } : item))} placeholder="Size" /><Input value={row.optionsText} onChange={(event) => setVariantRows(variantRows.map((item, rowIndex) => rowIndex === index ? { ...item, optionsText: event.target.value } : item))} placeholder="S, M, L, XL" /><Button type="button" variant="ghost" size="icon" onClick={() => setVariantRows(variantRows.filter((_, rowIndex) => rowIndex !== index))}><X className="h-4 w-4" /></Button></div>)}
                    </div>

                    <div className="rounded-lg border p-4 space-y-4">
                      <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-purple-700" /><p className="font-medium text-sm">Delivery and fulfillment</p></div>
                      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={shippingAvailable} onChange={(event) => setShippingAvailable(event.target.checked)} className="h-4 w-4" />Offer shipping</label>
                      {shippingAvailable && <div className="space-y-2 max-w-xs"><Label htmlFor="shipping-fee">Flat shipping charge</Label><div className="relative"><span className="absolute left-3 top-2.5 text-muted-foreground">$</span><Input id="shipping-fee" value={shippingDollars} onChange={(event) => setShippingDollars(event.target.value)} className="pl-7" inputMode="decimal" placeholder="0.00" /></div></div>}
                      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={pickupAvailable} onChange={(event) => setPickupAvailable(event.target.checked)} className="h-4 w-4" />Offer local pickup or in-person delivery</label>
                      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={trackInventory} onChange={(event) => setTrackInventory(event.target.checked)} className="h-4 w-4" />Track available quantity</label>
                      {trackInventory && <div className="space-y-2 max-w-xs"><Label htmlFor="inventory">Quantity available</Label><Input id="inventory" value={inventoryQuantity} onChange={(event) => setInventoryQuantity(event.target.value)} type="number" min="0" /></div>}
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-2"><Label htmlFor="merch-desc">Description</Label><Textarea id="merch-desc" value={description} onChange={(event) => setDescription(event.target.value)} placeholder={productCategory === 'book' ? 'Describe the story or subject, intended readers, and what makes this edition special...' : 'Describe the item, materials, fit, or what the buyer receives...'} maxLength={500} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={closeForm}>Cancel</Button><Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || uploadingEbookItemId !== null} className="bg-purple-600 hover:bg-purple-700">{(createMutation.isPending || updateMutation.isPending || uploadingEbookItemId !== null) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingItem ? 'Save Changes' : productCategory === 'book' ? 'Add Book' : 'Add Product'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
