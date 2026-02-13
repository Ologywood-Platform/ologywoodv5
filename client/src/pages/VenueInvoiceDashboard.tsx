import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Clock, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/utils';

export function VenueInvoiceDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Fetch venue invoices
  const { data: invoices, isLoading: invoicesLoading } = trpc.payout.getVenueInvoices.useQuery({
    limit: 20,
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

  // Calculate summary stats
  const invoiceList = Array.isArray(invoices) ? invoices : (invoices as any)?.data || [];
  const totalInvoiced = invoiceList.reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount || 0), 0) || 0;
  const paidAmount = invoiceList.reduce((sum: number, inv: any) => inv.status === 'paid' ? sum + parseFloat(inv.totalAmount || 0) : sum, 0) || 0;
  const pendingAmount = invoiceList.reduce((sum: number, inv: any) => inv.status === 'pending' ? sum + parseFloat(inv.totalAmount || 0) : sum, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
            <p className="text-sm text-slate-600">Artist payments</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Invoiced */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Invoiced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {invoicesLoading ? '...' : formatCurrency(totalInvoiced)}
                </div>
                <p className="text-xs text-slate-500 mt-1">All invoices</p>
              </CardContent>
            </Card>

            {/* Paid */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {invoicesLoading ? '...' : formatCurrency(paidAmount)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Completed</p>
              </CardContent>
            </Card>

            {/* Pending */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-amber-600">
                  {invoicesLoading ? '...' : formatCurrency(pendingAmount)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Awaiting payment</p>
              </CardContent>
            </Card>
          </div>

          {/* Invoices List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recent Invoices</CardTitle>
              <CardDescription>{invoiceList?.length || 0} invoice(s)</CardDescription>
            </CardHeader>
            <CardContent>
              {invoiceList && invoiceList.length > 0 ? (
                <div className="space-y-2">
                  {invoiceList.map((invoice: any) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{invoice.artistName || 'Artist'}</p>
                        <p className="text-xs text-slate-600">
                          Invoice #{invoice.invoiceNumber || invoice.id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatCurrency(invoice.totalAmount)}</p>
                        <p className={`text-xs font-medium capitalize mt-1 ${
                          invoice.status === 'paid' ? 'text-green-600' :
                          invoice.status === 'overdue' ? 'text-red-600' :
                          'text-amber-600'
                        }`}>
                          {invoice.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600 text-center py-6">
                  No invoices yet. Create your first booking to generate invoices.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
