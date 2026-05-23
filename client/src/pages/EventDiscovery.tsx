import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EventCard } from '@/components/EventCard';
import { Search, Loader2, Calendar, ArrowLeft, X, RotateCcw } from 'lucide-react';
import { ClearableInput } from '@/components/ui/clearable-input';
import { toast } from 'sonner';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';

export default function EventDiscovery() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [dateError, setDateError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({
    eventType: '',
    location: '',
    minRate: '',
    maxRate: '',
    startDate: '',
    endDate: '',
  });

  // Applied filters — only sent to API when user clicks "Apply Filters"
  const [appliedFilters, setAppliedFilters] = useState<Record<string, any>>({});
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.events);
  }, []);

  // Validate dates whenever they change
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      if (new Date(filters.startDate) > new Date(filters.endDate)) {
        setDateError('Start Date cannot be later than End Date.');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }
  }, [filters.startDate, filters.endDate]);

  // Check if any filter criteria is entered
  const hasAnyCriteria = !!(
    filters.eventType || filters.location || filters.minRate ||
    filters.maxRate || filters.startDate || filters.endDate || searchQuery
  );

  // Handle Apply Filters
  const handleApplyFilters = () => {
    if (dateError) {
      toast.error('Please fix the date range before searching.');
      return;
    }
    const input: Record<string, any> = {};
    if (filters.eventType) input.eventType = filters.eventType;
    if (filters.location) input.location = filters.location;
    if (filters.minRate) input.minRate = parseFloat(filters.minRate);
    if (filters.maxRate) input.maxRate = parseFloat(filters.maxRate);
    if (filters.startDate) input.startDate = new Date(filters.startDate);
    if (filters.endDate) input.endDate = new Date(filters.endDate);
    setAppliedFilters(input);
    setAppliedSearchQuery(searchQuery);
    setHasSearched(true);
    // Scroll to results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch events from real API — only when applied filters change
  const { data: apiEvents = [], isLoading } = trpc.events.search.useQuery(
    appliedFilters,
    { enabled: hasSearched }
  );

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
    if (!appliedSearchQuery) return apiEvents;
    const q = appliedSearchQuery.toLowerCase();
    return apiEvents.filter((event: any) =>
      (event.eventTitle?.toLowerCase().includes(q)) ||
      (event.artistName?.toLowerCase().includes(q)) ||
      (event.location?.toLowerCase().includes(q))
    );
  }, [apiEvents, appliedSearchQuery]);

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
    setDateError('');
    setHasSearched(false);
    setAppliedFilters({});
    setAppliedSearchQuery('');
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
            <CardDescription>Enter your criteria and click "Apply Filters" to find events</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Search Bar */}
            <ClearableInput
              placeholder="Search by event name, artist, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              leftIcon={<Search className="h-4 w-4" />}
            />

            {/* Filters Grid - Reorganized with dates grouped together */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Event Type */}
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

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <ClearableInput
                  placeholder="City or venue"
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  onClear={() => setFilters(prev => ({ ...prev, location: '' }))}
                />
              </div>

              {/* Rate Range */}
              <div className="space-y-2">
                <Label>Rate Range</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min ($)"
                    value={filters.minRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, minRate: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Max ($)"
                    value={filters.maxRate}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxRate: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Date Range - Grouped together */}
            <div className="space-y-2">
              <Label>Event Date Range</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="startDate" className="text-xs text-muted-foreground">From</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                  {filters.startDate && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, startDate: '' }))}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <X size={12} /> Clear date
                    </button>
                  )}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="endDate" className="text-xs text-muted-foreground">To</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    min={filters.startDate || undefined}
                  />
                  {filters.endDate && (
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, endDate: '' }))}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <X size={12} /> Clear date
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Date Validation Error */}
            {dateError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <span className="text-red-600 text-sm font-medium">{dateError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleApplyFilters}
                className="flex-1"
                disabled={!!dateError}
              >
                <Search className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              {hasAnyCriteria && (
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {!hasSearched ? (
          /* Empty state - no search applied yet */
          <Card>
            <CardContent className="py-16 text-center">
              <Search className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Search for Events</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Use the filters above to find events that match your interests, then click "Apply Filters" to see results.
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
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
                No events match your criteria. Try adjusting your filters or search terms.
              </p>
              <Button
                variant="outline"
                onClick={handleResetFilters}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
