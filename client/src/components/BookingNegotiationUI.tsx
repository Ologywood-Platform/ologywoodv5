import { useState } from 'react';
import { MessageSquare, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface NegotiationOffer {
  id: number;
  proposedDate?: string;
  proposedFee?: number;
  proposedPartySize?: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  createdBy: 'artist' | 'venue';
}

interface BookingNegotiationUIProps {
  bookingId: number;
  originalFee: number;
  originalDate: string;
  originalPartySize?: number;
  userType: 'artist' | 'venue';
  offers: NegotiationOffer[];
  onSubmitOffer: (offer: Partial<NegotiationOffer>) => Promise<void>;
  onAcceptOffer: (offerId: number) => Promise<void>;
  onRejectOffer: (offerId: number) => Promise<void>;
  isLoading?: boolean;
}

export function BookingNegotiationUI({
  bookingId,
  originalFee,
  originalDate,
  originalPartySize,
  userType,
  offers,
  onSubmitOffer,
  onAcceptOffer,
  onRejectOffer,
  isLoading = false,
}: BookingNegotiationUIProps) {
  const [showForm, setShowForm] = useState(false);
  const [proposedFee, setProposedFee] = useState(originalFee.toString());
  const [proposedDate, setProposedDate] = useState(originalDate);
  const [proposedPartySize, setProposedPartySize] = useState(originalPartySize?.toString() || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmitOffer({
        proposedFee: proposedFee ? parseInt(proposedFee) : undefined,
        proposedDate: proposedDate || undefined,
        proposedPartySize: proposedPartySize ? parseInt(proposedPartySize) : undefined,
        notes: notes || undefined,
      });
      
      // Reset form
      setProposedFee(originalFee.toString());
      setProposedDate(originalDate);
      setProposedPartySize(originalPartySize?.toString() || '');
      setNotes('');
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateFeeChange = (newFee: number) => {
    const change = newFee - originalFee;
    const percent = (change / originalFee) * 100;
    return { change, percent };
  };

  const feeChange = proposedFee ? calculateFeeChange(parseInt(proposedFee)) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Booking Negotiation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Terms */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-semibold text-sm">Current Terms</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Fee</p>
              <p className="text-lg font-semibold">${originalFee.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Date</p>
              <p className="text-lg font-semibold">{new Date(originalDate).toLocaleDateString()}</p>
            </div>
            {originalPartySize && (
              <div>
                <p className="text-xs text-muted-foreground">Party Size</p>
                <p className="text-lg font-semibold">{originalPartySize} people</p>
              </div>
            )}
          </div>
        </div>

        {/* Negotiation History */}
        {offers.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Negotiation History</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {offers.map((offer) => (
                <div key={offer.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {offer.createdBy === 'artist' ? 'Artist' : 'Venue'} Proposal
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(offer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        offer.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : offer.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {offer.proposedFee && (
                      <div>
                        <p className="text-xs text-muted-foreground">Proposed Fee</p>
                        <p className="font-semibold">${offer.proposedFee.toLocaleString()}</p>
                      </div>
                    )}
                    {offer.proposedDate && (
                      <div>
                        <p className="text-xs text-muted-foreground">Proposed Date</p>
                        <p className="font-semibold">
                          {new Date(offer.proposedDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {offer.notes && (
                    <p className="text-sm text-muted-foreground italic">{offer.notes}</p>
                  )}

                  {/* Action Buttons */}
                  {offer.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => onAcceptOffer(offer.id)}
                        disabled={isLoading}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRejectOffer(offer.id)}
                        disabled={isLoading}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Proposal Form */}
        {!showForm ? (
          <Button
            onClick={() => setShowForm(true)}
            variant="outline"
            className="w-full"
            disabled={isLoading}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Make a Counter-Offer
          </Button>
        ) : (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm">Propose New Terms</h4>

            {/* Fee Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Proposed Fee ($)</label>
              <Input
                type="number"
                value={proposedFee}
                onChange={(e) => setProposedFee(e.target.value)}
                placeholder="Enter proposed fee"
              />
              {feeChange && (
                <p
                  className={`text-xs mt-1 ${
                    feeChange.change > 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {feeChange.change > 0 ? '+' : ''}{feeChange.change.toLocaleString()} (
                  {feeChange.percent.toFixed(1)}%)
                </p>
              )}
            </div>

            {/* Date Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Proposed Date</label>
              <Input
                type="date"
                value={proposedDate}
                onChange={(e) => setProposedDate(e.target.value)}
              />
            </div>

            {/* Party Size Input */}
            {originalPartySize && (
              <div>
                <label className="text-sm font-medium mb-2 block">Proposed Party Size</label>
                <Input
                  type="number"
                  value={proposedPartySize}
                  onChange={(e) => setProposedPartySize(e.target.value)}
                  placeholder="Enter proposed party size"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-sm font-medium mb-2 block">Notes (Optional)</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain your proposal..."
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {notes.length}/500 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isLoading}
                className="flex-1"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Proposal'}
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                variant="outline"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Info Message */}
        <p className="text-xs text-muted-foreground text-center">
          Negotiating terms helps both parties find mutually beneficial agreements
        </p>
      </CardContent>
    </Card>
  );
}
