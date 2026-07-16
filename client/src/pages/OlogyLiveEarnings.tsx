import { useState, useCallback, useEffect, useRef } from "react";
import { trpc } from "../lib/trpc";
import { DollarSign, TrendingUp, Calendar, Download, AlertTriangle, FileText, FileSpreadsheet, BarChart3 } from "lucide-react";

/**
 * EarningsChart — renders a grouped bar chart showing monthly gross, net, and fees
 */
function EarningsChart({ monthlyData }: { monthlyData: any[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current || !monthlyData || monthlyData.length === 0) return;

    const loadChart = async () => {
      const { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } = await import("chart.js");
      Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const labels = monthlyData.map((m: any) => m.month);
      const grossData = monthlyData.map((m: any) => parseFloat(m.totalGross || "0"));
      const netData = monthlyData.map((m: any) => parseFloat(m.totalNet || "0"));
      const feeData = monthlyData.map((m: any) => {
        const gross = parseFloat(m.totalGross || "0");
        const net = parseFloat(m.totalNet || "0");
        return Math.max(0, gross - net);
      });

      chartRef.current = new Chart(canvasRef.current!, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Gross Revenue",
              data: grossData,
              backgroundColor: "rgba(124, 58, 237, 0.7)",
              borderColor: "rgba(124, 58, 237, 1)",
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: "Net Earnings",
              data: netData,
              backgroundColor: "rgba(22, 163, 74, 0.7)",
              borderColor: "rgba(22, 163, 74, 1)",
              borderWidth: 1,
              borderRadius: 4,
            },
            {
              label: "Platform Fees",
              data: feeData,
              backgroundColor: "rgba(156, 163, 175, 0.5)",
              borderColor: "rgba(156, 163, 175, 1)",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                usePointStyle: true,
                padding: 16,
                font: { size: 12 },
              },
            },
            tooltip: {
              callbacks: {
                label: (ctx: any) => `${ctx.dataset.label}: $${ctx.parsed.y.toFixed(2)}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => `$${value}`,
              },
            },
          },
        },
      });
    };

    loadChart();

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [monthlyData]);

  return <canvas ref={canvasRef} />;
}

export default function OlogyLiveEarnings() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const earnings = trpc.ologyLivePhase2.getEarningsSummary.useQuery();
  const nilReport = trpc.ologyLivePhase2.getNilReport.useQuery({ year: selectedYear });

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  const exportCSV = useCallback(() => {
    if (!nilReport.data) return;
    setExporting("csv");

    const rows: string[][] = [];
    rows.push(["OlogyWood NIL Earnings Report"]);
    rows.push([`Year: ${selectedYear}`]);
    rows.push([`Generated: ${new Date().toLocaleDateString()}`]);
    rows.push([]);
    rows.push(["--- SUMMARY ---"]);
    rows.push(["Total Gross Earnings", `$${nilReport.data.totalGrossEarnings.toFixed(2)}`]);
    rows.push(["Total Net Earnings", `$${nilReport.data.totalNetEarnings.toFixed(2)}`]);
    rows.push(["Platform Fees (15%)", `$${(nilReport.data.totalGrossEarnings - nilReport.data.totalNetEarnings).toFixed(2)}`]);
    rows.push(["Total Sessions", String(nilReport.data.totalSessions)]);
    rows.push([]);

    // Monthly breakdown
    if (nilReport.data.monthlyBreakdown && nilReport.data.monthlyBreakdown.length > 0) {
      rows.push(["--- MONTHLY BREAKDOWN ---"]);
      rows.push(["Month", "Gross Revenue", "Net Earnings", "Sessions"]);
      nilReport.data.monthlyBreakdown.forEach((month: any) => {
        rows.push([
          month.month,
          `$${parseFloat(month.totalGross || "0").toFixed(2)}`,
          `$${parseFloat(month.totalNet || "0").toFixed(2)}`,
          String(month.sessions),
        ]);
      });
      rows.push([]);
    }

    // Category breakdown
    if (earnings.data?.byCategory && earnings.data.byCategory.length > 0) {
      rows.push(["--- EARNINGS BY NIL CATEGORY ---"]);
      rows.push(["Category", "Net Earnings", "Sessions"]);
      earnings.data.byCategory.forEach((cat: any) => {
        rows.push([
          (cat.category || "other").replace(/_/g, " "),
          `$${parseFloat(cat.totalNet || "0").toFixed(2)}`,
          String(cat.count),
        ]);
      });
      rows.push([]);
    }

    rows.push(["--- DISCLAIMER ---"]);
    rows.push([nilReport.data.disclaimer || "This report is for informational purposes only and does not constitute tax or legal advice."]);

    const csvContent = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ologywood-nil-earnings-${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setExporting(null), 1000);
  }, [nilReport.data, earnings.data, selectedYear]);

  const exportPDF = useCallback(() => {
    if (!nilReport.data) return;
    setExporting("pdf");

    const grossEarnings = nilReport.data.totalGrossEarnings.toFixed(2);
    const netEarnings = nilReport.data.totalNetEarnings.toFixed(2);
    const platformFees = (nilReport.data.totalGrossEarnings - nilReport.data.totalNetEarnings).toFixed(2);

    let monthlyRows = "";
    if (nilReport.data.monthlyBreakdown && nilReport.data.monthlyBreakdown.length > 0) {
      monthlyRows = nilReport.data.monthlyBreakdown
        .map((month: any) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;">${month.month}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${parseFloat(month.totalGross || "0").toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${parseFloat(month.totalNet || "0").toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${month.sessions}</td>
          </tr>
        `)
        .join("");
    }

    let categoryRows = "";
    if (earnings.data?.byCategory && earnings.data.byCategory.length > 0) {
      categoryRows = earnings.data.byCategory
        .map((cat: any) => `
          <tr>
            <td style="padding:8px;border-bottom:1px solid #eee;text-transform:capitalize;">${(cat.category || "other").replace(/_/g, " ")}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${parseFloat(cat.totalNet || "0").toFixed(2)}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${cat.count}</td>
          </tr>
        `)
        .join("");
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>NIL Compliance Report - ${selectedYear}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; margin: 40px; color: #1a1a1a; line-height: 1.6; }
          .header { border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { margin: 0; color: #7c3aed; font-size: 28px; }
          .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
          .badge { display: inline-block; background: #7c3aed; color: white; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: bold; }
          .summary { display: flex; gap: 20px; margin-bottom: 30px; }
          .summary-card { flex: 1; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; text-align: center; }
          .summary-card .value { font-size: 24px; font-weight: bold; margin: 5px 0; }
          .summary-card .label { font-size: 12px; color: #6b7280; }
          .green { color: #16a34a; }
          .section { margin-bottom: 30px; }
          .section h2 { font-size: 18px; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; font-size: 14px; }
          th { text-align: left; padding: 10px 8px; background: #f3f4f6; border-bottom: 2px solid #e5e7eb; font-weight: 600; }
          .disclaimer { background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-top: 30px; font-size: 12px; color: #92400e; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
          @media print { body { margin: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>NIL Compliance Earnings Report</h1>
          <p>OlogyWood &mdash; Name, Image, Likeness Revenue Summary</p>
          <p>Report Year: <strong>${selectedYear}</strong> &nbsp;&nbsp; Generated: <strong>${new Date().toLocaleDateString()}</strong></p>
          <span class="badge">FOR ATTORNEY / COMPLIANCE REVIEW</span>
        </div>

        <div class="summary">
          <div class="summary-card">
            <div class="label">Gross Revenue</div>
            <div class="value">$${grossEarnings}</div>
          </div>
          <div class="summary-card">
            <div class="label">Net Earnings</div>
            <div class="value green">$${netEarnings}</div>
          </div>
          <div class="summary-card">
            <div class="label">Platform Fees (15%)</div>
            <div class="value">$${platformFees}</div>
          </div>
          <div class="summary-card">
            <div class="label">Total Sessions</div>
            <div class="value">${nilReport.data.totalSessions}</div>
          </div>
        </div>

        ${monthlyRows ? `
        <div class="section">
          <h2>Monthly Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th style="text-align:right;">Gross Revenue</th>
                <th style="text-align:right;">Net Earnings</th>
                <th style="text-align:right;">Sessions</th>
              </tr>
            </thead>
            <tbody>${monthlyRows}</tbody>
          </table>
        </div>
        ` : ""}

        ${categoryRows ? `
        <div class="section">
          <h2>Earnings by NIL Category</h2>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th style="text-align:right;">Net Earnings</th>
                <th style="text-align:right;">Sessions</th>
              </tr>
            </thead>
            <tbody>${categoryRows}</tbody>
          </table>
        </div>
        ` : ""}

        <div class="section">
          <h2>Platform Details</h2>
          <table>
            <tbody>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Platform</td><td style="padding:8px;border-bottom:1px solid #eee;">OlogyWood (Ology Live)</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Platform Fee Rate</td><td style="padding:8px;border-bottom:1px solid #eee;">15% of gross booking amount</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Payment Processor</td><td style="padding:8px;border-bottom:1px solid #eee;">Stripe</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:600;">Revenue Type</td><td style="padding:8px;border-bottom:1px solid #eee;">NIL Virtual Appearance / Experience</td></tr>
              <tr><td style="padding:8px;font-weight:600;">Reporting Period</td><td style="padding:8px;">January 1 - December 31, ${selectedYear}</td></tr>
            </tbody>
          </table>
        </div>

        <div class="disclaimer">
          <strong>⚠️ Legal Disclaimer:</strong> ${nilReport.data.disclaimer || "This report is generated by OlogyWood for informational purposes only. It does not constitute tax, legal, or financial advice. Athletes should consult with their attorney, compliance officer, or tax professional regarding NIL reporting obligations. OlogyWood does not guarantee the accuracy of this data for tax filing purposes. NCAA compliance requirements vary by institution — please verify with your school's compliance office."}
        </div>

        <div class="footer">
          <p>OlogyWood &copy; ${currentYear} &mdash; This document was auto-generated for NIL compliance reporting purposes.</p>
          <p>Questions? Contact support@ologywood.com</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
        setExporting(null);
      }, 500);
    } else {
      // Fallback: download as HTML
      const blob = new Blob([htmlContent], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ologywood-nil-report-${selectedYear}.html`;
      link.click();
      URL.revokeObjectURL(url);
      setExporting(null);
    }
  }, [nilReport.data, earnings.data, selectedYear, currentYear]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ology Live Earnings</h1>
          <p className="text-gray-600 mt-2">
            Track your NIL earnings, session income, and generate compliance reports
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            disabled={!nilReport.data || exporting === "csv"}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exporting === "csv" ? "Exporting..." : "Export CSV"}
          </button>
          <button
            onClick={exportPDF}
            disabled={!nilReport.data || exporting === "pdf"}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FileText className="w-4 h-4" />
            {exporting === "pdf" ? "Generating..." : "Export PDF"}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {earnings.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border rounded-lg p-5">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              Net Earnings
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(earnings.data.totals.netEarnings)}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-5">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              Gross Revenue
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(earnings.data.totals.grossAmount)}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-5">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <DollarSign className="w-4 h-4" />
              Platform Fees (15%)
            </div>
            <p className="text-2xl font-bold text-gray-500">
              {formatCurrency(earnings.data.totals.platformFees)}
            </p>
          </div>
          <div className="bg-white border rounded-lg p-5">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              Total Sessions
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {earnings.data.totals.totalSessions}
            </p>
          </div>
        </div>
      )}

      {/* Monthly Earnings Bar Chart */}
      {nilReport.data?.monthlyBreakdown && nilReport.data.monthlyBreakdown.length > 0 && (
        <div className="bg-white border rounded-lg p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Monthly Earnings Trend ({selectedYear})</h2>
          </div>
          <div style={{ height: "300px" }}>
            <EarningsChart monthlyData={nilReport.data.monthlyBreakdown} />
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {earnings.data?.byCategory && earnings.data.byCategory.length > 0 && (
        <div className="bg-white border rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Earnings by NIL Category</h2>
          <div className="space-y-3">
            {earnings.data.byCategory.map((cat: any) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {(cat.category || "other").replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-gray-400">({cat.count} sessions)</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(parseFloat(cat.totalNet || "0"))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NIL Compliance Report */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">NIL Compliance Report</h2>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="border rounded px-3 py-1 text-sm"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {nilReport.data && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-xl font-bold">{formatCurrency(nilReport.data.totalGrossEarnings)}</p>
                <p className="text-xs text-gray-500">Gross ({selectedYear})</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-xl font-bold">{formatCurrency(nilReport.data.totalNetEarnings)}</p>
                <p className="text-xs text-gray-500">Net ({selectedYear})</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded">
                <p className="text-xl font-bold">{nilReport.data.totalSessions}</p>
                <p className="text-xs text-gray-500">Sessions ({selectedYear})</p>
              </div>
            </div>

            {/* Monthly Breakdown */}
            {nilReport.data.monthlyBreakdown && nilReport.data.monthlyBreakdown.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Monthly Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 text-gray-500">Month</th>
                        <th className="text-right py-2 text-gray-500">Gross</th>
                        <th className="text-right py-2 text-gray-500">Net</th>
                        <th className="text-right py-2 text-gray-500">Sessions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nilReport.data.monthlyBreakdown.map((month: any) => (
                        <tr key={month.month} className="border-b">
                          <td className="py-2">{month.month}</td>
                          <td className="text-right">{formatCurrency(parseFloat(month.totalGross || "0"))}</td>
                          <td className="text-right">{formatCurrency(parseFloat(month.totalNet || "0"))}</td>
                          <td className="text-right">{month.sessions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                {nilReport.data.disclaimer}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Recent Transactions */}
      {earnings.data?.recentEarnings && earnings.data.recentEarnings.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
          <div className="space-y-3">
            {earnings.data.recentEarnings.map((earning: any) => (
              <div key={earning.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {(earning.nilCategory || "session").replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {earning.platform} &middot; {new Date(earning.sessionDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">+{formatCurrency(parseFloat(earning.netAmount))}</p>
                  <p className="text-xs text-gray-400">{earning.payoutStatus}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
