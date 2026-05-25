import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  ArrowLeft,
  Download,
  TrendingUp,
  Calendar,
  Loader2,
  BarChart3,
  PieChart,
  FileText,
} from 'lucide-react';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import SiteHeader from '@/components/SiteHeader';

type Period = 'all' | 'month' | 'quarter' | 'year';

export default function EarningsBreakdown() {
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState<Period>('all');
  const [viewMode, setViewMode] = useState<'bookings' | 'monthly' | 'quarterly'>('bookings');

  const { data, isLoading } = trpc.payout.getEarningsBreakdown.useQuery({ period });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const exportCSV = () => {
    if (!data) return;

    let csvContent = '';

    if (viewMode === 'bookings') {
      csvContent = 'Date,Event,Venue,Payment Type,Gross Amount,Platform Fee (1%),Net Amount,Status,Attendance\n';
      for (const e of data.bookingEarnings) {
        csvContent += `"${formatDate(e.eventDate)}","${e.eventDetails}","${e.venueName}","${e.doorSplitDetails?.type || 'N/A'}",${e.grossAmount},${e.platformFee},${e.netAmount},"${e.status}",${e.attendance || ''}\n`;
      }
    } else if (viewMode === 'monthly') {
      csvContent = 'Month,Bookings,Gross Amount,Platform Fee,Net Amount\n';
      for (const m of data.monthlySummary) {
        csvContent += `"${m.month}",${m.count},${m.gross.toFixed(2)},${m.platformFee.toFixed(2)},${m.net.toFixed(2)}\n`;
      }
    } else {
      csvContent = 'Quarter,Bookings,Gross Amount,Platform Fee,Net Amount\n';
      for (const q of data.quarterlySummary) {
        csvContent += `"${q.quarter}",${q.count},${q.gross.toFixed(2)},${q.platformFee.toFixed(2)},${q.net.toFixed(2)}\n`;
      }
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `earnings-${viewMode}-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <>
        <SiteHeader />
        <div className="flex items-center justify-center py-12 gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading earnings breakdown...</span>
        </div>
      </>
    );
  }

  const totals = data?.totals || { gross: 0, platformFee: 0, net: 0, bookingCount: 0 };

  return (
    <>
      <SiteHeader />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb */}
        <PageBreadcrumb
          segments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Earnings', href: '/earnings' },
            { label: 'Breakdown' },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/earnings')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Earnings
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Earnings Breakdown</h1>
              <p className="text-gray-600 text-sm mt-1">Per-booking revenue with door split calculations</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatCurrency(totals.net)}</p>
                  <p className="text-xs text-gray-500">Net Earnings</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatCurrency(totals.gross)}</p>
                  <p className="text-xs text-gray-500">Gross Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <PieChart className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{formatCurrency(totals.platformFee)}</p>
                  <p className="text-xs text-gray-500">Platform Fee (1%)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-bold">{totals.bookingCount}</p>
                  <p className="text-xs text-gray-500">Paid Bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['all', 'month', 'quarter', 'year'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                  period === p
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {p === 'all' ? 'All Time' : p === 'month' ? 'This Month' : p === 'quarter' ? 'This Quarter' : 'This Year'}
              </button>
            ))}
          </div>

          {/* View mode selector */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('bookings')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1 ${
                viewMode === 'bookings'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <FileText className="h-3 w-3" /> Per Booking
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1 ${
                viewMode === 'monthly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-3 w-3" /> Monthly
            </button>
            <button
              onClick={() => setViewMode('quarterly')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition flex items-center gap-1 ${
                viewMode === 'quarterly'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-3 w-3" /> Quarterly
            </button>
          </div>
        </div>

        {/* Per-Booking Table */}
        {viewMode === 'bookings' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Per-Booking Earnings
              </CardTitle>
              <CardDescription>
                Detailed breakdown of each booking's revenue and payment terms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data?.bookingEarnings && data.bookingEarnings.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Venue</TableHead>
                        <TableHead>Payment Type</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">Fee (1%)</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.bookingEarnings.map((e) => (
                        <TableRow key={e.bookingId} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" onClick={() => navigate(`/bookings/${e.bookingId}`)}>
                          <TableCell className="text-sm whitespace-nowrap">{formatDate(e.eventDate)}</TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{e.eventDetails}</TableCell>
                          <TableCell className="text-sm max-w-[150px] truncate">{e.venueName}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                              {e.doorSplitDetails?.type || 'Flat'}
                            </span>
                            {e.doorSplitDetails?.artistPercent && (
                              <span className="ml-1 text-xs text-gray-500">
                                ({e.doorSplitDetails.artistPercent}%)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(e.grossAmount)}</TableCell>
                          <TableCell className="text-right text-gray-500 text-sm">{formatCurrency(e.platformFee)}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">{formatCurrency(e.netAmount)}</TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              e.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : e.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                              {e.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No booking earnings for this period</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Monthly Summary */}
        {viewMode === 'monthly' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Summary
              </CardTitle>
              <CardDescription>Aggregated earnings by month</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.monthlySummary && data.monthlySummary.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-center">Bookings</TableHead>
                      <TableHead className="text-right">Gross Revenue</TableHead>
                      <TableHead className="text-right">Platform Fee</TableHead>
                      <TableHead className="text-right">Net Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.monthlySummary.map((m) => (
                      <TableRow key={m.month}>
                        <TableCell className="font-medium">
                          {new Date(m.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                        </TableCell>
                        <TableCell className="text-center">{m.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(m.gross)}</TableCell>
                        <TableCell className="text-right text-gray-500">{formatCurrency(m.platformFee)}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{formatCurrency(m.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-8">No monthly data available</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quarterly Summary */}
        {viewMode === 'quarterly' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Quarterly Summary
              </CardTitle>
              <CardDescription>Aggregated earnings by quarter</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.quarterlySummary && data.quarterlySummary.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quarter</TableHead>
                      <TableHead className="text-center">Bookings</TableHead>
                      <TableHead className="text-right">Gross Revenue</TableHead>
                      <TableHead className="text-right">Platform Fee</TableHead>
                      <TableHead className="text-right">Net Earnings</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.quarterlySummary.map((q) => (
                      <TableRow key={q.quarter}>
                        <TableCell className="font-medium">{q.quarter}</TableCell>
                        <TableCell className="text-center">{q.count}</TableCell>
                        <TableCell className="text-right">{formatCurrency(q.gross)}</TableCell>
                        <TableCell className="text-right text-gray-500">{formatCurrency(q.platformFee)}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">{formatCurrency(q.net)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-8">No quarterly data available</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Door Split Explanation */}
        <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">Understanding Payment Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-700 dark:text-purple-400">
              <div>
                <p className="font-medium">Flat Guarantee</p>
                <p className="text-xs mt-1">Fixed fee agreed before the show. You receive the full amount regardless of door revenue.</p>
              </div>
              <div>
                <p className="font-medium">Door Split</p>
                <p className="text-xs mt-1">You receive a percentage of door/ticket revenue (e.g., 80/20 split). Final amount depends on attendance.</p>
              </div>
              <div>
                <p className="font-medium">Guarantee vs %</p>
                <p className="text-xs mt-1">You receive whichever is higher: a minimum guarantee OR your percentage of door revenue.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
