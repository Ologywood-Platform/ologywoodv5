import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, Minus, Plus, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { PromoCodeInput } from './PromoCodeInput';

interface TicketPurchaseProps {
  eventId: number;
  eventTitle: string;
}

export function TicketPurchase({ eventId, eventTitle }: TicketPurchaseProps) {
  const { user, isAuthenticated } = useAuth();
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountType: string; discountValue: number } | null>(null);

  const { data: tiers, isLoading } = trpc.ticketing.getTiers.useQuery({ eventId });
  const checkoutMutation = trpc.ticketing.createCheckout.useMutation();

  const updateQuantity = (tierId: number, delta: number, max: number) => {
    setQuantities(prev => {
      const current = prev[tierId] || 0;
      const next = Math.max(0, Math.min(max, current + delta));
      return { ...prev, [tierId]: next };
    });
  };

  const totalTickets = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const totalPrice = tiers?.reduce((sum, tier: any) => {
    const qty = quantities[tier.id] || 0;
    return sum + (tier.price * qty);
  }, 0) || 0;
  const serviceFee = totalTickets * 99; // $0.99 per ticket in cents

  // Calculate discount
  let discount = 0;
  if (appliedPromo && totalPrice > 0) {
    if (appliedPromo.discountType === 'percentage') {
      discount = Math.round(totalPrice * (appliedPromo.discountValue / 100));
    } else {
      discount = Math.min(appliedPromo.discountValue, totalPrice); // Don't discount more than the price
    }
  }
  const finalTotal = totalPrice - discount + serviceFee;

  const handleCheckout = async () => {
    if (totalTickets === 0) {
      toast.error('Please select at least one ticket');
      return;
    }

    setIsCheckingOut(true);
    try {
      const items = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([tierId, quantity]) => ({ tierId: parseInt(tierId), quantity }));

      const result = await checkoutMutation.mutateAsync({
        eventId,
        items,
        buyerEmail: user?.email || undefined,
        buyerName: user?.name || undefined,
      });

      if (result.checkoutUrl) {
        toast.success('Redirecting to secure checkout...');
        window.open(result.checkoutUrl, '_blank');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start checkout');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!tiers || tiers.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Get Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tiers.map((tier: any) => {
          const qty = quantities[tier.id] || 0;
          const maxAvailable = Math.min(tier.available, tier.maxPerOrder);
          const isSoldOut = tier.isSoldOut;
          const isNotOnSale = !tier.isOnSale;

          return (
            <div
              key={tier.id}
              className={`border rounded-lg p-4 ${isSoldOut || isNotOnSale ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">{tier.name}</h4>
                    {isSoldOut && <Badge variant="destructive" className="text-xs">Sold Out</Badge>}
                    {isNotOnSale && !isSoldOut && <Badge variant="secondary" className="text-xs">Not On Sale</Badge>}
                  </div>
                  {tier.description && (
                    <p className="text-xs text-muted-foreground mt-1">{tier.description}</p>
                  )}
                  <p className="font-bold mt-1">
                    {tier.price === 0 ? 'Free' : `$${(tier.price / 100).toFixed(2)}`}
                  </p>
                  {!isSoldOut && tier.available <= 10 && tier.available > 0 && (
                    <p className="text-xs text-orange-600 mt-0.5">Only {tier.available} left!</p>
                  )}
                </div>
                {!isSoldOut && !isNotOnSale && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(tier.id, -1, maxAvailable)}
                      disabled={qty === 0}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-6 text-center font-semibold text-sm">{qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(tier.id, 1, maxAvailable)}
                      disabled={qty >= maxAvailable}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Promo Code Input */}
        <PromoCodeInput
          eventId={eventId}
          ticketCount={totalTickets}
          onPromoApplied={setAppliedPromo}
        />

        {/* Order Summary */}
        {totalTickets > 0 && (
          <div className="border-t pt-3 mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{totalTickets} ticket{totalTickets > 1 ? 's' : ''}</span>
              <span>${(totalPrice / 100).toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount ({appliedPromo?.code})</span>
                <span>-${(discount / 100).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Service fee</span>
              <span>${(serviceFee / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total</span>
              <span>${(finalTotal / 100).toFixed(2)}</span>
            </div>
          </div>
        )}

        <Button
          onClick={handleCheckout}
          disabled={totalTickets === 0 || isCheckingOut}
          className="w-full mt-3"
          size="lg"
        >
          {isCheckingOut ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : totalTickets === 0 ? (
            'Select Tickets'
          ) : (
            `Checkout - $${(finalTotal / 100).toFixed(2)}`
          )}
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Secure checkout powered by Stripe</span>
        </div>
      </CardContent>
    </Card>
  );
}
