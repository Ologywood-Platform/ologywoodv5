import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Ticket, QrCode, ArrowLeft, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import SiteHeader from '@/components/SiteHeader';
import { formatDateOnly } from '@shared/dateOnly';

export default function MyTickets() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const { data: tickets, isLoading } = trpc.ticketing.getMyTickets.useQuery({ status: tab });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SiteHeader />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">My Tickets</h1>
            <p className="text-sm text-muted-foreground">View and manage your event tickets</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'upcoming' | 'past')}>
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !tickets || tickets.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="font-semibold text-lg mb-1">
                    {tab === 'upcoming' ? 'No upcoming tickets' : 'No past tickets'}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {tab === 'upcoming'
                      ? 'Browse events and get tickets to your next show!'
                      : 'Your past event tickets will appear here.'}
                  </p>
                  {tab === 'upcoming' && (
                    <Button onClick={() => navigate('/events')}>Browse Events</Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickets.map((order: any) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        {/* Event Image */}
                        {order.event?.coverImageUrl && (
                          <div className="w-32 h-32 flex-shrink-0">
                            <img
                              src={order.event.coverImageUrl}
                              alt={order.event.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        {/* Details */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold">{order.event?.title || 'Unknown Event'}</h3>
                              <div className="flex flex-col gap-0.5 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5" />
                                  {formatDateOnly(order.event?.date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                  {order.event?.time && ` at ${order.event.time}`}
                                </span>
                                {order.event?.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {order.event.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {order.ticketCount} ticket{order.ticketCount > 1 ? 's' : ''}
                            </Badge>
                          </div>
                          {/* Ticket codes */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {order.items.slice(0, 3).map((item: any) => (
                              <span
                                key={item.id}
                                className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded"
                              >
                                <QrCode className="h-3 w-3" />
                                {item.tierName}
                              </span>
                            ))}
                            {order.items.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{order.items.length - 3} more
                              </span>
                            )}
                          </div>
                          {/* View button */}
                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/tickets/confirmation/${order.orderNumber}`)}
                            >
                              View Tickets
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
