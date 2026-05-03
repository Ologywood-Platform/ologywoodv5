import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Calendar, MapPin, Ticket, ArrowLeft, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { TicketQRCode } from '@/components/TicketQRCode';
import SiteHeader from '@/components/SiteHeader';
import Footer from '@/components/Footer';

export default function TicketConfirmation() {
  const { orderNumber } = useParams();
  const [, navigate] = useLocation();

  const { data: order, isLoading, error } = trpc.ticketing.getOrderByNumber.useQuery(
    { orderNumber: orderNumber || '' },
    { enabled: !!orderNumber }
  );

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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <SiteHeader />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">We couldn't find this order. Please check your order number.</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'TBD';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-slate-900">You're In!</h1>
          <p className="text-muted-foreground mt-2">
            Your tickets have been confirmed. Show the QR codes below at the door.
          </p>
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Order #{order.orderNumber}</CardTitle>
              <Badge variant={order.status === 'completed' ? 'default' : 'secondary'}>
                {order.status === 'completed' ? 'Confirmed' : order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Event Info */}
            {order.event && (
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-bold text-lg">{order.event.title}</h3>
                <div className="flex flex-col gap-1 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.event.date)}
                    {order.event.time && ` at ${order.event.time}`}
                  </span>
                  {order.event.location && (
                    <span className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {order.event.location}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tickets with QR Codes */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Your Tickets ({order.items.length})
              </h4>
              <div className="space-y-4">
                {order.items.map((item: any) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{item.tierName}</p>
                        {item.attendeeName && (
                          <p className="text-sm text-muted-foreground">{item.attendeeName}</p>
                        )}
                      </div>
                      <Badge variant={item.status === 'valid' ? 'default' : item.status === 'used' ? 'secondary' : 'destructive'}>
                        {item.status === 'valid' ? 'Valid' : item.status === 'used' ? 'Used' : item.status}
                      </Badge>
                    </div>
                    {/* QR Code */}
                    <div className="flex justify-center py-2">
                      <TicketQRCode
                        ticketCode={item.ticketCode}
                        tierName={item.tierName}
                        size={180}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Show this QR code at the venue entrance
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-t pt-3">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${((order.totalAmount - order.platformFee) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Service fee</span>
                <span>${(order.platformFee / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold mt-1 pt-1 border-t">
                <span>Total paid</span>
                <span>${(order.totalAmount / 100).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          {order.event && (
            <Button onClick={() => navigate(`/events/${order.event!.id}`)} className="flex-1">
              View Event
            </Button>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          A confirmation email has been sent to {order.buyerEmail}. 
          Present your ticket QR code at the venue entrance for check-in.
        </p>
      </div>
      <Footer />
    </div>
  );
}
