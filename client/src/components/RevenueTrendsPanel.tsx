import { useMemo, useState } from 'react';
import { FileText, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

type TrendPoint = {
  month: string;
  bookings: number;
  music: number;
  hostedContent: number;
  merch: number;
  fanClub: number;
  live: number;
  tips: number;
  tickets: number;
  total: number;
};

const streams: Array<{ key: keyof Omit<TrendPoint, 'month' | 'total'>; label: string; color: string }> = [
  { key: 'bookings', label: 'Bookings', color: '#8b5cf6' },
  { key: 'music', label: 'Music', color: '#06b6d4' },
  { key: 'hostedContent', label: 'Hosted content', color: '#f59e0b' },
  { key: 'merch', label: 'Merch & books', color: '#10b981' },
  { key: 'fanClub', label: 'Fan Club', color: '#ec4899' },
  { key: 'live', label: 'Ology Live', color: '#ef4444' },
  { key: 'tips', label: 'Tips', color: '#14b8a6' },
  { key: 'tickets', label: 'Tickets', color: '#6366f1' },
];

const money = (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const csvCell = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

function dateForMonths(months: number) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
  return { from: start.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
}

export default function RevenueTrendsPanel() {
  const [period, setPeriod] = useState('12');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const range = period === 'custom' ? { from: customFrom || undefined, to: customTo || undefined } : dateForMonths(Number(period));
  const trendQuery = trpc.profileAnalytics.getRevenueTrend.useQuery({ months: period === 'custom' ? 120 : Number(period), ...range }, { enabled: period !== 'custom' || Boolean(customFrom && customTo), staleTime: 2 * 60 * 1000 });
  const points = (trendQuery.data || []) as TrendPoint[];
  const maxValue = Math.max(1, ...points.map((point) => point.total));
  const filteredTotal = points.reduce((sum, point) => sum + point.total, 0);

  const csvRows = useMemo(() => {
    const header = ['Month', ...streams.map((stream) => `${stream.label} Net`), 'Total Net'];
    return [header, ...points.map((point) => [point.month, ...streams.map((stream) => point[stream.key].toFixed(2)), point.total.toFixed(2)])]
      .map((row) => row.map((cell) => csvCell(cell)).join(','));
  }, [points]);

  const exportCsv = () => {
    const blob = new Blob([`${csvRows.join('\n')}\n\nFiltered net total,${filteredTotal.toFixed(2)}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ologywood-revenue-breakdown-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    if (isExportingPdf || !points.length) return;
    setIsExportingPdf(true);
    const filename = `ologywood-revenue-breakdown-${new Date().toISOString().slice(0, 10)}.pdf`;
    const element = document.createElement('div');
    element.style.cssText = 'font-family: Arial, sans-serif; padding: 28px; color: #111827; width: 760px;';
    element.innerHTML = `<h1>OlogyWood Revenue Breakdown</h1><p>Filtered net revenue: <strong>${money(filteredTotal)}</strong></p><p>Period: ${range.from || 'All'} to ${range.to || 'Present'}</p><table style="border-collapse:collapse;width:100%;font-size:12px"><thead><tr>${['Month', ...streams.map((stream) => stream.label), 'Total'].map((cell) => `<th style="border:1px solid #d1d5db;padding:7px;text-align:left">${cell}</th>`).join('')}</tr></thead><tbody>${points.map((point) => `<tr>${[point.month, ...streams.map((stream) => money(point[stream.key])), money(point.total)].map((cell) => `<td style="border:1px solid #d1d5db;padding:7px">${cell}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

    try {
      const module = await import('html2pdf.js');
      const html2pdf = module.default ?? module;
      if (typeof html2pdf !== 'function') throw new Error('PDF generator unavailable');
      document.body.appendChild(element);
      const pdfBlob = await html2pdf()
        .set({
          margin: 10,
          filename,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale: 2,
            onclone: (clonedDocument: Document) => {
              clonedDocument.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove());
            },
          },
          jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4' },
        })
        .from(element)
        .outputPdf('blob');
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success('Revenue PDF downloaded');
    } catch (error) {
      console.error('[Revenue PDF] Export failed:', error instanceof Error ? error.name : 'UnknownError');
      toast.error('Could not download the revenue PDF. Please try again.');
    } finally {
      element.remove();
      setIsExportingPdf(false);
    }
  };

  return (
    <Card className="overflow-hidden" id="revenue-trends">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-purple-600" /><CardTitle className="text-lg">Revenue Trends</CardTitle></div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="revenue-period">Revenue period</label>
            <select id="revenue-period" value={period} onChange={(event) => setPeriod(event.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm">
              <option value="3">Last 3 months</option><option value="6">Last 6 months</option><option value="12">Last 12 months</option><option value="24">Last 24 months</option><option value="custom">Custom range</option>
            </select>
            {period === 'custom' && <><input aria-label="Revenue start date" type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" /><input aria-label="Revenue end date" type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" /></>}
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!points.length} className="gap-1"><FileSpreadsheet className="h-4 w-4" /> CSV</Button>
            <Button variant="outline" size="sm" onClick={exportPdf} disabled={!points.length || isExportingPdf} className="gap-1"><FileText className="h-4 w-4" />{isExportingPdf ? 'Preparing…' : 'PDF'}</Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Net revenue by month across every native talent stream. Fan Club reflects active recurring monthly net run-rate.</p>
      </CardHeader>
      <CardContent>
        {trendQuery.isLoading ? <div className="h-56 animate-pulse rounded-lg bg-muted" /> : trendQuery.error ? <p className="py-10 text-center text-sm text-destructive">Revenue trends are temporarily unavailable.</p> : points.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Choose a valid date range to view revenue trends.</p> : <>
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">{streams.map((stream) => <span key={stream.key} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stream.color }} />{stream.label}</span>)}</div>
          <div className="overflow-x-auto"><svg role="img" aria-label="Monthly net revenue by stream" viewBox={`0 0 ${Math.max(700, points.length * 78)} 280`} className="h-64 min-w-[700px] w-full">
            {points.map((point, index) => { const x = 42 + index * (Math.max(700, points.length * 78) - 70) / Math.max(1, points.length - 1); const y = 235 - (point.total / maxValue) * 190; return <g key={point.month}><line x1={x} x2={x} y1="35" y2="235" stroke="currentColor" opacity="0.08" /><circle cx={x} cy={y} r="4" fill="#8b5cf6" /><text x={x} y="258" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.65">{point.month.slice(5)}/{point.month.slice(2, 4)}</text><text x={x} y={Math.max(18, y - 10)} textAnchor="middle" fontSize="10" fill="currentColor">{money(point.total)}</text>{index > 0 && <line x1={42 + (index - 1) * (Math.max(700, points.length * 78) - 70) / Math.max(1, points.length - 1)} y1={235 - (points[index - 1].total / maxValue) * 190} x2={x} y2={y} stroke="#8b5cf6" strokeWidth="3" />}</g>; })}
            <line x1="42" x2={Math.max(700, points.length * 78) - 28} y1="235" y2="235" stroke="currentColor" opacity="0.2" />
          </svg></div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Filtered net total</p><p className="text-lg font-semibold">{money(filteredTotal)}</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Months shown</p><p className="text-lg font-semibold">{points.length}</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Best month</p><p className="text-lg font-semibold">{points.reduce((best, point) => point.total > best.total ? point : best, points[0]).month}</p></div><div className="rounded-lg bg-muted/50 p-3"><p className="text-xs text-muted-foreground">Music download revenue</p><p className="text-lg font-semibold">{points.reduce((sum, point) => sum + point.music, 0) > 0 ? money(points.reduce((sum, point) => sum + point.music, 0)) : '$0.00'}</p></div></div>
        </>}
      </CardContent>
    </Card>
  );
}
