import { trpc } from '@/lib/trpc';
import SiteHeader from '@/components/SiteHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Loader2, PackageCheck } from 'lucide-react';

export default function MerchOrderSuccess() {
  const sessionId = new URLSearchParams(window.location.search).get('session_id') || '';
  const { data: order, isLoading } = trpc.merchOrders.getCheckoutResult.useQuery(
    { sessionId },
    { enabled: sessionId.length > 10, refetchInterval: 2000 },
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-10 text-center">
            {isLoading || order?.paymentStatus === 'pending' ? (
              <><Loader2 className="h-12 w-12 animate-spin text-purple-700 mx-auto mb-4" /><h1 className="text-2xl font-bold">Confirming your order</h1><p className="text-muted-foreground mt-2">Payment succeeded. We are finishing your receipt.</p></>
            ) : order?.paymentStatus === 'paid' ? (
              <><CheckCircle2 className="h-14 w-14 text-emerald-600 mx-auto mb-4" /><h1 className="text-2xl font-bold">Your order is confirmed</h1><p className="text-muted-foreground mt-2">Order <strong>{order.orderNumber}</strong> has been sent to the creator for fulfillment.</p><div className="rounded-lg bg-slate-100 p-4 mt-6 text-left space-y-2">{order.items.map((item) => <div key={item.title} className="flex justify-between text-sm"><span>{item.quantity} × {item.title}</span><span>{Object.values(item.selectedVariants || {}).join(', ')}</span></div>)}<div className="border-t pt-2 flex justify-between font-semibold"><span>Total paid</span><span>${(order.totalCents / 100).toFixed(2)}</span></div></div><p className="text-sm text-muted-foreground mt-5">A confirmation email has been sent. The creator will update you as the order moves forward.</p></>
            ) : (
              <><PackageCheck className="h-12 w-12 text-purple-700 mx-auto mb-4" /><h1 className="text-2xl font-bold">Order received</h1><p className="text-muted-foreground mt-2">Your payment confirmation may take a moment. Check your orders for the latest status.</p></>
            )}
            <div className="flex flex-wrap justify-center gap-3 mt-8"><Button onClick={() => { window.location.href = '/merch-orders'; }}>View my orders</Button><Button variant="outline" onClick={() => { window.location.href = '/browse'; }}>Continue browsing</Button></div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
