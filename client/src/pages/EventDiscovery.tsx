import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventCard } from '@/components/EventCard';
import { Search, Loader2, Calendar, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';

export default function EventDiscovery() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    eventType: '',
    location: '',
    minRate: '',
    maxRate: '',
    startDate: '',
    endDate: '',
  });

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.events);
  }, []);

  // Build the tRPC query input from filters
  const searchInput = useMemo(() => {
    const input: Record<string, any> = {};
    if (filters.eventType) input.eventType = filters.eventType;
    if (filters.location) input.location = filters.location;
    if (filters.minRate) input.minRate = parseFloat(filters.minRate);
    if (filters.maxRate) input.maxRate = parseFloat(filters.maxRate);
    if (filters.startDate) input.startDate = new Date(filters.startDate);
    if (filters.endDate) input.endDate = new Date(filters.endDate);
    return input;
  }, [filters]);

  // Fetch events from real API
  const { data: apiEvents = [], isLoading } = trpc.events.search.useQuery(searchInput);

  // Fetch saved event IDs for the current user
  const { data: savedEventsData = [] } = trpc.events.getSavedEvents.useQuery(
    {},
    { enabled: isAuthenticated }
  );
  const savedEventIds = useMemo(
    () => savedEventsData.map((se: any) => se.eventId),
    [savedEventsData]
  );

  const saveEventMutation = trpc.events.saveEvent.useMutation();
  const unsaveEventMutation = trpc.events.unsaveEvent.useMutation();
  const utils = trpc.useUtils();

  // Client-side text search filter on top of API results
  const filteredEvents = useMemo(() => {
    if (!searchQuery) return apiEvents;
    const q = searchQuery.toLowerCase();
    return apiEvents.filter((event: any) =>
      (event.eventTitle?.toLowerCase().includes(q)) ||
      (event.artistName?.toLowerCase().includes(q)) ||
      (event.location?.toLowerCase().includes(q))
    );
  }, [apiEvents, searchQuery]);

  const handleSaveEvent = async (eventId: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save events');
      return;
    }
    try {
      if (savedEventIds.includes(eventId)) {
        await unsaveEventMutation.mutateAsync({ eventId });
        toast.success('Event removed from saved');
      } else {
        await saveEventMutation.mutateAsync({ eventId });
        toast.success('Event saved!');
      }
      utils.events.getSavedEvents.invalidate();
    } catch (error) {
      toast.error('Failed to save event');
    }
  };

  const handleMessageArtist = (artistId: number, artistName: string) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to message artists');
      return;
    }
    navigate(`/messages?artistId=${artistId}`);
  };

  const handleResetFilters = () => {
    setFilters({
      eventType: '',
      location: '',
      minRate: '',
      maxRate: '',
      startDate: '',
      endDate: '',
    });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SiteHeader />

      <div className="container mx-auto px-4 py-8">
        {/* Back to Dashboard */}
        {isAuthenticated && (
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
        )}
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Events</CardTitle>
            <CardDescription>Find events that match your interests</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by event name, artist, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type</Label>
                <Select value={filters.eventType} onValueChange={(value) => setFilters(prev => ({ ...prev, eventType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concert">Concert</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="corporate">Corporate Event</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="bar_gig">Bar Gig</SelectItem>
                    <SelectItem value="private_party">Private Party</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  placeholder="City or venue"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minRate">Min Rate</Label>
                <Input
                  type="number"
                  placeholder="e.g., 500"
                  value={filters.minRate}
                  onChange={(e) => setFilters(prev => ({ ...prev, minRate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxRate">Max Rate</Label>
                <Input
                  type="number"
                  placeholder="e.g., 5000"
                  value={filters.maxRate}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="w-full"
            >
              Reset Filters
            </Button>
          </CardContent>
        </Card>

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : filteredEvents.length > 0 ? (
          <div>
            <p className="text-sm text-slate-600 mb-4">
              Found {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event: any) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  eventTitle={event.eventTitle}
                  eventType={event.eventType}
                  eventDate={event.eventDate}
                  eventTime={event.eventTime}
                  location={event.location || 'TBD'}
                  capacity={event.capacity}
                  rate={event.rate ? `$${event.rate}` : undefined}
                  artistName={event.artistName || 'Unknown Artist'}
                  artistId={event.artistId}
                  artistPhoto={event.artistPhoto}
                  isPublic={event.isPublic}
                  status={event.status as 'available' | 'booked' | 'cancelled'}
                  isSaved={savedEventIds.includes(event.id)}
                  onSave={handleSaveEvent}
                  onMessage={handleMessageArtist}
                  showActions={true}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Events Found</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">
                There are no public events posted yet. When artists create public events, they'll appear here for you to discover and book.
              </p>
              <Button
                variant="outline"
                onClick={handleResetFilters}
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
