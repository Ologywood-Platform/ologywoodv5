import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tag, Plus, Trash2, Loader2, Percent, DollarSign } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { HelperNote } from '@/components/HelperNote';

interface PromoCodeManagerProps {
  eventId: number;
}

export function PromoCodeManager({ eventId }: PromoCodeManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [minTickets, setMinTickets] = useState('1');


  const { data: promoCodes, refetch } = trpc.ticketing.getPromoCodes.useQuery({ eventId });

  const createMutation = trpc.ticketing.createPromoCode.useMutation({
    onSuccess: () => {
      toast.success(`Code "${code.toUpperCase()}" is now active`);
      setShowForm(false);
      setCode('');
      setDiscountValue('');
      setMaxUses('');
      setMinTickets('1');
      refetch();
    },
    onError: (err) => {
      toast.error(`Failed to create: ${err.message}`);
    },
  });

  const deleteMutation = trpc.ticketing.deletePromoCode.useMutation({
    onSuccess: () => {
      toast.success('Promo code deleted');
      refetch();
    },
    onError: (err) => {
      toast.error(`Failed to delete: ${err.message}`);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const value = discountType === 'percentage'
      ? parseInt(discountValue)
      : Math.round(parseFloat(discountValue) * 100); // convert dollars to cents

    if (!value || value <= 0) return;
    if (discountType === 'percentage' && value > 100) {
      toast.error('Percentage cannot exceed 100%');
      return;
    }

    createMutation.mutate({
      eventId,
      code,
      discountType,
      discountValue: value,
      maxUses: maxUses ? parseInt(maxUses) : undefined,
      minTickets: parseInt(minTickets) || 1,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Tag className="h-4 w-4" />
          Promo Codes
        </h3>
        {!showForm && (
          <Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Add Code
          </Button>
        )}
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Code *</Label>
                  <Input
                    placeholder="e.g., EARLYBIRD20"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    required
                    className="h-8 text-sm font-mono"
                  />
                </div>
                <div>
                  <Label className="text-xs">Discount Type</Label>
                  <div className="flex gap-1 mt-1">
                    <Button
                      type="button"
                      variant={discountType === 'percentage' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-8 gap-1"
                      onClick={() => setDiscountType('percentage')}
                    >
                      <Percent className="h-3 w-3" /> %
                    </Button>
                    <Button
                      type="button"
                      variant={discountType === 'fixed' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1 h-8 gap-1"
                      onClick={() => setDiscountType('fixed')}
                    >
                      <DollarSign className="h-3 w-3" /> $
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">
                    {discountType === 'percentage' ? 'Discount %' : 'Discount $'} *
                  </Label>
                  <Input
                    type="number"
                    placeholder={discountType === 'percentage' ? '20' : '5.00'}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    min={discountType === 'percentage' ? 1 : 0.01}
                    max={discountType === 'percentage' ? 100 : undefined}
                    step={discountType === 'percentage' ? 1 : 0.01}
                    required
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Max Uses</Label>
                  <Input
                    type="number"
                    placeholder="Unlimited"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    min={1}
                    className="h-8 text-sm"
                  />
                  <HelperNote className="mt-0.5">Leave blank for unlimited redemptions.</HelperNote>
                </div>
                <div>
                  <Label className="text-xs">Min Tickets</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={minTickets}
                    onChange={(e) => setMinTickets(e.target.value)}
                    min={1}
                    className="h-8 text-sm"
                  />
                  <HelperNote className="mt-0.5">Buyer must purchase at least this many for the code to apply.</HelperNote>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={createMutation.isPending} className="gap-1.5">
                  {createMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Create Code
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing promo codes */}
      {promoCodes && promoCodes.length > 0 ? (
        <div className="space-y-2">
          {promoCodes.map((promo: any) => (
            <div
              key={promo.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-card"
            >
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-xs">
                  {promo.code}
                </Badge>
                <span className="text-sm">
                  {promo.discountType === 'percentage'
                    ? `${promo.discountValue}% off`
                    : `$${(promo.discountValue / 100).toFixed(2)} off`}
                </span>
                {promo.maxUses && (
                  <span className="text-xs text-muted-foreground">
                    {promo.currentUses}/{promo.maxUses} used
                  </span>
                )}
                {!promo.isActive && (
                  <Badge variant="secondary" className="text-xs">Inactive</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600"
                onClick={() => deleteMutation.mutate({ id: promo.id })}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No promo codes yet. Create one to offer discounts to your fans.
        </p>
      ) : null}
    </div>
  );
}
