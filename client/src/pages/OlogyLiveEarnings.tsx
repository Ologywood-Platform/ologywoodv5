import { useState } from "react";
import { trpc } from "../lib/trpc";
import { DollarSign, TrendingUp, Calendar, Download, AlertTriangle } from "lucide-react";

export default function OlogyLiveEarnings() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const earnings = trpc.ologyLivePhase2.getEarningsSummary.useQuery();
  const nilReport = trpc.ologyLivePhase2.getNilReport.useQuery({ year: selectedYear });

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ology Live Earnings</h1>
        <p className="text-gray-600 mt-2">
          Track your NIL earnings, session income, and generate compliance reports
        </p>
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
