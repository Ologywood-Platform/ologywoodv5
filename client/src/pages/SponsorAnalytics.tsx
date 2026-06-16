import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Crown, BarChart3, Eye, MousePointerClick, TrendingUp, Loader2, ArrowLeft, Info, Lightbulb, Rocket } from 'lucide-react';
import { useLocation } from 'wouter';
import SiteHeader from '@/components/SiteHeader';

function Tip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-1">
      <Info className="h-3.5 w-3.5 text-gray-400 hover:text-amber-600 cursor-help inline" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50 w-60 p-2 text-xs text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg">
        {text}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-white border-b border-r border-gray-200 rotate-45" />
      </div>
    </div>
  );
}

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

  const hasNoData = analytics && analytics.totalImpressions === 0 && analytics.totalClicks === 0;

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
        ) : hasNoData ? (
          /* Getting Started Card - No Data Yet */
          <Card className="border-amber-200">
            <CardContent className="py-8">
              <div className="text-center mb-6">
                <Rocket className="h-12 w-12 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  Analytics will start appearing once fans view your profile or event pages with active sponsors.
                </p>
              </div>
              <div className="max-w-lg mx-auto space-y-3">
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                  <h4 className="text-sm font-medium text-gray-800 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    How to get your first impressions:
                  </h4>
                  <ol className="text-xs text-gray-600 space-y-1.5 ml-6 list-decimal">
                    <li>Add at least one sponsor in your Dashboard (Sponsor Showcase section)</li>
                    <li>Make sure the sponsor is toggled to <span className="font-medium">Active</span> (green eye icon)</li>
                    <li>Share your artist profile or create an event — sponsors appear automatically</li>
                    <li>Each time a fan sees your profile or event page, an impression is recorded</li>
                    <li>When a fan clicks a sponsor logo, a click is recorded</li>
                  </ol>
                </div>
                <div className="bg-white rounded-lg p-3 border border-gray-200 flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">Tip:</span> Analytics are tracked in real-time. Come back after sharing your profile link on social media to see results.
                  </p>
                </div>
              </div>
              <div className="text-center mt-6">
                <Button variant="outline" onClick={() => navigate('/dashboard')} className="text-amber-700 border-amber-300">
                  Go to Dashboard to Add Sponsors
                </Button>
              </div>
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
                      <p className="text-xs text-gray-500">
                        Total Impressions
                        <Tip text="An impression is counted each time a fan views a page where your sponsor logos are displayed (your profile or event pages)." />
                      </p>
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
                      <p className="text-xs text-gray-500">
                        Total Clicks
                        <Tip text="A click is counted when a fan clicks on a sponsor logo to visit their website. More clicks = more value for your sponsors." />
                      </p>
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
                      <p className="text-xs text-gray-500">
                        Click-Through Rate
                        <Tip text="CTR = (Clicks / Impressions) x 100. Industry average is 1-3%. Higher CTR means your audience is engaged with your sponsors." />
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tips Banner */}
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                <span className="font-medium">Pro tip:</span> Share these analytics with your sponsors to demonstrate value and negotiate better deals. A CTR above 2% is considered excellent for display sponsorships.
              </p>
            </div>

            {/* Per-Sponsor Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Sponsor Performance
                  <Tip text="Breakdown of how each individual sponsor is performing. Use this to identify which sponsors resonate most with your audience." />
                </CardTitle>
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
