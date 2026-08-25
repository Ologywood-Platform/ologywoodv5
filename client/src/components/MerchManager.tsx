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

interface MerchManagerProps {
  userType: 'artist' | 'venue';
}

type SellingMethod = 'ologywood' | 'external';
type VariantRow = { name: string; optionsText: string };

const emptyVariant: VariantRow = { name: '', optionsText: '' };

export function MerchManager({ userType }: MerchManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const label = userType === 'venue' ? 'Shop' : 'Merch';
  const { data: items, refetch: refetchItems } = trpc.merch.myItems.useQuery();
  const { data: limitInfo } = trpc.merch.getLimitInfo.useQuery();
  const { data: payoutStatus } = trpc.stripeConnect.getAccountStatus.useQuery();
  const nativeSellingReady = !!(payoutStatus?.connected && payoutStatus.chargesEnabled && payoutStatus.payoutsEnabled);

  const createMutation = trpc.merch.create.useMutation({
    onSuccess: () => {
      toast.success(`${label} item created.`);
      closeForm();
      refetchItems();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.merch.update.useMutation({
    onSuccess: () => {
      toast.success('Item updated.');
      closeForm();
      refetchItems();
    },
    onError: (err) => toast.error(err.message),
  });

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
  }

  function buildVariants() {
    return variantRows
      .map((row) => ({
        name: row.name.trim(),
        options: [...new Set(row.optionsText.split(',').map((value) => value.trim()).filter(Boolean))],
      }))
      .filter((row) => row.name && row.options.length > 0);
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error('Enter an item title.');
      return;
    }

    const variants = buildVariants();
    const nativePriceCents = Math.round(Number(priceDollars) * 100);
    const shippingAmountCents = Math.round(Number(shippingDollars || 0) * 100);

    if (sellingMethod === 'ologywood') {
      if (!nativeSellingReady) {
        toast.error('Connect and finish setting up payouts before selling through OlogyWood.');
        return;
      }
      if (!Number.isFinite(nativePriceCents) || nativePriceCents < 50) {
        toast.error('Enter a price of at least $0.50.');
        return;
      }
      if (!shippingAvailable && !pickupAvailable) {
        toast.error('Choose shipping, local pickup, or both.');
        return;
      }
      if (trackInventory && (!inventoryQuantity || Number(inventoryQuantity) < 0)) {
        toast.error('Enter the quantity available.');
        return;
      }
    } else if (!externalUrl.trim()) {
      toast.error('Add the external purchase link, or choose Sell through OlogyWood.');
      return;
    }

    const common = {
      title: title.trim(),
      description: description.trim() || undefined,
      sellingMethod,
      priceDisplay: sellingMethod === 'external' ? priceDisplay.trim() || 'See store' : undefined,
      priceInCents: sellingMethod === 'ologywood' ? nativePriceCents : null,
      externalUrl: sellingMethod === 'external' ? externalUrl.trim() : '',
      variants: sellingMethod === 'ologywood' ? variants : [],
      trackInventory: sellingMethod === 'ologywood' && trackInventory,
      inventoryQuantity: sellingMethod === 'ologywood' && trackInventory ? Number(inventoryQuantity) : null,
      shippingAvailable: sellingMethod === 'ologywood' && shippingAvailable,
      pickupAvailable: sellingMethod === 'ologywood' && pickupAvailable,
      shippingAmountCents: sellingMethod === 'ologywood' && shippingAvailable ? shippingAmountCents : 0,
      fulfillmentTime: sellingMethod === 'ologywood' ? fulfillmentTime.trim() || undefined : null,
    };

    if (editingItem) updateMutation.mutate({ id: editingItem.id, ...common });
    else createMutation.mutate({
      ...common,
      priceInCents: common.priceInCents || undefined,
      inventoryQuantity: common.inventoryQuantity ?? undefined,
      fulfillmentTime: common.fulfillmentTime || undefined,
    });
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
          <h2 className="text-xl font-semibold flex items-center gap-2"><ShoppingBag className="h-5 w-5" />{userType === 'venue' ? 'Shop & Offers' : 'My Merch'}</h2>
          <p className="text-sm text-muted-foreground mt-1">Sell directly through OlogyWood, or send fans to an external store when you already have one.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {limitInfo && <Badge variant="secondary">{limitInfo.currentCount}/{limitInfo.maxItems} items</Badge>}
          <Button variant="outline" onClick={() => { window.location.href = '/merch-orders'; }} className="gap-2"><PackageCheck className="h-4 w-4" />Merch Orders</Button>
          <Button onClick={() => { resetForm(); setShowAddDialog(true); }} disabled={limitInfo ? !limitInfo.canAdd : false} className="gap-2 bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4" />Add Item</Button>
        </div>
      </div>

      <Card className={nativeSellingReady ? 'border-emerald-200 bg-emerald-50/60' : 'border-violet-200 bg-violet-50/60'}>
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              {nativeSellingReady ? <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" /> : <Banknote className="h-5 w-5 text-violet-600 mt-0.5" />}
              <div>
                <p className="font-medium text-sm">{nativeSellingReady ? 'OlogyWood checkout is ready' : 'Want OlogyWood to take the order and payment?'}</p>
                <p className="text-xs text-muted-foreground mt-1">You fulfill and ship the order. OlogyWood securely processes payment and helps you track it.</p>
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
        <Card className="border-dashed border-2"><CardContent className="py-12 text-center"><ShoppingBag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" /><h3 className="font-semibold text-lg mb-2">No items yet</h3><p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">You do not need Shopify or another website. Add an item, choose OlogyWood checkout, and fulfill the order yourself.</p><Button onClick={() => setShowAddDialog(true)} className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />Add Your First Item</Button></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item: any) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                {item.imageUrls?.[0] ? <img src={item.imageUrls[0]} alt={item.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-12 w-12 text-gray-300" /></div>}
                <Badge className={`absolute top-2 left-2 ${item.sellingMethod === 'ologywood' ? 'bg-purple-700' : 'bg-slate-700'}`}>{item.sellingMethod === 'ologywood' ? 'OlogyWood checkout' : 'External store'}</Badge>
                {!item.isActive && <Badge className="absolute top-2 right-2 bg-gray-800">Hidden</Badge>}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold truncate">{item.title}</h3>
                <p className="text-purple-700 font-bold mt-0.5">{item.priceDisplay}</p>
                {item.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>}
                {item.sellingMethod === 'ologywood' && <div className="flex flex-wrap gap-1.5 mt-3 text-xs"><Badge variant="outline">{item.shippingAvailable ? 'Shipping' : 'No shipping'}</Badge>{item.pickupAvailable && <Badge variant="outline">Pickup</Badge>}{item.trackInventory && <Badge variant="outline">{item.inventoryQuantity ?? 0} in stock</Badge>}</div>}
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingItem ? 'Edit Item' : 'Add Merch Item'}</DialogTitle></DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-2"><Label htmlFor="merch-title">Item title *</Label><Input id="merch-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Tour T-shirt, signed vinyl, poster..." maxLength={200} /></div>

            <div className="space-y-2">
              <Label>How will fans buy this item?</Label>
              <div className="grid sm:grid-cols-2 gap-3">
                <button type="button" onClick={() => setSellingMethod('ologywood')} className={`p-4 border rounded-lg text-left ${sellingMethod === 'ologywood' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'hover:border-purple-300'}`}><Banknote className="h-5 w-5 text-purple-700 mb-2" /><p className="font-medium text-sm">Sell through OlogyWood</p><p className="text-xs text-muted-foreground mt-1">We take the payment and track the order. You fulfill it.</p></button>
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
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2"><Label htmlFor="merch-price">Price *</Label><div className="relative"><span className="absolute left-3 top-2.5 text-muted-foreground">$</span><Input id="merch-price" value={priceDollars} onChange={(event) => setPriceDollars(event.target.value)} className="pl-7" inputMode="decimal" placeholder="25.00" /></div></div>
                  <div className="space-y-2"><Label htmlFor="fulfillment-time">Estimated fulfillment time</Label><Input id="fulfillment-time" value={fulfillmentTime} onChange={(event) => setFulfillmentTime(event.target.value)} placeholder="3–5 business days" maxLength={100} /></div>
                </div>

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

            <div className="space-y-2"><Label htmlFor="merch-desc">Description</Label><Textarea id="merch-desc" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the item, materials, fit, or what the buyer receives..." maxLength={500} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={closeForm}>Cancel</Button><Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="bg-purple-600 hover:bg-purple-700">{(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}{editingItem ? 'Save Changes' : 'Add Item'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
