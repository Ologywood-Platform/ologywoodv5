import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { DollarSign, Users, Calculator, CheckCircle } from 'lucide-react';
import { trpc } from '../lib/trpc';
import { useToastContext } from './ErrorToast';

interface SettlementFormProps {
  booking: {
    id: number;
    artistName?: string;
    paymentTermsType?: string | null;
    doorSplitArtistPercent?: number | null;
    guaranteeAmount?: string | null;
    totalFee?: string | null;
    settlementAmount?: string | null;
    settledAt?: string | Date | null;
  };
  onSettled?: () => void;
}

export default function SettlementForm({ booking, onSettled }: SettlementFormProps) {
  const toast = useToastContext();
  const [doorRevenue, setDoorRevenue] = useState('');
  const [attendance, setAttendance] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState<{ payout: number; breakdown: string } | null>(null);

  const settleMutation = trpc.booking.settleBooking.useMutation({
    onSuccess: (data) => {
      toast.addSuccess('Settlement Complete', `Artist payout: $${data.settlement.calculatedPayout.toFixed(2)}`);
      onSettled?.();
    },
    onError: (err) => {
      toast.addError('Error', err.message);
    },
  });

  const termsType = booking.paymentTermsType || 'flat_guarantee';
  const artistPercent = booking.doorSplitArtistPercent || 80;
  const guarantee = booking.guaranteeAmount ? parseFloat(booking.guaranteeAmount) : 0;
  const flatFee = booking.totalFee ? parseFloat(booking.totalFee) : 0;

  // Already settled
  if (booking.settledAt) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-800">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Settled</span>
            <span className="text-sm text-green-600 dark:text-green-500 ml-auto">
              ${parseFloat(booking.settlementAmount || '0').toFixed(2)} paid to artist
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Flat guarantee doesn't need door revenue input
  if (termsType === 'flat_guarantee') {
    return (
      <Card className="border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Payment Terms</p>
              <p className="font-medium">Flat Guarantee: ${flatFee.toFixed(2)}</p>
            </div>
            <Button
              size="sm"
              onClick={() => settleMutation.mutate({ bookingId: booking.id, doorRevenue: 0 })}
              disabled={settleMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Settled
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate preview
  const calculatePreview = () => {
    const revenue = parseFloat(doorRevenue) || 0;
    let payout = 0;
    let breakdown = '';

    if (termsType === 'door_split') {
      payout = revenue * (artistPercent / 100);
      breakdown = `$${revenue.toFixed(2)} door × ${artistPercent}% = $${payout.toFixed(2)}`;
    } else if (termsType === 'guarantee_vs_percentage') {
      const doorPayout = revenue * (artistPercent / 100);
      payout = Math.max(guarantee, doorPayout);
      if (payout === guarantee) {
        breakdown = `Guarantee ($${guarantee.toFixed(2)}) > Door split ($${doorPayout.toFixed(2)}) → Pays guarantee`;
      } else {
        breakdown = `Door split ($${doorPayout.toFixed(2)}) > Guarantee ($${guarantee.toFixed(2)}) → Pays door split`;
      }
    }

    setPreview({ payout, breakdown });
  };

  const handleSubmit = () => {
    const revenue = parseFloat(doorRevenue) || 0;
    settleMutation.mutate({
      bookingId: booking.id,
      doorRevenue: revenue,
      attendance: attendance ? parseInt(attendance) : undefined,
      settlementNotes: notes || undefined,
    });
  };

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="h-4 w-4 text-amber-600" />
          Post-Show Settlement
        </CardTitle>
        <CardDescription>
          {termsType === 'door_split'
            ? `Door Split: ${artistPercent}% to artist / ${100 - artistPercent}% to venue`
            : `Guarantee ($${guarantee.toFixed(2)}) vs. ${artistPercent}% door split — whichever is higher`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`door-revenue-${booking.id}`} className="flex items-center gap-1 text-sm mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              Door Revenue
            </Label>
            <Input
              id={`door-revenue-${booking.id}`}
              name={`door-revenue-${booking.id}`}
              type="number"
              placeholder="0.00"
              value={doorRevenue}
              onChange={(e) => { setDoorRevenue(e.target.value); setPreview(null); }}
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <Label htmlFor={`attendance-${booking.id}`} className="flex items-center gap-1 text-sm mb-1">
              <Users className="h-3.5 w-3.5" />
              Attendance
            </Label>
            <Input
              id={`attendance-${booking.id}`}
              name={`attendance-${booking.id}`}
              type="number"
              placeholder="Optional"
              value={attendance}
              onChange={(e) => setAttendance(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div>
          <Label htmlFor={`settlement-notes-${booking.id}`} className="text-sm mb-1 block">Notes (optional)</Label>
          <Input
            id={`settlement-notes-${booking.id}`}
            name={`settlement-notes-${booking.id}`}
            placeholder="e.g. Merch split not included"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-md p-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">{preview.breakdown}</p>
            <p className="text-lg font-bold text-amber-900 dark:text-amber-200 mt-1">
              Artist Payout: ${preview.payout.toFixed(2)}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={calculatePreview}
            disabled={!doorRevenue}
          >
            <Calculator className="h-4 w-4 mr-1" />
            Calculate
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!doorRevenue || settleMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {settleMutation.isPending ? 'Settling...' : 'Confirm Settlement'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
