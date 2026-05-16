import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Calendar, MapPin, Loader2, CheckCircle, XCircle, Ticket } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToastContext } from '@/components/ErrorToast';
import SiteHeader from '@/components/SiteHeader';

export default function AcceptTransfer() {
  const { code } = useParams();
  const [, navigate] = useLocation();
  const toast = useToastContext();

  const { data: transfer, isLoading, error } = trpc.ticketing.getTransferByCode.useQuery(
    { transferCode: code || '' },
    { enabled: !!code }
  );

  const acceptMutation = trpc.ticketing.acceptTransfer.useMutation({
    onSuccess: (result) => {
      toast.addSuccess('Ticket accepted!', 'The ticket is now yours.');
    },
    onError: (err) => {
      toast.addError('Failed to accept', err.message);
    },
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'TBD';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SiteHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SiteHeader />
        <div className="container mx-auto px-4 py-12 text-center max-w-md">
          <XCircle className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h1 className="text-2xl font-bold mb-2">Transfer Not Found</h1>
          <p className="text-muted-foreground mb-6">This transfer link may have expired or been cancelled.</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>

      </div>
    );
  }

  const isAccepted = transfer.status === 'accepted' || acceptMutation.isSuccess;
  const isCancelled = transfer.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SiteHeader />
      <div className="container mx-auto px-4 py-12 max-w-md">
        <Card className="overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center">
            <Gift className="h-12 w-12 mx-auto mb-3 opacity-90" />
            <h1 className="text-xl font-bold mb-1">
              {isAccepted ? "Ticket Accepted!" : isCancelled ? "Transfer Cancelled" : "You've Got a Ticket!"}
            </h1>
            <p className="text-purple-100 text-sm">
              {isAccepted
                ? "This ticket is now yours"
                : isCancelled
                ? "This transfer was cancelled by the sender"
                : `${transfer.fromEmail} sent you a ticket`}
            </p>
          </div>

          <CardContent className="p-6">
            {/* Event Details */}
            {transfer.event && (
              <div className="space-y-3 mb-6">
                <h2 className="font-bold text-lg">{transfer.event.title}</h2>
                <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(transfer.event.date)}
                    {transfer.event.time && ` at ${transfer.event.time}`}
                  </span>
                  {transfer.event.location && (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {transfer.event.location}
                    </span>
                  )}
                  <span className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    {transfer.tierName}
                  </span>
                </div>
              </div>
            )}

            {/* Personal message */}
            {transfer.message && (
              <div className="bg-purple-50 p-4 rounded-lg mb-6 border-l-4 border-purple-400">
                <p className="text-sm text-purple-900 italic">"{transfer.message}"</p>
                <p className="text-xs text-purple-600 mt-1">— {transfer.fromEmail}</p>
              </div>
            )}

            {/* Action */}
            {isAccepted ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Ticket accepted successfully</span>
                </div>
                {acceptMutation.data?.ticket && (
                  <p className="text-sm text-muted-foreground">
                    Show your QR code at the venue entrance for check-in.
                  </p>
                )}
                <Button onClick={() => navigate('/my-tickets')} className="w-full">
                  View My Tickets
                </Button>
              </div>
            ) : isCancelled ? (
              <div className="text-center space-y-4">
                <Badge variant="outline" className="text-red-600 border-red-200">Cancelled</Badge>
                <p className="text-sm text-muted-foreground">
                  The sender cancelled this transfer. Contact them for more information.
                </p>
                <Button variant="outline" onClick={() => navigate('/')}>Go Home</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={() => acceptMutation.mutate({ transferCode: code || '' })}
                  disabled={acceptMutation.isPending}
                  className="w-full gap-2"
                  size="lg"
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Accept Ticket
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  By accepting, this ticket will be transferred to you.
                  You'll need to show the QR code at the venue entrance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
