import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import SiteHeader from '@/components/SiteHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Clock, CheckCircle, FileText, Download, ExternalLink } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import PageBreadcrumb from '@/components/PageBreadcrumb';

function formatCurrency(amount: number | string | null | undefined): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function VenueInvoiceDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Fetch real bookings with payment data
  const { data: bookings, isLoading } = trpc.booking.getMyVenueBookings.useQuery(undefined, {
    enabled: user?.role === 'venue',
  });

  // Verify user is a venue
  if (user?.role !== 'venue') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This page is only for venues.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build invoice records from bookings that have payment activity
  const invoiceList = (bookings || [])
    .filter((b: any) => b.paymentStatus && b.paymentStatus !== 'unpaid')
    .map((b: any) => {
      const totalFee = parseFloat(b.totalFee || '0');
      const depositAmount = parseFloat(b.depositAmount || '0') || totalFee * 0.5;
      const isFullyPaid = b.paymentStatus === 'fully_paid';
      const isDepositPaid = b.paymentStatus === 'deposit_paid' || isFullyPaid;

      const payments: Array<{
        label: string;
        amount: number;
        status: 'paid' | 'pending';
        date: string | null;
      }> = [];

      if (isDepositPaid) {
        payments.push({
          label: '50% Deposit',
          amount: depositAmount,
          status: 'paid',
          date: b.depositPaidAt,
        });
      }

      if (isFullyPaid) {
        payments.push({
          label: 'Remaining Balance',
          amount: totalFee - depositAmount,
          status: 'paid',
          date: b.finalPaidAt,
        });
      } else if (isDepositPaid) {
        payments.push({
          label: 'Remaining Balance',
          amount: totalFee - depositAmount,
          status: 'pending',
          date: null,
        });
      }

      return {
        bookingId: b.id,
        artistName: b.artistName || `Artist #${b.artistId}`,
        eventDetails: b.eventDetails || 'Event Booking',
        eventDate: b.eventDate,
        totalFee,
        depositAmount,
        paymentStatus: b.paymentStatus,
        payments,
        paidTotal: payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0),
        pendingTotal: payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
      };
    })
    .sort((a: any, b: any) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

  // Also include bookings with no payments yet (unpaid but confirmed)
  const unpaidBookings = (bookings || [])
    .filter((b: any) => (!b.paymentStatus || b.paymentStatus === 'unpaid') && b.status !== 'cancelled')
    .map((b: any) => {
      const totalFee = parseFloat(b.totalFee || '0');
      const depositAmount = totalFee * 0.5;
      return {
        bookingId: b.id,
        artistName: b.artistName || `Artist #${b.artistId}`,
        eventDetails: b.eventDetails || 'Event Booking',
        eventDate: b.eventDate,
        totalFee,
        depositAmount,
        paymentStatus: 'unpaid' as const,
        payments: [
          { label: '50% Deposit', amount: depositAmount, status: 'pending' as const, date: null },
          { label: 'Remaining Balance', amount: totalFee - depositAmount, status: 'pending' as const, date: null },
        ],
        paidTotal: 0,
        pendingTotal: totalFee,
      };
    });

  const allInvoices = [...invoiceList, ...unpaidBookings];

  // Summary stats
  const totalInvoiced = allInvoices.reduce((s, inv) => s + inv.totalFee, 0);
  const totalPaid = allInvoices.reduce((s, inv) => s + inv.paidTotal, 0);
  const totalPending = allInvoices.reduce((s, inv) => s + inv.pendingTotal, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'fully_paid':
        return <Badge className="bg-green-500 text-white">Fully Paid</Badge>;
      case 'deposit_paid':
        return <Badge className="bg-blue-500 text-white">Deposit Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-amber-500 text-white">Awaiting Payment</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <>
    <SiteHeader />
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-teal-50 py-12">
      <div className="container max-w-5xl">
        <PageBreadcrumb
          className="mb-6"
          segments={[
            { label: 'Dashboard', href: '/venue-dashboard' },
            { label: 'Invoices' },
          ]}
        />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-muted-foreground mt-1">Track all payments for your bookings</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Total Invoiced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? '...' : formatCurrency(totalInvoiced)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {allInvoices.length} booking{allInvoices.length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {isLoading ? '...' : formatCurrency(totalPaid)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Completed payments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Outstanding
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {isLoading ? '...' : formatCurrency(totalPending)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Awaiting payment</p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Booking Invoices</CardTitle>
              <CardDescription>
                Payment records for all your artist bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading invoices...</div>
              ) : allInvoices.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">No invoices yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Invoices will appear here once you have bookings with payment activity.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate('/browse')}>
                    Browse Artists
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {allInvoices.map((invoice) => (
                    <div
                      key={invoice.bookingId}
                      className="border rounded-lg p-4 hover:bg-muted/30 transition-colors"
                    >
                      {/* Invoice Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{invoice.artistName}</h3>
                            {getStatusBadge(invoice.paymentStatus)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invoice.eventDetails} — {formatDate(invoice.eventDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{formatCurrency(invoice.totalFee)}</p>
                          <p className="text-xs text-muted-foreground">Total Fee</p>
                        </div>
                      </div>

                      {/* Payment Breakdown */}
                      <div className="bg-muted/30 rounded-md p-3 space-y-2">
                        {invoice.payments.map((payment, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {payment.status === 'paid' ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Clock className="h-4 w-4 text-amber-500" />
                              )}
                              <span>{payment.label}</span>
                              {payment.date && (
                                <span className="text-xs text-muted-foreground">
                                  — {formatDate(payment.date)}
                                </span>
                              )}
                            </div>
                            <span className={`font-medium ${
                              payment.status === 'paid' ? 'text-green-600' : 'text-amber-600'
                            }`}>
                              {formatCurrency(payment.amount)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => navigate(`/booking/${invoice.bookingId}`)}
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Booking
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => {
                            window.open(`/api/invoice/${invoice.bookingId}/download`, '_blank');
                          }}
                        >
                          <Download className="h-3 w-3" />
                          Download PDF
                        </Button>
                        {invoice.paymentStatus !== 'fully_paid' && invoice.paymentStatus !== 'unpaid' && (
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => navigate(`/booking/${invoice.bookingId}`)}
                          >
                            <DollarSign className="h-3 w-3" />
                            Pay Remaining
                          </Button>
                        )}
                        {invoice.paymentStatus === 'unpaid' && (
                          <Button
                            size="sm"
                            className="gap-1"
                            onClick={() => navigate(`/booking/${invoice.bookingId}`)}
                          >
                            <DollarSign className="h-3 w-3" />
                            Pay Deposit
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
