import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, Music, X, Send, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface QuickBookingModalProps {
  venue: {
    id: number;
    venueName?: string;
    organizationName?: string;
    location?: string;
    capacity?: number;
  };
  onClose: () => void;
}

export function QuickBookingModal({ venue, onClose }: QuickBookingModalProps) {
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('19:00');
  const [eventName, setEventName] = useState('');
  const [message, setMessage] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<'flat' | 'door_split' | 'guarantee_vs_percentage'>('flat');
  const [fee, setFee] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const requestToPerform = trpc.booking.requestToPerform.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success('Request sent to venue!');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to send request');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventDate || !eventName) {
      toast.error('Please fill in the event name and date');
      return;
    }

    const paymentTermsMap = {
      flat: 'flat_guarantee' as const,
      door_split: 'door_split' as const,
      guarantee_vs_percentage: 'guarantee_vs_percentage' as const,
    };

    requestToPerform.mutate({
      venueId: venue.id,
      eventName,
      eventDate,
      eventTime,
      message: message || undefined,
      paymentTermsType: paymentTermsMap[paymentTerms],
      proposedFee: fee ? parseFloat(fee) : undefined,
    });
  };

  const venueName = venue.venueName || venue.organizationName || 'Venue';

  const resetAndClose = () => {
    setEventDate('');
    setEventTime('19:00');
    setEventName('');
    setMessage('');
    setPaymentTerms('flat');
    setFee('');
    setSubmitted(false);
    onClose();
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetAndClose}>
        <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Request Sent!</h3>
            <p className="text-gray-600 mb-6">
              Your request to perform has been sent to <strong>{venueName}</strong>. They'll review it and get back to you.
            </p>
            <Button onClick={resetAndClose} className="w-full">Done</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={resetAndClose}>
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">Request to Perform</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Send a performance request to <strong>{venueName}</strong>
              </p>
            </div>
            <button onClick={resetAndClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          {venue.location && (
            <Badge variant="secondary" className="w-fit text-xs mt-2">
              {venue.location} {venue.capacity ? `• ${venue.capacity} cap` : ''}
            </Badge>
          )}
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium mb-1">
                <Music className="w-4 h-4 inline mr-1" />
                Show / Event Name *
              </label>
              <input
                id="eventName"
                name="eventName"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value.slice(0, 100))}
                placeholder="e.g. Friday Night Live, Album Release Party"
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{eventName.length}/100</p>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Preferred Date *
                </label>
                <input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Time
                </label>
                <input
                  id="eventTime"
                  name="eventTime"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Preferred Payment Terms
              </label>
              <select
                id="paymentTerms"
                name="paymentTerms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="flat">Flat Guarantee</option>
                <option value="door_split">Door Split %</option>
                <option value="guarantee_vs_percentage">Guarantee vs. Percentage</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {paymentTerms === 'flat' && 'Fixed amount paid regardless of attendance'}
                {paymentTerms === 'door_split' && 'Percentage of door revenue (e.g. 80/20 split)'}
                {paymentTerms === 'guarantee_vs_percentage' && 'Whichever is higher: guaranteed minimum or % of door'}
              </p>
            </div>

            {/* Fee / Rate */}
            {paymentTerms === 'flat' && (
              <div>
                <label className="block text-sm font-medium mb-1">Your Rate ($)</label>
                <input
                  id="proposedFee"
                  name="proposedFee"
                  type="number"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="e.g. 500"
                  min="0"
                  step="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-500 mt-1">This is your proposed fee — the venue may negotiate. Leave blank if you're flexible.</p>
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-sm font-medium mb-1">Message to Venue</label>
              <textarea
                id="performMessage"
                name="performMessage"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                placeholder="Tell the venue about your act, expected draw, genre, or any special requirements..."
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none max-h-[120px] overflow-y-auto"
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500">Mention your expected draw, genre, and what makes your show a good fit.</p>
                <p className={`text-xs ${message.length >= 450 ? 'text-orange-500' : 'text-gray-400'}`}>{message.length}/500</p>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={requestToPerform.isPending}
            >
              {requestToPerform.isPending ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Request to Perform
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
