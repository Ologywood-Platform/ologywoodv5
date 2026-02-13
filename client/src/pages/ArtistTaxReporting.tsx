import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, TrendingUp, FileText, Download } from 'lucide-react';

export default function ArtistTaxReporting() {
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // Get tax report for selected year
  const { data: taxReport, isLoading: reportLoading } = useQuery({
    queryKey: ['taxReport', selectedYear],
    queryFn: async () => {
      const result = await trpc.taxReporting.getTaxReport.query({
        year: parseInt(selectedYear),
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  // Get monthly breakdown
  const { data: monthlyBreakdown } = useQuery({
    queryKey: ['monthlyBreakdown', selectedYear],
    queryFn: async () => {
      const result = await trpc.taxReporting.getMonthlyBreakdown.query({
        year: parseInt(selectedYear),
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
  });

  // Generate tax summary PDF
  const generateTaxSummary = async () => {
    try {
      const result = await trpc.taxReporting.generateTaxSummaryPdf.mutate({
        year: parseInt(selectedYear),
      });
      if (!result.success) throw new Error(result.error);
      
      // Download PDF
      const link = document.createElement('a');
      link.href = result.data.pdfUrl;
      link.download = `tax-summary-${selectedYear}.pdf`;
      link.click();
      
      toast.success('Tax summary PDF generated and downloaded');
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate tax summary');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tax Reporting</h1>
        <p className="text-gray-600 mt-2">View your annual earnings summary and download tax documents</p>
      </div>

      {/* Year selector */}
      <div className="flex gap-4 items-end">
        <div>
          <Label htmlFor="year">Select Year</Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={generateTaxSummary} disabled={reportLoading}>
          <Download className="w-4 h-4 mr-2" />
          Download Tax Summary PDF
        </Button>
      </div>

      {/* Summary cards */}
      {taxReport && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(parseFloat(taxReport.totalEarnings))}</div>
              <p className="text-xs text-gray-500 mt-1">{taxReport.bookingCount} bookings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(parseFloat(taxReport.totalPayouts))}</div>
              <p className="text-xs text-gray-500 mt-1">Paid to you</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Platform Fees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(parseFloat(taxReport.platformFees))}</div>
              <p className="text-xs text-gray-500 mt-1">Deducted from earnings</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Net Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(parseFloat(taxReport.netIncome))}</div>
              <p className="text-xs text-gray-500 mt-1">After fees</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly breakdown chart */}
      {monthlyBreakdown && monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings Trend</CardTitle>
            <CardDescription>Your earnings breakdown by month for {selectedYear}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Line type="monotone" dataKey="earnings" stroke="#3b82f6" name="Earnings" />
                <Line type="monotone" dataKey="fees" stroke="#ef4444" name="Platform Fees" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* 1099 Information */}
      <Card>
        <CardHeader>
          <CardTitle>1099 Information</CardTitle>
          <CardDescription>Tax form information for {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {taxReport?.form1099Issued ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium">✓ 1099 Form Issued</p>
              <p className="text-green-700 text-sm mt-1">Your 1099 form has been issued for tax year {selectedYear}</p>
              {taxReport.form1099Url && (
                <Button variant="outline" size="sm" className="mt-3">
                  <Download className="w-4 h-4 mr-2" />
                  Download 1099 Form
                </Button>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-medium">1099 Form Not Yet Issued</p>
              <p className="text-blue-700 text-sm mt-1">
                Your 1099 form will be issued by January 31st if your earnings exceed $600 for {selectedYear}
              </p>
            </div>
          )}

          <div className="mt-6 space-y-2">
            <h4 className="font-medium">Tax Summary Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total Bookings</p>
                <p className="font-semibold">{taxReport?.bookingCount || 0}</p>
              </div>
              <div>
                <p className="text-gray-600">Reporting Year</p>
                <p className="font-semibold">{selectedYear}</p>
              </div>
              <div>
                <p className="text-gray-600">Average Booking Value</p>
                <p className="font-semibold">
                  {taxReport && taxReport.bookingCount > 0
                    ? formatCurrency(parseFloat(taxReport.totalEarnings) / taxReport.bookingCount)
                    : '$0.00'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Effective Fee Rate</p>
                <p className="font-semibold">
                  {taxReport && parseFloat(taxReport.totalEarnings) > 0
                    ? `${((parseFloat(taxReport.platformFees) / parseFloat(taxReport.totalEarnings)) * 100).toFixed(1)}%`
                    : '0%'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax tips */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Tips for Artists</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <div className="text-blue-600 font-bold">•</div>
            <p className="text-sm">Keep records of all business expenses related to your performances (equipment, travel, etc.)</p>
          </div>
          <div className="flex gap-3">
            <div className="text-blue-600 font-bold">•</div>
            <p className="text-sm">Track mileage for travel to and from performances for tax deductions</p>
          </div>
          <div className="flex gap-3">
            <div className="text-blue-600 font-bold">•</div>
            <p className="text-sm">Consider setting aside 25-30% of your earnings for quarterly estimated tax payments</p>
          </div>
          <div className="flex gap-3">
            <div className="text-blue-600 font-bold">•</div>
            <p className="text-sm">Consult with a tax professional to maximize deductions and ensure compliance</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
