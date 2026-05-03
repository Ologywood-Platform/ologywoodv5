import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Users, TrendingUp, BarChart3, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface TicketAnalyticsProps {
  eventId: number;
}

export function TicketAnalytics({ eventId }: TicketAnalyticsProps) {
  const { data, isLoading, error } = trpc.ticketing.getSalesSummary.useQuery(
    { eventId },
    { enabled: eventId > 0 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const { summary, tiers, recentOrders } = data;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <DollarSign className="h-3.5 w-3.5" />
              Revenue
            </div>
            <p className="text-2xl font-bold">${(summary.totalRevenue / 100).toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">After platform fees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="h-3.5 w-3.5" />
              Tickets Sold
            </div>
            <p className="text-2xl font-bold">{summary.totalTicketsSold}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">of {summary.totalCapacity} available</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-3.5 w-3.5" />
              Sell-Through
            </div>
            <p className="text-2xl font-bold">{summary.percentSold}%</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {summary.percentSold >= 80 ? 'Almost sold out!' : summary.percentSold >= 50 ? 'Selling well' : 'Room to grow'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Orders
            </div>
            <p className="text-2xl font-bold">{summary.orderCount}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {summary.orderCount > 0 ? `~${(summary.totalTicketsSold / summary.orderCount).toFixed(1)} tickets/order` : 'No orders yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sell-Through Progress Bar */}
      {summary.totalCapacity > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Overall Sell-Through</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  summary.percentSold >= 90 ? 'bg-green-500' :
                  summary.percentSold >= 70 ? 'bg-blue-500' :
                  summary.percentSold >= 40 ? 'bg-purple-500' :
                  'bg-slate-400'
                }`}
                style={{ width: `${Math.min(summary.percentSold, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{summary.totalTicketsSold} sold</span>
              <span>{summary.totalCapacity - summary.totalTicketsSold} remaining</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-Tier Breakdown */}
      {tiers.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">By Ticket Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tiers.map((tier) => {
                const tierPercent = tier.quantity > 0 ? Math.round((tier.sold / tier.quantity) * 100) : 0;
                return (
                  <div key={tier.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{tier.name}</span>
                        <span className="text-xs text-muted-foreground">${(tier.price / 100).toFixed(2)}</span>
                        {!tier.isActive && <Badge variant="secondary" className="text-[10px]">Inactive</Badge>}
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{tier.sold}/{tier.quantity}</span>
                        <span className="text-xs text-muted-foreground ml-1">({tierPercent}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          tierPercent >= 90 ? 'bg-green-500' :
                          tierPercent >= 60 ? 'bg-blue-500' :
                          'bg-purple-500'
                        }`}
                        style={{ width: `${Math.min(tierPercent, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                      <span>Revenue: ${(tier.revenue / 100).toFixed(2)}</span>
                      <span>{tier.quantity - tier.sold} remaining</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{order.buyerName || order.buyerEmail}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {order.orderNumber} &middot; {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <span className="text-sm font-medium">${(order.totalAmount / 100).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Fee Info */}
      {summary.totalFees > 0 && (
        <p className="text-xs text-center text-muted-foreground">
          Platform fees collected: ${(summary.totalFees / 100).toFixed(2)} ($0.99 per ticket)
        </p>
      )}
    </div>
  );
}
