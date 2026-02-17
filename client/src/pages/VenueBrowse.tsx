import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Users, Star, Phone, Globe, Share2, Facebook, Twitter, Linkedin, Copy, Check, MessageSquare, Calendar } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';
import { QuickSignupModal } from '@/components/QuickSignupModal';
import { LazyImage } from '@/components/LazyImage';
import { trpc } from '@/lib/trpc';

interface Venue {
  id: number;
  organizationName: string;
  location: string;
  bio?: string;
  contactPhone?: string;
}

export default function VenueBrowse() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showSignupModal, setShowSignupModal] = useState(false);

  // Fetch venues from database
  // NOTE: venue router was removed during cleanup - using empty data for now
  const { data: venues = [], isLoading } = { data: [], isLoading: false };

  // Get venue types for filter dropdown
  const { data: venueTypes = [] } = { data: [] };

  // Filter venues by search query
  const filteredVenues = useMemo(() => {
    if (!searchQuery) return venues;
    
    return venues.filter((venue: any) =>
      venue.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (venue.bio && venue.bio.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [venues, searchQuery]);

  const handleMessageClick = (venueId: number) => {
    // NOTE: venue router was removed during cleanup
    if (!isAuthenticated) {
      setShowSignupModal(true);
    } else {
      navigate(`/messages?venueId=${venueId}`);
    }
  };

  const handleViewProfile = (venueId: number) => {
    navigate(`/venue/${venueId}`);
  };

  const copyToClipboard = (text: string, venueId: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(venueId);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const shareOnSocial = (platform: string, venue: Venue) => {
    const venueUrl = `${window.location.origin}/venue/${venue.id}`;
    const text = `Check out ${venue.organizationName} on Ologywood - ${venue.bio || ''}`;
    
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
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Discover Venues</h1>
          <p className="text-lg text-purple-100">Find the perfect venue for your next performance</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Search & Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Search Venues</label>
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  placeholder="City, State"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold">
            {isLoading ? 'Loading venues...' : `${filteredVenues.length} Venues Found`}
          </h2>
        </div>

        {/* Venues Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg h-96 animate-pulse" />
            ))}
          </div>
        ) : filteredVenues.length === 0 ? (
          <Card className="text-center py-12">
            <p className="text-gray-500 text-lg">No venues found matching your criteria.</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedLocation('');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue: any) => (
              <Card key={venue.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {/* Venue Image */}


                <CardHeader>
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <CardTitle
                        className="cursor-pointer hover:text-purple-600 transition-colors"
                        onClick={() => handleViewProfile(venue.id)}
                      >
                        {venue.organizationName}
                      </CardTitle>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <MapPin className="w-4 h-4" />
                        {venue.location}
                      </div>
                    </div>

                  </div>
                </CardHeader>

                <CardContent className="space-y-4">


                  {/* Bio */}
                  {venue.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">{venue.bio}</p>
                  )}

                  {/* Capacity and Amenities */}
                  <div className="space-y-2 text-sm">
                    {(venue as any)?.capacity && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4" />
                        Capacity: {(venue as any)?.capacity} people
                      </div>
                    )}
                    {(venue as any)?.amenities && (venue as any)?.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {(venue as any)?.amenities.slice(0, 3).map((amenity: any) => (
                          <Badge key={amenity} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {(venue as any)?.amenities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(venue as any)?.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 text-sm border-t pt-3">
                    {(venue as any)?.website && (
                      <a
                        href={(venue as any)?.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                      >
                        <Globe className="w-4 h-4" />
                        Website
                      </a>
                    )}
                    {venue.contactPhone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {venue.contactPhone}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-3 border-t">
                    <Button
                      onClick={() => handleViewProfile(venue.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      View Profile
                    </Button>
                    <Button
                      onClick={() => handleMessageClick(venue.id)}
                      variant="default"
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Message
                    </Button>
                  </div>

                  {/* Share Buttons */}
                  <div className="flex gap-2 justify-center pt-2 border-t">
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/venue/${venue.id}`, venue.id)}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Copy link"
                    >
                      {copiedId === venue.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <button
                      onClick={() => shareOnSocial('facebook', venue as any)}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Share on Facebook"
                    >
                      <Facebook className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => shareOnSocial('twitter', venue as any)}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Share on Twitter"
                    >
                      <Twitter className="w-4 h-4 text-blue-400" />
                    </button>
                    <button
                      onClick={() => shareOnSocial('linkedin', venue as any)}
                      className="p-2 hover:bg-gray-100 rounded transition-colors"
                      title="Share on LinkedIn"
                    >
                      <Linkedin className="w-4 h-4 text-blue-700" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
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
    </div>
  );
}
