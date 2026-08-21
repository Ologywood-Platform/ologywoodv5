import { toSlug } from '@/lib/slugify';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Users, Star, Phone, Globe, Share2, Facebook, Twitter, Linkedin, Copy, Check, MessageSquare, Calendar, X, Music, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';
import { QuickSignupModal } from '@/components/QuickSignupModal';
import { LazyImage } from '@/components/LazyImage';
import { trpc } from '@/lib/trpc';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import SiteHeader from '@/components/SiteHeader';
import { QuickBookingModal } from '@/components/QuickBookingModal';
import { US_STATES } from '../../../shared/locationData';

export default function VenueBrowse() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedCapacity, setSelectedCapacity] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [bookingVenue, setBookingVenue] = useState<any>(null);

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.venues);
  }, []);

  const [hasSearched, setHasSearched] = useState(false);

  // Fetch venues from database using the venue.search endpoint
  const { data: venues = [], isLoading, refetch } = trpc.venue.search.useQuery({
    searchQuery: searchQuery || undefined,
    location: selectedLocation || undefined,
    limit: 50,
    offset: 0,
  }, { enabled: hasSearched });

  // Pull-to-refresh
  const { PullIndicator } = usePullToRefresh({
    onRefresh: async () => {
      await refetch();
    },
  });

  // Get venue types for filter
  const { data: venueTypes = [] } = trpc.venue.getVenueTypes.useQuery();

  // Filter venues by capacity and genre (client-side since search endpoint handles query/location)
  const filteredVenues = useMemo(() => {
    let result = venues as any[];

    if (selectedCapacity) {
      const minCapacity = parseInt(selectedCapacity);
      if (!isNaN(minCapacity)) {
        result = result.filter((v: any) => v.capacity && v.capacity >= minCapacity);
      }
    }

    if (selectedGenre) {
      result = result.filter((v: any) => {
        const genres = v.genres || v.venueType || '';
        return genres.toLowerCase().includes(selectedGenre.toLowerCase());
      });
    }

    return result;
  }, [venues, selectedCapacity, selectedGenre]);

  const hasActiveFilters = searchQuery || selectedLocation || selectedCapacity || selectedGenre;

  const clearFiltersOnly = () => {
    setSelectedCapacity('');
    setSelectedGenre('');
  };

  const clearAll = () => {
    setSearchQuery('');
    setSelectedLocation('');
    setSelectedCapacity('');
    setSelectedGenre('');
  };

  const handleMessageClick = (venueId: number) => {
    if (!isAuthenticated) {
      setShowSignupModal(true);
    } else {
      navigate(`/messages?venueId=${venueId}`);
    }
  };

  const handleViewProfile = (venueId: number, venueName: string) => {
    navigate(`/venue/${toSlug(venueName || '')}`);
  };

  const handleBookVenue = (venue: any) => {
    if (!isAuthenticated) {
      setShowSignupModal(true);
    } else {
      setBookingVenue(venue);
    }
  };

  const copyToClipboard = (text: string, venueId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(venueId);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareOnSocial = (platform: string, venue: any) => {
    const venueUrl = `${window.location.origin}/venue/${venue.id}`;
    const text = `Check out ${venue.venueName || venue.organizationName} on Ologywood`;

    const urls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(venueUrl)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(venueUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(venueUrl)}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <SiteHeader />
      <PullIndicator />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Discover Venues</h1>
          <p className="text-lg text-purple-100">Find the perfect venue for your next performance</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {isAuthenticated && (
          <PageBreadcrumb
            className="mb-4"
            segments={[
              { label: 'Dashboard', href: user?.role === 'venue' ? '/venue-dashboard' : '/dashboard' },
              { label: 'Browse Venues' },
            ]}
          />
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search venues by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-1 bg-purple-100 text-purple-700 text-xs">Active</Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    State
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-800"
                  >
                    <option value="">All states</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Capacity Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Minimum Capacity
                  </label>
                  <select
                    value={selectedCapacity}
                    onChange={(e) => setSelectedCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">Any capacity</option>
                    <option value="50">50+ people</option>
                    <option value="100">100+ people</option>
                    <option value="200">200+ people</option>
                    <option value="500">500+ people</option>
                    <option value="1000">1000+ people</option>
                  </select>
                </div>

                {/* Genre/Type Filter */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Music className="w-4 h-4 inline mr-1" />
                    Venue Type
                  </label>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="">All types</option>
                    {venueTypes.map((type: string) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex justify-end gap-2">
                  {(selectedCapacity || selectedGenre) && (
                    <Button variant="ghost" size="sm" onClick={clearFiltersOnly}>
                      <X className="w-4 h-4 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset All
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Apply Filters Button */}
        {hasActiveFilters && (
          <div className="mb-4 flex gap-2">
            <Button onClick={() => { setHasSearched(true); refetch(); }} className="gap-1.5">
              <Search className="h-4 w-4" />
              Apply Filters
            </Button>
          </div>
        )}

        {/* Initial State - No search applied yet */}
        {!hasSearched && (
          <div className="text-center py-16">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Search for Venues</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Enter a venue name, location, or use filters above, then click "Apply Filters" to see results.
            </p>
          </div>
        )}

        {/* Results Count */}
        {hasSearched && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {isLoading ? 'Loading venues...' : `${filteredVenues.length} Venue${filteredVenues.length !== 1 ? 's' : ''} Found`}
            </h2>
          </div>
        )}

        {/* Venues Grid */}
        {hasSearched && isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : hasSearched && filteredVenues.length === 0 ? (
          <Card className="text-center py-16">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Venues Found</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              No venues match your current filters. Try adjusting your search criteria.
            </p>
            <Button onClick={clearAll}>
              Reset All
            </Button>
          </Card>
        ) : hasSearched && filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue: any) => (
              <Card key={venue.id} className="hover:shadow-lg transition-shadow overflow-hidden group">
                {/* Venue Image */}
                {venue.profilePhotoUrl && (
                  <div className="h-40 overflow-hidden">
                    <LazyImage
                      src={venue.profilePhotoUrl}
                      alt={venue.venueName || venue.organizationName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle
                        className="cursor-pointer hover:text-purple-600 transition-colors text-lg"
                        onClick={() => handleViewProfile(venue.id, venue.organizationName || '')}
                      >
                        {venue.venueName || venue.organizationName}
                      </CardTitle>
                      {venue.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {venue.location}
                        </div>
                      )}
                    </div>
                    {venue.venueType && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {venue.venueType}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                  {/* Description */}
                  {(venue.description || venue.bio) && (
                    <p className="text-sm text-gray-600 line-clamp-2">{venue.description || venue.bio}</p>
                  )}

                  {/* Capacity and Amenities */}
                  <div className="space-y-2 text-sm">
                    {venue.capacity && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        Capacity: {venue.capacity} people
                      </div>
                    )}
                    {venue.amenities && venue.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {venue.amenities.slice(0, 4).map((amenity: string) => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {venue.amenities.length > 4 && (
                          <Badge variant="outline" className="text-xs text-gray-500">
                            +{venue.amenities.length - 4} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      onClick={() => handleViewProfile(venue.id, venue.organizationName || '')}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      View Profile
                    </Button>
                    {user?.role === 'artist' && (
                      <Button
                        onClick={() => handleBookVenue(venue)}
                        size="sm"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        title="Send a booking request to this venue"
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Request to Book
                      </Button>
                    )}
                    {!isAuthenticated && (
                      <Button
                        onClick={() => handleBookVenue(venue)}
                        size="sm"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        title="Sign up to send a booking request"
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Request to Book
                      </Button>
                    )}
                  </div>

                  {/* Share Row */}
                  <div className="flex gap-1 justify-center pt-2 border-t">
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/venue/${venue.id}`, venue.id)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Copy link"
                    >
                      {copiedId === venue.id ? (
                        <Check className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                      )}
                    </button>
                    <button
                      onClick={() => shareOnSocial('facebook', venue)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Share on Facebook"
                    >
                      <Facebook className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                    <button
                      onClick={() => shareOnSocial('twitter', venue)}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                      title="Share on Twitter"
                    >
                      <Twitter className="w-3.5 h-3.5 text-blue-400" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </div>

      {/* Signup Modal */}
      {showSignupModal && (
        <QuickSignupModal
          isOpen={showSignupModal}
          onClose={() => setShowSignupModal(false)}
          actionType="message"
          targetType="venue"
        />
      )}

      {/* Quick Booking Modal */}
      {bookingVenue && (
        <QuickBookingModal
          venue={bookingVenue}
          onClose={() => setBookingVenue(null)}
        />
      )}
    </div>
  );
}
