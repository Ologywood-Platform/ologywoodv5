import { useMemo, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import SiteHeader from '@/components/SiteHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  ClipboardList,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  PackageCheck,
  ShoppingBag,
  Truck,
  UserRound,
} from 'lucide-react';

const statusLabels: Record<string, string> = {
  new: 'New order',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  shipped: 'Shipped',
  ready_for_pickup: 'Ready for pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const statusStyles: Record<string, string> = {
  new: 'bg-violet-100 text-violet-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-amber-100 text-amber-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  ready_for_pickup: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-200 text-slate-700',
  refunded: 'bg-rose-100 text-rose-800',
};

const nextStatusOptions: Record<string, Array<{ value: string; label: string }>> = {
  new: [{ value: 'confirmed', label: 'Confirm order' }, { value: 'cancelled', label: 'Cancel order' }],
  confirmed: [{ value: 'preparing', label: 'Start preparing' }, { value: 'cancelled', label: 'Cancel order' }],
  preparing: [
    { value: 'shipped', label: 'Mark shipped' },
    { value: 'ready_for_pickup', label: 'Ready for pickup' },
    { value: 'completed', label: 'Mark completed' },
    { value: 'cancelled', label: 'Cancel order' },
  ],
  shipped: [{ value: 'completed', label: 'Mark delivered/completed' }],
  ready_for_pickup: [{ value: 'completed', label: 'Mark picked up/completed' }],
};

function formatAddress(address: any) {
  if (!address) return '';
  return [address.line1, address.line2, `${address.city}, ${address.state} ${address.postalCode}`, address.country].filter(Boolean).join(', ');
}

function OrderItems({ items }: { items: any[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="flex gap-3">
          <div className="h-14 w-14 rounded bg-muted overflow-hidden shrink-0">
            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-full w-full object-cover" /> : <Package className="h-5 w-5 m-4 text-muted-foreground" />}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">{item.quantity} × {item.title}</p>
            <p className="text-xs text-muted-foreground">{Object.entries(item.selectedVariants || {}).map(([name, value]) => `${name}: ${value}`).join(' · ')}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BuyerOrdersPanel() {
  const { data: orders, isLoading } = trpc.merchOrders.myOrders.useQuery();
  if (isLoading) return <div className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-700" /></div>;
  if (!orders?.length) return <Card className="border-dashed"><CardContent className="py-12 text-center"><Package className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" /><h2 className="font-semibold text-lg">No merch purchases yet</h2><p className="text-sm text-muted-foreground mt-1">Items purchased through OlogyWood will appear here.</p><Button className="mt-5" onClick={() => { window.location.href = '/browse'; }}>Browse creators</Button></CardContent></Card>;

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{order.orderNumber}</p><Badge className={statusStyles[order.status]}>{statusLabels[order.status] || order.status}</Badge><Badge variant="outline">{order.fulfillmentMethod === 'shipping' ? 'Shipping' : 'Pickup'}</Badge></div><p className="text-xs text-muted-foreground mt-1">Ordered {new Date(order.createdAt).toLocaleDateString()}</p></div>
              <p className="font-bold text-purple-700">${(order.totalCents / 100).toFixed(2)}</p>
            </div>
            <div className="mt-4 border-t pt-4"><OrderItems items={order.items} /></div>
            {order.trackingNumber && <div className="mt-4 rounded-md bg-blue-50 p-3 text-sm"><p><strong>{order.trackingCarrier || 'Tracking'}:</strong> {order.trackingNumber}</p>{order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline inline-flex items-center gap-1">Track shipment <ExternalLink className="h-3 w-3" /></a>}</div>}
            {order.pickupNotes && <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm"><strong>Pickup details:</strong> {order.pickupNotes}</div>}
            {order.fulfillmentNotes && <div className="mt-3 text-sm text-muted-foreground"><strong>Creator note:</strong> {order.fulfillmentNotes}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SellerOrdersPanel() {
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [nextStatus, setNextStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingCarrier, setTrackingCarrier] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [pickupNotes, setPickupNotes] = useState('');
  const [fulfillmentNotes, setFulfillmentNotes] = useState('');
  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');

  const { data: orders, isLoading, refetch } = trpc.merchOrders.sellerOrders.useQuery();
  const stripeDashboardMutation = trpc.stripeConnect.getDashboardLink.useMutation({
    onSuccess: ({ url }) => { window.location.href = url; },
    onError: (error) => toast.error(error.message),
  });
  const updateMutation = trpc.merchOrders.updateFulfillment.useMutation({
    onSuccess: () => {
      toast.success('Order updated. The buyer will be notified.');
      setEditingOrder(null);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  const filteredOrders = useMemo(() => (orders || []).filter((order) => {
    if (filter === 'all') return true;
    const done = ['completed', 'cancelled', 'refunded'].includes(order.status);
    return filter === 'completed' ? done : !done;
  }), [orders, filter]);

  function openUpdate(order: any) {
    const options = nextStatusOptions[order.status] || [];
    const validOptions = options.filter((option) => {
      if (option.value === 'shipped') return order.fulfillmentMethod === 'shipping';
      if (option.value === 'ready_for_pickup') return order.fulfillmentMethod === 'pickup';
      return true;
    });
    setEditingOrder(order);
    setNextStatus(validOptions[0]?.value || '');
    setTrackingNumber(order.trackingNumber || '');
    setTrackingCarrier(order.trackingCarrier || '');
    setTrackingUrl(order.trackingUrl || '');
    setPickupNotes(order.pickupNotes || '');
    setFulfillmentNotes(order.fulfillmentNotes || '');
  }

  function saveUpdate() {
    if (!editingOrder || !nextStatus) return;
    updateMutation.mutate({
      orderId: editingOrder.id,
      status: nextStatus as any,
      trackingNumber: trackingNumber.trim() || undefined,
      trackingCarrier: trackingCarrier.trim() || undefined,
      trackingUrl: trackingUrl.trim(),
      pickupNotes: pickupNotes.trim() || undefined,
      fulfillmentNotes: fulfillmentNotes.trim() || undefined,
    });
  }

  if (isLoading) return <div className="py-16 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-700" /></div>;

  return (
    <>
      <div className="rounded-lg border border-violet-200 bg-violet-50 p-4 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><p className="font-medium text-sm">You fulfill these orders</p><p className="text-xs text-muted-foreground mt-1">OlogyWood processes payment and tracks status. Prepare, ship, deliver, or arrange pickup directly with the buyer.</p></div>
        <Button variant="outline" size="sm" onClick={() => stripeDashboardMutation.mutate()} disabled={stripeDashboardMutation.isPending}>Open Stripe payouts</Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['active', 'completed', 'all'] as const).map((value) => <Button key={value} size="sm" variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>{value === 'active' ? 'Needs attention' : value === 'completed' ? 'Completed/closed' : 'All orders'}</Button>)}
      </div>

      {!filteredOrders.length ? <Card className="border-dashed"><CardContent className="py-12 text-center"><ClipboardList className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" /><h2 className="font-semibold text-lg">No orders in this view</h2><p className="text-sm text-muted-foreground mt-1">New paid orders will appear here automatically.</p></CardContent></Card> : <div className="space-y-4">{filteredOrders.map((order) => (
        <Card key={order.id}>
          <CardContent className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{order.orderNumber}</p><Badge className={statusStyles[order.status]}>{statusLabels[order.status] || order.status}</Badge><Badge variant="outline">{order.fulfillmentMethod === 'shipping' ? 'Shipping' : 'Pickup'}</Badge></div><p className="text-xs text-muted-foreground">Paid {order.paidAt ? new Date(order.paidAt).toLocaleString() : new Date(order.createdAt).toLocaleString()}</p></div>
              <div className="flex items-center gap-3"><p className="font-bold text-purple-700">${(order.totalCents / 100).toFixed(2)}</p>{(nextStatusOptions[order.status]?.length || 0) > 0 && <Button size="sm" onClick={() => openUpdate(order)}>Update order</Button>}</div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mt-5 border-t pt-5">
              <OrderItems items={order.items} />
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2"><UserRound className="h-4 w-4 text-purple-700 mt-0.5" /><div><p className="font-medium">{order.buyerName}</p><a href={`mailto:${order.buyerEmail}`} className="text-purple-700">{order.buyerEmail}</a>{order.buyerPhone && <p>{order.buyerPhone}</p>}</div></div>
                {order.fulfillmentMethod === 'shipping' && <div className="flex items-start gap-2"><Truck className="h-4 w-4 text-purple-700 mt-0.5" /><p>{formatAddress(order.shippingAddress)}</p></div>}
                {order.fulfillmentMethod === 'pickup' && <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-purple-700 mt-0.5" /><p>Local pickup or manual delivery</p></div>}
                {order.customerNote && <div className="rounded-md bg-slate-50 p-3"><strong>Buyer note:</strong> {order.customerNote}</div>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}</div>}

      <Dialog open={!!editingOrder} onOpenChange={(open) => { if (!open) setEditingOrder(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Update {editingOrder?.orderNumber}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label htmlFor="order-status">Next status</Label><select id="order-status" value={nextStatus} onChange={(event) => setNextStatus(event.target.value)} className="w-full h-10 rounded-md border bg-background px-3 text-sm">{(nextStatusOptions[editingOrder?.status] || []).filter((option) => option.value !== 'shipped' || editingOrder?.fulfillmentMethod === 'shipping').filter((option) => option.value !== 'ready_for_pickup' || editingOrder?.fulfillmentMethod === 'pickup').map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
            {nextStatus === 'shipped' && <div className="grid sm:grid-cols-2 gap-3"><div className="space-y-2"><Label htmlFor="carrier">Carrier</Label><Input id="carrier" value={trackingCarrier} onChange={(event) => setTrackingCarrier(event.target.value)} placeholder="USPS, UPS, FedEx..." /></div><div className="space-y-2"><Label htmlFor="tracking-number">Tracking number</Label><Input id="tracking-number" value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="tracking-url">Tracking link (optional)</Label><Input id="tracking-url" value={trackingUrl} onChange={(event) => setTrackingUrl(event.target.value)} type="url" placeholder="https://..." /></div></div>}
            {nextStatus === 'ready_for_pickup' && <div className="space-y-2"><Label htmlFor="pickup-notes">Pickup details *</Label><Textarea id="pickup-notes" value={pickupNotes} onChange={(event) => setPickupNotes(event.target.value)} placeholder="Where and when the buyer can pick up the item..." /></div>}
            <div className="space-y-2"><Label htmlFor="fulfillment-notes">Message to buyer (optional)</Label><Textarea id="fulfillment-notes" value={fulfillmentNotes} onChange={(event) => setFulfillmentNotes(event.target.value)} placeholder="A short update about the order..." maxLength={1000} /></div>
            {nextStatus === 'cancelled' && <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">Cancelling the fulfillment record does not automatically refund the Stripe payment. Process any refund in Stripe; OlogyWood will update the order when Stripe confirms it.</div>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditingOrder(null)}>Cancel</Button><Button onClick={saveUpdate} disabled={!nextStatus || updateMutation.isPending}>{updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save update</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function MerchOrders() {
  const { user, isAuthenticated } = useAuth();
  const isSeller = user?.role === 'artist' || user?.role === 'venue' || user?.role === 'admin';
  const [view, setView] = useState<'seller' | 'buyer'>(isSeller ? 'seller' : 'buyer');

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div><h1 className="text-3xl font-bold flex items-center gap-2"><ShoppingBag className="h-7 w-7 text-purple-700" />Merch Orders</h1><p className="text-muted-foreground mt-1">Track purchases and fulfill orders sold through OlogyWood.</p></div>
          <Button variant="outline" onClick={() => { window.location.href = '/merch'; }}><PackageCheck className="h-4 w-4 mr-2" />Manage merch</Button>
        </div>

        {!isAuthenticated ? <Card><CardContent className="py-12 text-center"><p className="font-medium">Sign in to view merch orders.</p><Button className="mt-4" onClick={() => { window.location.href = '/'; }}>Sign in</Button></CardContent></Card> : <>
          {isSeller && <div className="inline-flex rounded-lg border bg-white p-1 mb-6"><Button size="sm" variant={view === 'seller' ? 'default' : 'ghost'} onClick={() => setView('seller')}>Orders to fulfill</Button><Button size="sm" variant={view === 'buyer' ? 'default' : 'ghost'} onClick={() => setView('buyer')}>My purchases</Button></div>}
          {view === 'seller' && isSeller ? <SellerOrdersPanel /> : <BuyerOrdersPanel />}
        </>}
      </main>
    </div>
  );
}
