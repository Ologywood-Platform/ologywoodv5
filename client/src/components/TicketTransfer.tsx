import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Loader2, Send, X, CheckCircle, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToastContext } from '@/components/ErrorToast';

interface TicketTransferProps {
  ticketItemId: number;
  ticketCode: string;
  tierName: string;
  onTransferComplete?: () => void;
}

export function TicketTransfer({ ticketItemId, ticketCode, tierName, onTransferComplete }: TicketTransferProps) {
  const [showForm, setShowForm] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [toName, setToName] = useState('');
  const [message, setMessage] = useState('');
  const toast = useToastContext();

  const transferMutation = trpc.ticketing.transferTicket.useMutation({
    onSuccess: () => {
      toast.addSuccess('Ticket sent!', `Transfer invitation sent to ${toEmail}`);
      setShowForm(false);
      setToEmail('');
      setToName('');
      setMessage('');
      onTransferComplete?.();
    },
    onError: (err) => {
      toast.addError('Transfer failed', err.message);
    },
  });

  const { data: transfers } = trpc.ticketing.getTransferStatus.useQuery(
    { ticketItemId },
    { enabled: showForm }
  );

  const cancelMutation = trpc.ticketing.cancelTransfer.useMutation({
    onSuccess: () => {
      toast.addSuccess('Transfer cancelled', 'The transfer has been cancelled.');
    },
  });

  const pendingTransfer = transfers?.find((t: any) => t.status === 'pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toEmail) return;
    transferMutation.mutate({ ticketItemId, toEmail, toName: toName || undefined, message: message || undefined });
  };

  if (!showForm) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowForm(true)}
        className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <Gift className="h-3.5 w-3.5" />
        Transfer
      </Button>
    );
  }

  return (
    <Card className="mt-2 border-dashed">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Gift className="h-4 w-4 text-purple-500" />
            Transfer "{tierName}" ticket
          </span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowForm(false)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {pendingTransfer ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Pending transfer to <strong>{pendingTransfer.toEmail}</strong></span>
              <Badge variant="outline" className="text-xs">Pending</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => cancelMutation.mutate({ transferId: pendingTransfer.id })}
              disabled={cancelMutation.isPending}
            >
              Cancel Transfer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-2">
            <p className="text-[10px] text-muted-foreground">The recipient will get an email with a link to claim this ticket. Your ticket becomes invalid once they accept.</p>
            <div>
              <Label className="text-xs">Recipient's Email *</Label>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                required
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Recipient's Name</Label>
              <Input
                placeholder="Their name (optional)"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Personal Message</Label>
              <Input
                placeholder="Enjoy the show! (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                className="h-8 text-sm"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={!toEmail || transferMutation.isPending}
              className="w-full gap-1.5"
            >
              {transferMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Send Ticket
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
