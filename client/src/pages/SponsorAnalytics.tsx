import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Crown, BarChart3, Eye, MousePointerClick, TrendingUp, Loader2, ArrowLeft } from 'lucide-react';
import { useLocation } from 'wouter';
import SiteHeader from '@/components/SiteHeader';

export default function SponsorAnalytics() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [days, setDays] = useState(30);

  const { data: analytics, isLoading } = (trpc.sponsor as any).getAnalytics.useQuery(
    { days },
    { retry: false, enabled: !!user }
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SiteHeader />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">Please log in to view sponsor analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-amber-700" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Sponsor Analytics</h1>
              <p className="text-sm text-gray-600">Track impressions and clicks for your sponsors</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[7, 30, 90].map((d) => (
              <Button
                key={d}
                variant={days === d ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDays(d)}
                className={days === d ? 'bg-amber-600 hover:bg-amber-700' : ''}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : !analytics ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Crown className="h-12 w-12 text-amber-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">Enterprise Feature</h3>
              <p className="text-sm text-gray-600 mb-4">Upgrade to Enterprise to access Sponsor Analytics.</p>
              <Button onClick={() => navigate('/pricing')} className="bg-amber-600 hover:bg-amber-700">
                View Pricing
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Eye className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalImpressions.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Total Impressions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <MousePointerClick className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalClicks.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Total Clicks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{analytics.overallCtr}%</p>
                      <p className="text-xs text-gray-500">Click-Through Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Per-Sponsor Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sponsor Performance</CardTitle>
                <CardDescription>Last {days} days breakdown by sponsor</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.sponsors.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No sponsor data yet. Add sponsors to start tracking.</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.sponsors.map((sponsor: any) => (
                      <div key={sponsor.sponsorId} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                          <img src={sponsor.sponsorLogoUrl} alt={sponsor.sponsorName} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{sponsor.sponsorName}</p>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">{sponsor.impressions.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Views</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-gray-900">{sponsor.clicks.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Clicks</p>
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-amber-600">{sponsor.ctr}%</p>
                            <p className="text-xs text-gray-500">CTR</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
