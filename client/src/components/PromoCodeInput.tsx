import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tag, Loader2, CheckCircle, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface PromoCodeInputProps {
  eventId: number;
  ticketCount: number;
  onPromoApplied: (promo: { code: string; discountType: string; discountValue: number } | null) => void;
}

export function PromoCodeInput({ eventId, ticketCount, onPromoApplied }: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountType: string; discountValue: number; message: string } | null>(null);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  const validateQuery = trpc.ticketing.validatePromoCode.useQuery(
    { eventId, code: code.toUpperCase(), ticketCount },
    { enabled: false }
  );

  const handleApply = async () => {
    if (!code.trim()) return;
    setError('');
    setIsChecking(true);
    try {
      const result = await validateQuery.refetch();
      if (result.data?.valid) {
        const promo = {
          code: result.data.code!,
          discountType: result.data.discountType!,
          discountValue: result.data.discountValue!,
          message: result.data.message!,
        };
        setAppliedPromo(promo);
        onPromoApplied({ code: promo.code, discountType: promo.discountType, discountValue: promo.discountValue });
      } else {
        setError(result.data?.message || 'Invalid promo code');
        setAppliedPromo(null);
        onPromoApplied(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to validate code');
    } finally {
      setIsChecking(false);
    }
  };

  const handleRemove = () => {
    setAppliedPromo(null);
    setCode('');
    setError('');
    onPromoApplied(null);
  };

  if (appliedPromo) {
    return (
      <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg">
        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-700 border-green-300 text-xs">
              {appliedPromo.code}
            </Badge>
            <span className="text-sm text-green-700">{appliedPromo.message}</span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-green-600 hover:text-red-600" onClick={handleRemove}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Promo code"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleApply}
          disabled={!code.trim() || isChecking}
          className="h-9"
        >
          {isChecking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
