import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Ticket, Minus, Plus, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
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
  const [guestEmail, setGuestEmail] = useState('');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [creatorUpdatesOptIn, setCreatorUpdatesOptIn] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountType: string; discountValue: number } | null>(null);

  const { data: tiers, isLoading } = trpc.ticketing.getTiers.useQuery({ eventId }, { refetchInterval: 30000, staleTime: 10000 });
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
    if (!isAuthenticated && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      toast.error('Enter an email address to receive your tickets.');
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
        buyerEmail: user?.email || guestEmail.trim() || undefined,
        buyerName: user?.name || undefined,
        promoCode: appliedPromo?.code,
        fanEmailOptIn: Boolean(user?.emailVerified && creatorUpdatesOptIn),
      });

      if (result.checkoutUrl) {
        toast.success('Redirecting to secure checkout...');
        window.location.assign(result.checkoutUrl);
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

  const isEventSoldOut = tiers.every((tier: any) => tier.isSoldOut);
  const lowStockTiers = tiers.filter((tier: any) => {
    const lowStockThreshold = Math.max(3, Math.ceil(tier.quantity * 0.1));
    return !tier.isSoldOut && tier.available > 0 && tier.available <= lowStockThreshold;
  });

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Get Tickets
          {isEventSoldOut && <Badge variant="destructive" className="ml-auto">Sold Out</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!isEventSoldOut && lowStockTiers.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-900" role="status" aria-live="polite">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span><strong>Low stock:</strong> {lowStockTiers.length === 1 ? `only ${lowStockTiers[0].available} ticket${lowStockTiers[0].available === 1 ? '' : 's'} left for ${lowStockTiers[0].name}.` : `${lowStockTiers.length} ticket tiers are almost sold out.`}</span>
          </div>
        )}
        {tiers.map((tier: any) => {
          const qty = quantities[tier.id] || 0;
          const maxAvailable = Math.min(tier.available, tier.maxPerOrder);
          const isSoldOut = tier.isSoldOut;
          const isNotOnSale = !tier.isOnSale;
          const isLowStock = !isSoldOut && tier.available > 0 && tier.available <= Math.max(3, Math.ceil(tier.quantity * 0.1));

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
                  {isLowStock && (
                    <p className="text-xs font-medium text-orange-600 mt-0.5">Low stock — only {tier.available} left</p>
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

        {!isAuthenticated && (
          <div className="space-y-1.5 border-t pt-3">
            <Label htmlFor={`ticket-guest-email-${eventId}`}>Email for your tickets</Label>
            <Input
              id={`ticket-guest-email-${eventId}`}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              No account is required. We’ll email your receipt and QR codes after payment.
            </p>
          </div>
        )}

        {user?.emailVerified ? <label className="flex items-start gap-2 border-t pt-3 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={creatorUpdatesOptIn}
            onChange={(event) => setCreatorUpdatesOptIn(event.target.checked)}
            className="mt-0.5 h-3.5 w-3.5 rounded border-input accent-primary"
          />
          <span>Follow this event’s creator and receive occasional updates by email. You can unsubscribe anytime.</span>
        </label> : user ? <p className="border-t pt-3 text-xs text-muted-foreground">Verify your email in Settings if you want to receive updates from this event’s creator.</p> : null}

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
          disabled={isEventSoldOut || totalTickets === 0 || isCheckingOut}
          className="w-full mt-3"
          size="lg"
        >
          {isEventSoldOut ? (
            'Sold Out'
          ) : isCheckingOut ? (
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
