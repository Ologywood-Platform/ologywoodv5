import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus, Edit2, Trash2, Image as ImageIcon, ExternalLink, GripVertical,
  ShoppingBag, Upload, X, Loader2, Crown, AlertTriangle
} from 'lucide-react';

interface MerchManagerProps {
  userType: 'artist' | 'venue';
}

export function MerchManager({ userType }: MerchManagerProps) {
  // Using sonner toast (imported at top)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [uploadingItemId, setUploadingItemId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceDisplay, setPriceDisplay] = useState('');
  const [externalUrl, setExternalUrl] = useState('');

  const label = userType === 'venue' ? 'Shop' : 'Merch';

  // Queries
  const { data: items, refetch: refetchItems } = trpc.merch.myItems.useQuery();
  const { data: limitInfo } = trpc.merch.getLimitInfo.useQuery();

  // Mutations
  const createMutation = trpc.merch.create.useMutation({
    onSuccess: () => {
      toast.success(`Your ${label.toLowerCase()} item has been created.`);
      resetForm();
      setShowAddDialog(false);
      refetchItems();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const updateMutation = trpc.merch.update.useMutation({
    onSuccess: () => {
      toast.success('Item updated');
      resetForm();
      setEditingItem(null);
      refetchItems();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteMutation = trpc.merch.delete.useMutation({
    onSuccess: () => {
      toast.success('Item deleted');
      refetchItems();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const uploadImageMutation = trpc.merch.uploadImage.useMutation({
    onSuccess: () => {
      toast.success('Image uploaded');
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
      toast.success('Image removed');
      refetchItems();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  function resetForm() {
    setTitle('');
    setDescription('');
    setPriceDisplay('');
    setExternalUrl('');
  }

  function openEdit(item: any) {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setPriceDisplay(item.priceDisplay);
    setExternalUrl(item.externalUrl);
  }

  function handleSubmit() {
    if (!title.trim() || !priceDisplay.trim() || !externalUrl.trim()) {
      toast.error('Title, price, and link are required.');
      return;
    }

    if (editingItem) {
      updateMutation.mutate({
        id: editingItem.id,
        title: title.trim(),
        description: description.trim() || undefined,
        priceDisplay: priceDisplay.trim(),
        externalUrl: externalUrl.trim(),
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        description: description.trim() || undefined,
        priceDisplay: priceDisplay.trim(),
        externalUrl: externalUrl.trim(),
      });
    }
  }

  function handleImageUpload(itemId: number, file: File) {
    // Validate type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed.');
      return;
    }

    // Validate size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Images must be under 2MB. Please compress or resize.');
      return;
    }

    setUploadingItemId(itemId);

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      uploadImageMutation.mutate({
        itemId,
        fileData: base64,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  }

  // Tier gate: can't add items
  if (limitInfo && limitInfo.maxItems === 0) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Crown className="h-8 w-8 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{label} is a paid feature</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Upgrade to Starter (6 items) or Professional (15 items) to showcase your
                {userType === 'venue' ? ' branded items, gift cards, and offers' : ' merchandise and products'} on your profile.
              </p>
            </div>
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href = '/pricing'}>
              <Crown className="h-4 w-4" />
              View Plans
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with limit info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            {userType === 'venue' ? 'Shop & Offers' : 'My Merch'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {userType === 'venue'
              ? 'Showcase branded items, gift cards, and offers. Links open your external store.'
              : 'Showcase your merchandise. Links open your external store — you keep 100%.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {limitInfo && (
            <Badge variant="secondary" className="text-xs">
              {limitInfo.currentCount}/{limitInfo.maxItems} items
            </Badge>
          )}
          <Button
            onClick={() => { resetForm(); setShowAddDialog(true); }}
            disabled={limitInfo ? !limitInfo.canAdd : false}
            className="gap-2 bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Limit warning */}
      {limitInfo && !limitInfo.canAdd && limitInfo.maxItems > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>You've reached your {limitInfo.maxItems} item limit. Upgrade to Professional for up to 15 items.</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items grid */}
      {!items || items.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No items yet</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
              {userType === 'venue'
                ? 'Add branded items, gift cards, or VIP packages to showcase on your profile.'
                : 'Add your merchandise — t-shirts, vinyl, posters, stickers — and link to your store.'}
            </p>
            <Button onClick={() => { resetForm(); setShowAddDialog(true); }} className="gap-2 bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item: any) => (
            <Card key={item.id} className="overflow-hidden">
              {/* Image area */}
              <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                {item.imageUrls && item.imageUrls.length > 0 ? (
                  <img
                    src={item.imageUrls[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-300 dark:text-gray-600" />
                  </div>
                )}
                {/* Image count badge */}
                {item.imageUrls && item.imageUrls.length > 1 && (
                  <Badge className="absolute top-2 right-2 bg-black/70 text-white text-xs">
                    {item.imageUrls.length} photos
                  </Badge>
                )}
                {!item.isActive && (
                  <Badge className="absolute top-2 left-2 bg-gray-800/80 text-white text-xs">
                    Hidden
                  </Badge>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                    <p className="text-purple-600 font-bold text-sm mt-0.5">{item.priceDisplay}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => openEdit(item)}
                  >
                    <Edit2 className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => {
                      setUploadingItemId(item.id);
                      fileInputRef.current?.click();
                    }}
                    disabled={uploadingItemId === item.id || (item.imageUrls && item.imageUrls.length >= 2)}
                  >
                    {uploadingItemId === item.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <Upload className="h-3 w-3 mr-1" />
                        Photo
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2"
                    onClick={() => window.open(item.externalUrl, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                    onClick={() => {
                      if (confirm('Delete this item?')) {
                        deleteMutation.mutate({ id: item.id });
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>

                {/* Image thumbnails with delete */}
                {item.imageUrls && item.imageUrls.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {item.imageUrls.map((url: string, idx: number) => (
                      <div key={idx} className="relative w-12 h-12 rounded overflow-hidden group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => deleteImageMutation.mutate({ itemId: item.id, imageUrl: url })}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingItemId) {
            handleImageUpload(uploadingItemId, file);
          }
          e.target.value = '';
        }}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setEditingItem(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="merch-title">Title *</Label>
              <Input
                id="merch-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={userType === 'venue' ? 'e.g. Venue T-Shirt, Gift Card, VIP Package' : 'e.g. Tour T-Shirt, Signed Vinyl, Poster'}
                maxLength={200}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="merch-price">Price Display *</Label>
              <Input
                id="merch-price"
                value={priceDisplay}
                onChange={(e) => setPriceDisplay(e.target.value)}
                placeholder="e.g. $25.00, From $15, $50-$100"
                maxLength={50}
              />
              <p className="text-xs text-muted-foreground">This is displayed on your profile — enter however you'd like it shown.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="merch-url">Purchase Link *</Label>
              <Input
                id="merch-url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://your-store.com/product"
                type="url"
              />
              <p className="text-xs text-muted-foreground">Where buyers go to purchase — your Shopify, Big Cartel, Etsy, etc.</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="merch-desc">Description (optional)</Label>
              <Textarea
                id="merch-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the item..."
                maxLength={500}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingItem(null); resetForm(); }}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingItem ? 'Save Changes' : 'Add Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
