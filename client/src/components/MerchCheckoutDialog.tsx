import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, LockKeyhole, MapPin, Package, Truck } from 'lucide-react';

interface MerchCheckoutDialogProps {
  item: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MerchCheckoutDialog({ item, open, onOpenChange }: MerchCheckoutDialogProps) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'shipping' | 'pickup'>('shipping');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [customerNote, setCustomerNote] = useState('');

  const variants = (item?.variants || []) as Array<{ name: string; options: string[] }>;
  const maxQuantity = item?.trackInventory ? Math.min(10, Math.max(1, item.inventoryQuantity || 1)) : 10;
  const subtotal = (item?.priceInCents || 0) * quantity;
  const shipping = fulfillmentMethod === 'shipping' ? item?.shippingAmountCents || 0 : 0;
  const total = subtotal + shipping;

  useEffect(() => {
    if (!open || !item) return;
    setQuantity(1);
    setSelectedVariants(Object.fromEntries(variants.map((variant) => [variant.name, variant.options[0] || ''])));
    setBuyerName(user?.name || '');
    setBuyerEmail(user?.email || '');
    setBuyerPhone('');
    setFulfillmentMethod(item.shippingAvailable ? 'shipping' : 'pickup');
    setCustomerNote('');
  }, [open, item?.id, user?.name, user?.email]);

  const missingVariant = useMemo(
    () => variants.find((variant) => !selectedVariants[variant.name]),
    [variants, selectedVariants],
  );

  const checkoutMutation = trpc.merchOrders.createCheckout.useMutation({
    onSuccess: ({ checkoutUrl }) => {
      if (checkoutUrl) window.location.href = checkoutUrl;
      else toast.error('Checkout could not be opened. Please try again.');
    },
    onError: (error) => toast.error(error.message),
  });

  function startCheckout() {
    if (!buyerName.trim() || !buyerEmail.trim()) {
      toast.error('Enter your name and email.');
      return;
    }
    if (missingVariant) {
      toast.error(`Choose a ${missingVariant.name}.`);
      return;
    }
    if (fulfillmentMethod === 'shipping' && (!line1.trim() || !city.trim() || !state.trim() || !postalCode.trim() || !country.trim())) {
      toast.error('Complete the shipping address.');
      return;
    }

    checkoutMutation.mutate({
      merchItemId: item.id,
      quantity,
      selectedVariants,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.trim(),
      buyerPhone: buyerPhone.trim() || undefined,
      fulfillmentMethod,
      shippingAddress: fulfillmentMethod === 'shipping' ? {
        line1: line1.trim(),
        line2: line2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: country.trim(),
      } : undefined,
      customerNote: customerNote.trim() || undefined,
    });
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order {item.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex gap-4 rounded-lg border p-3">
            <div className="h-20 w-20 shrink-0 rounded-md bg-muted overflow-hidden">
              {item.imageUrls?.[0] ? <img src={item.imageUrls[0]} alt={item.title} className="h-full w-full object-cover" /> : <Package className="h-8 w-8 text-muted-foreground m-6" />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{item.title}</p>
              <p className="text-purple-700 font-bold">${(item.priceInCents / 100).toFixed(2)}</p>
              {item.fulfillmentTime && <p className="text-xs text-muted-foreground mt-1">Usually fulfilled in {item.fulfillmentTime}</p>}
            </div>
          </div>

          {variants.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-4">
              {variants.map((variant) => (
                <div className="space-y-2" key={variant.name}>
                  <Label htmlFor={`variant-${variant.name}`}>{variant.name}</Label>
                  <select id={`variant-${variant.name}`} value={selectedVariants[variant.name] || ''} onChange={(event) => setSelectedVariants({ ...selectedVariants, [variant.name]: event.target.value })} className="w-full h-10 rounded-md border bg-background px-3 text-sm">
                    {variant.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 max-w-32">
            <Label htmlFor="merch-quantity">Quantity</Label>
            <Input id="merch-quantity" type="number" min="1" max={maxQuantity} value={quantity} onChange={(event) => setQuantity(Math.min(maxQuantity, Math.max(1, Number(event.target.value) || 1)))} />
          </div>

          <div className="space-y-2">
            <Label>How do you want to receive it?</Label>
            <div className="grid sm:grid-cols-2 gap-3">
              {item.shippingAvailable && <button type="button" onClick={() => setFulfillmentMethod('shipping')} className={`p-3 rounded-lg border text-left ${fulfillmentMethod === 'shipping' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : ''}`}><Truck className="h-4 w-4 text-purple-700 mb-1" /><p className="font-medium text-sm">Shipping</p><p className="text-xs text-muted-foreground">{item.shippingAmountCents ? `$${(item.shippingAmountCents / 100).toFixed(2)} flat shipping` : 'Free shipping'}</p></button>}
              {item.pickupAvailable && <button type="button" onClick={() => setFulfillmentMethod('pickup')} className={`p-3 rounded-lg border text-left ${fulfillmentMethod === 'pickup' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : ''}`}><MapPin className="h-4 w-4 text-purple-700 mb-1" /><p className="font-medium text-sm">Local pickup</p><p className="text-xs text-muted-foreground">The creator will send pickup details.</p></button>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="buyer-name">Name *</Label><Input id="buyer-name" value={buyerName} onChange={(event) => setBuyerName(event.target.value)} autoComplete="name" /></div>
            <div className="space-y-2"><Label htmlFor="buyer-email">Email *</Label><Input id="buyer-email" value={buyerEmail} onChange={(event) => setBuyerEmail(event.target.value)} type="email" autoComplete="email" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="buyer-phone">Phone (optional)</Label><Input id="buyer-phone" value={buyerPhone} onChange={(event) => setBuyerPhone(event.target.value)} type="tel" autoComplete="tel" /></div>
          </div>

          {fulfillmentMethod === 'shipping' && (
            <div className="space-y-3 rounded-lg border p-4">
              <p className="font-medium text-sm">Shipping address</p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="address-line1">Address *</Label><Input id="address-line1" value={line1} onChange={(event) => setLine1(event.target.value)} autoComplete="address-line1" /></div>
                <div className="space-y-2 sm:col-span-2"><Label htmlFor="address-line2">Apartment, suite, etc.</Label><Input id="address-line2" value={line2} onChange={(event) => setLine2(event.target.value)} autoComplete="address-line2" /></div>
                <div className="space-y-2"><Label htmlFor="address-city">City *</Label><Input id="address-city" value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" /></div>
                <div className="space-y-2"><Label htmlFor="address-state">State/region *</Label><Input id="address-state" value={state} onChange={(event) => setState(event.target.value)} autoComplete="address-level1" /></div>
                <div className="space-y-2"><Label htmlFor="address-postal">Postal code *</Label><Input id="address-postal" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} autoComplete="postal-code" /></div>
                <div className="space-y-2"><Label htmlFor="address-country">Country *</Label><Input id="address-country" value={country} onChange={(event) => setCountry(event.target.value)} autoComplete="country-name" /></div>
              </div>
            </div>
          )}

          <div className="space-y-2"><Label htmlFor="customer-note">Note for the creator (optional)</Label><Textarea id="customer-note" value={customerNote} onChange={(event) => setCustomerNote(event.target.value)} maxLength={500} placeholder="Special instructions or a question about the order..." /></div>

          <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span>Merch</span><span>${(subtotal / 100).toFixed(2)}</span></div>
            <div className="flex justify-between"><span>{fulfillmentMethod === 'shipping' ? 'Shipping' : 'Pickup'}</span><span>{shipping ? `$${(shipping / 100).toFixed(2)}` : '$0.00'}</span></div>
            <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>${(total / 100).toFixed(2)}</span></div>
          </div>

          <p className="text-xs text-muted-foreground flex gap-2"><LockKeyhole className="h-4 w-4 shrink-0" />Secure payment is processed by Stripe. The creator—not OlogyWood—prepares and fulfills this order.</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={startCheckout} disabled={checkoutMutation.isPending} className="bg-purple-700 hover:bg-purple-800">
            {checkoutMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Continue to secure payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
