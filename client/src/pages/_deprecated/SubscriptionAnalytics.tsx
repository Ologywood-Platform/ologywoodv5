import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Activity, Download, Filter } from "lucide-react";

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change: number;
  trend: "up" | "down" | "stable";
}

interface ConversionData {
  period: string;
  freeToBasic: number;
  basicToPremium: number;
  totalConversions: number;
}

interface ChurnData {
  tier: string;
  churnRate: number;
  activeUsers: number;
  churned: number;
}

export default function SubscriptionAnalytics() {
  const [dateRange, setDateRange] = useState("30d");
  const [selectedTier, setSelectedTier] = useState<"all" | "free" | "basic" | "premium">("all");

  // Mock data - would be replaced with real API calls
  const metrics: Record<string, AnalyticsMetric> = {
    totalRevenue: {
      label: "Total Revenue",
      value: "$45,230",
      change: 12.5,
      trend: "up",
    },
    activeSubscriptions: {
      label: "Active Subscriptions",
      value: "1,248",
      change: 8.3,
      trend: "up",
    },
    conversionRate: {
      label: "Conversion Rate",
      value: "18.5%",
      change: 2.1,
      trend: "up",
    },
    churnRate: {
      label: "Churn Rate",
      value: "3.2%",
      change: -0.8,
      trend: "down",
    },
    mrr: {
      label: "Monthly Recurring Revenue",
      value: "$38,450",
      change: 15.2,
      trend: "up",
    },
    arpu: {
      label: "Avg Revenue Per User",
      value: "$30.82",
      change: 4.5,
      trend: "up",
    },
  };

  const conversionData: ConversionData[] = [
    { period: "Week 1", freeToBasic: 12, basicToPremium: 3, totalConversions: 15 },
    { period: "Week 2", freeToBasic: 18, basicToPremium: 5, totalConversions: 23 },
    { period: "Week 3", freeToBasic: 15, basicToPremium: 4, totalConversions: 19 },
    { period: "Week 4", freeToBasic: 22, basicToPremium: 7, totalConversions: 29 },
  ];

  const churnData: ChurnData[] = [
    { tier: "Free", churnRate: 8.5, activeUsers: 3450, churned: 293 },
    { tier: "Basic", churnRate: 2.8, activeUsers: 890, churned: 25 },
    { tier: "Premium", churnRate: 1.2, activeUsers: 245, churned: 3 },
  ];

  const tierDistribution = [
    { tier: "Free", count: 3450, percentage: 68.5 },
    { tier: "Basic", count: 890, percentage: 17.7 },
    { tier: "Premium", count: 245, percentage: 4.9 },
    { tier: "Trial", count: 415, percentage: 8.2 },
  ];

  const MetricCard = ({ metric }: { metric: AnalyticsMetric }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-2">
          <p className="text-sm text-slate-600">{metric.label}</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                metric.trend === "up"
                  ? "bg-green-100 text-green-800"
                  : metric.trend === "down"
                  ? "bg-red-100 text-red-800"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              {metric.change > 0 ? "+" : ""}{metric.change}%
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Subscription Analytics</h1>
          <p className="text-slate-600">Track conversions, churn, and revenue metrics</p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">Filters:</span>
              </div>

              <div className="flex gap-2">
                {["7d", "30d", "90d", "1y"].map((range) => (
                  <Button
                    key={range}
                    variant={dateRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDateRange(range)}
                  >
                    {range === "7d"
                      ? "7 Days"
                      : range === "30d"
                      ? "30 Days"
                      : range === "90d"
                      ? "90 Days"
                      : "1 Year"}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                {["all", "free", "basic", "premium"].map((tier) => (
                  <Button
                    key={tier}
                    variant={selectedTier === tier ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTier(tier as any)}
                    className="capitalize"
                  >
                    {tier}
                  </Button>
                ))}
              </div>

              <Button variant="outline" size="sm" className="ml-auto">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {Object.entries(metrics).map(([key, metric]) => (
            <MetricCard key={key} metric={metric} />
          ))}
        </div>

        {/* Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>Weekly conversion trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversionData.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-900">{data.period}</span>
                      <span className="text-slate-600">{data.totalConversions} conversions</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <div className="bg-slate-200 rounded h-2 mb-1">
                          <div
                            className="bg-blue-600 rounded h-2 transition-all"
                            style={{ width: `${(data.freeToBasic / 25) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-600">Free→Basic: {data.freeToBasic}</p>
                      </div>
                      <div className="flex-1">
                        <div className="bg-slate-200 rounded h-2 mb-1">
                          <div
                            className="bg-purple-600 rounded h-2 transition-all"
                            style={{ width: `${(data.basicToPremium / 25) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-600">Basic→Premium: {data.basicToPremium}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Distribution</CardTitle>
              <CardDescription>Users by subscription tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tierDistribution.map((tier, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-slate-900">{tier.tier}</span>
                      <Badge variant="secondary">{tier.percentage}%</Badge>
                    </div>
                    <div className="bg-slate-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          tier.tier === "Free"
                            ? "bg-slate-500"
                            : tier.tier === "Basic"
                            ? "bg-blue-600"
                            : tier.tier === "Premium"
                            ? "bg-purple-600"
                            : "bg-green-600"
                        }`}
                        style={{ width: `${tier.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-slate-600">{tier.count.toLocaleString()} users</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Churn Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Churn Analysis</CardTitle>
            <CardDescription>User retention by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Tier
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Active Users
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Churned
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Churn Rate
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">
                      Retention
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {churnData.map((data, index) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{data.tier}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {data.activeUsers.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{data.churned}</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`font-medium ${
                            data.churnRate < 3
                              ? "text-green-700"
                              : data.churnRate < 5
                              ? "text-yellow-700"
                              : "text-red-700"
                          }`}
                        >
                          {data.churnRate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-green-600 h-2 rounded-full transition-all"
                              style={{ width: `${100 - data.churnRate}%` }}
                            />
                          </div>
                          <span className="font-medium text-slate-900">
                            {(100 - data.churnRate).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Key Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                • <strong>Conversion trending up:</strong> Free to Basic conversions increased 83% compared to last month
              </li>
              <li>
                • <strong>Premium adoption growing:</strong> Basic to Premium conversions up 40% with improved onboarding
              </li>
              <li>
                • <strong>Churn optimization:</strong> Premium tier churn rate at 1.2%, lowest across all tiers
              </li>
              <li>
                • <strong>MRR growth:</strong> Monthly recurring revenue increased 15.2% month-over-month
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
