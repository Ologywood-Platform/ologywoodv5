import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventCard } from '@/components/EventCard';
import { Search, Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';

// Mock events data - replace with API call
const mockEvents = [
  {
    id: 1,
    eventTitle: 'Summer Music Festival 2026',
    eventType: 'Festival',
    eventDate: new Date('2026-06-15'),
    eventTime: '18:00',
    location: 'Central Park, New York, NY',
    capacity: 500,
    rate: '$5000',
    artistName: 'The Amazing Band',
    artistId: 1,
    artistPhoto: 'https://via.placeholder.com/80',
    isPublic: true,
    status: 'available' as const,
  },
  {
    id: 2,
    eventTitle: 'Corporate Gala',
    eventType: 'Corporate Event',
    eventDate: new Date('2026-05-20'),
    eventTime: '19:00',
    location: 'Hilton Hotel, Boston, MA',
    capacity: 200,
    rate: '$3000',
    artistName: 'Jazz Quartet',
    artistId: 2,
    artistPhoto: 'https://via.placeholder.com/80',
    isPublic: true,
    status: 'available' as const,
  },
  {
    id: 3,
    eventTitle: 'Wedding Reception',
    eventType: 'Wedding',
    eventDate: new Date('2026-07-10'),
    eventTime: '20:00',
    location: 'The Grand Ballroom, Chicago, IL',
    capacity: 150,
    rate: '$2500',
    artistName: 'DJ Smooth Beats',
    artistId: 3,
    artistPhoto: 'https://via.placeholder.com/80',
    isPublic: true,
    status: 'available' as const,
  },
];

export default function EventDiscovery() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [events, setEvents] = useState(mockEvents);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    eventType: '',
    location: '',
    minRate: '',
    maxRate: '',
    startDate: '',
    endDate: '',
  });
  const [savedEventIds, setSavedEventIds] = useState<number[]>([]);

  useEffect(() => {
    // TODO: Fetch events from API
    // const fetchEvents = async () => {
    //   setIsLoading(true);
    //   try {
    //     const query = new URLSearchParams();
    //     if (filters.eventType) query.append('eventType', filters.eventType);
    //     if (filters.location) query.append('location', filters.location);
    //     if (filters.minRate) query.append('minRate', filters.minRate);
    //     if (filters.maxRate) query.append('maxRate', filters.maxRate);
    //     if (filters.startDate) query.append('startDate', filters.startDate);
    //     if (filters.endDate) query.append('endDate', filters.endDate);
    //
    //     const response = await fetch(`/api/events/search?${query}`);
    //     if (response.ok) {
    //       const data = await response.json();
    //       setEvents(data);
    //     }
    //   } catch (error) {
    //     toast.error('Failed to load events');
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchEvents();
  }, [filters]);

  const filteredEvents = events.filter(event => {
    const matchesSearch =
      searchQuery === '' ||
      event.eventTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.location.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const handleSaveEvent = async (eventId: number) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to save events');
      return;
    }

    try {
      // TODO: Call API to save/unsave event
      // const method = savedEventIds.includes(eventId) ? 'DELETE' : 'POST';
      // const response = await fetch(`/api/events/${eventId}/save`, { method });
      setSavedEventIds(prev =>
        prev.includes(eventId)
          ? prev.filter(id => id !== eventId)
          : [...prev, eventId]
      );
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
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Discover Events</h1>
          <div className="w-10" />
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
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
                    <SelectItem value="club">Club Performance</SelectItem>
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
              {filteredEvents.map(event => (
                <EventCard
                  key={event.id}
                  {...event}
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
                Sorry, there are no events matching your criteria at this time. Try adjusting your filters or check back later.
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
