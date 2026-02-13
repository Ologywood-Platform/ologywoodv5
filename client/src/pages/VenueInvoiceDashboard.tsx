import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Send,
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { formatCurrency } from '@/lib/utils';

export function VenueInvoiceDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Fetch venue invoices
  const { data: invoices, isLoading: invoicesLoading } = trpc.payout.getVenueInvoices.useQuery({
    limit: 50,
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
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Calculate summary stats
  const totalInvoiced = invoices?.reduce((sum, inv: any) => sum + parseFloat(inv.totalAmount || 0), 0) || 0;
  const paidAmount = invoices?.reduce((sum, inv: any) => inv.status === 'paid' ? sum + parseFloat(inv.totalAmount || 0) : sum, 0) || 0;
  const pendingAmount = invoices?.reduce((sum, inv: any) => inv.status === 'pending' ? sum + parseFloat(inv.totalAmount || 0) : sum, 0) || 0;
  const overdueAmount = invoices?.reduce((sum, inv: any) => inv.status === 'overdue' ? sum + parseFloat(inv.totalAmount || 0) : sum, 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
              <p className="text-sm text-slate-600">Manage artist payments and invoices</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Paid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {invoicesLoading ? '...' : formatCurrency(paidAmount)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Completed payments</p>
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

            {/* Overdue */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {invoicesLoading ? '...' : formatCurrency(overdueAmount)}
                </div>
                <p className="text-xs text-slate-500 mt-1">Past due date</p>
              </CardContent>
            </Card>
          </div>

          {/* Overdue Alert */}
          {overdueAmount > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-base">Outstanding Payments</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700 mb-4">
                  You have {formatCurrency(overdueAmount)} in overdue invoices. Please process payments to maintain good standing with artists.
                </p>
                <Button
                  variant="outline"
                  onClick={() => toggleSection('invoices')}
                  className="gap-2"
                >
                  View Overdue Invoices
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Invoices List */}
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => toggleSection('invoices')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Invoices</CardTitle>
                  <CardDescription>
                    {invoices?.length || 0} invoice(s)
                  </CardDescription>
                </div>
                {expandedSection === 'invoices' ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </CardHeader>

            {expandedSection === 'invoices' && (
              <CardContent>
                {invoices && invoices.length > 0 ? (
                  <div className="space-y-3">
                    {invoices.map((invoice: any) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{invoice.artistName || 'Artist'}</p>
                          <p className="text-xs text-slate-600">
                            Invoice #{invoice.invoiceNumber || invoice.id}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="text-right mr-4">
                          <p className="font-bold text-sm">{formatCurrency(invoice.totalAmount)}</p>
                          <p className={`text-xs font-medium capitalize mt-1 ${
                            invoice.status === 'paid' ? 'text-green-600' :
                            invoice.status === 'overdue' ? 'text-red-600' :
                            'text-amber-600'
                          }`}>
                            {invoice.status}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Download invoice"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          {invoice.status !== 'paid' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Send reminder"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
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
            )}
          </Card>

          {/* Payment Terms Info */}
          <Card>
            <CardHeader
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => toggleSection('terms')}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Payment Terms</CardTitle>
                {expandedSection === 'terms' ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </CardHeader>

            {expandedSection === 'terms' && (
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-sm mb-2">Invoice Payment Process</h4>
                    <ul className="text-sm text-slate-700 space-y-2">
                      <li className="flex gap-2">
                        <span className="font-bold text-primary">1.</span>
                        <span>Invoice is generated after booking confirmation</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-primary">2.</span>
                        <span>Payment is due within 30 days of invoice date</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-primary">3.</span>
                        <span>Late payments incur a 1.5% monthly interest charge</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-bold text-primary">4.</span>
                        <span>Artists are notified of payment status automatically</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-semibold text-sm mb-2 text-blue-900">Platform Fee</h4>
                    <p className="text-sm text-blue-800">
                      Ologywood charges a 1% platform fee on each booking. This is deducted from the artist's payment and helps us maintain the platform and provide support.
                    </p>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
