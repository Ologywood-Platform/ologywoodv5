import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Users, Star, Phone, Globe } from 'lucide-react';

interface Venue {
  id: number;
  organizationName: string;
  location: string;
  venueType?: string;
  capacity?: number;
  amenities?: string[];
  profilePhotoUrl?: string;
  averageRating: number;
  reviewCount: number;
  bio?: string;
  website?: string;
  contactPhone?: string;
  email?: string;
}

// Mock data for demonstration
const mockVenues: Venue[] = [
  {
    id: 1,
    organizationName: 'The Blue Room',
    location: 'Los Angeles, CA',
    venueType: 'Club',
    capacity: 300,
    amenities: ['PA System', 'Stage', 'Parking', 'Bar'],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=500&h=300&fit=crop',
    averageRating: 4.8,
    reviewCount: 24,
    bio: 'Intimate live music venue in downtown LA featuring local and touring artists.',
    website: 'https://theblueroom.com',
    contactPhone: '(213) 555-0101',
    email: 'info@theblueroom.com',
  },
  {
    id: 2,
    organizationName: 'Sunset Theater',
    location: 'Los Angeles, CA',
    venueType: 'Theater',
    capacity: 800,
    amenities: ['Full PA System', 'Professional Lighting', 'Dressing Rooms', 'Parking'],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&h=300&fit=crop',
    averageRating: 4.9,
    reviewCount: 42,
    bio: 'Historic theater hosting concerts, comedy, and theatrical productions.',
    website: 'https://sunsettheater.com',
    contactPhone: '(213) 555-0102',
    email: 'bookings@sunsettheater.com',
  },
  {
    id: 3,
    organizationName: 'Downtown Club',
    location: 'Los Angeles, CA',
    venueType: 'Club',
    capacity: 250,
    amenities: ['DJ Booth', 'Dance Floor', 'Bar', 'Parking'],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=500&h=300&fit=crop',
    averageRating: 4.6,
    reviewCount: 18,
    bio: 'Modern nightclub with state-of-the-art sound and lighting.',
    website: 'https://downtownclub.com',
    contactPhone: '(213) 555-0103',
    email: 'info@downtownclub.com',
  },
  {
    id: 4,
    organizationName: 'The Amphitheater',
    location: 'Santa Monica, CA',
    venueType: 'Outdoor',
    capacity: 5000,
    amenities: ['Outdoor Stage', 'Seating', 'Parking', 'Food Vendors'],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=300&fit=crop',
    averageRating: 4.7,
    reviewCount: 56,
    bio: 'Large outdoor amphitheater perfect for festivals and major events.',
    website: 'https://theamphitheater.com',
    contactPhone: '(310) 555-0104',
    email: 'events@theamphitheater.com',
  },
  {
    id: 5,
    organizationName: 'Jazz Lounge',
    location: 'Hollywood, CA',
    venueType: 'Lounge',
    capacity: 150,
    amenities: ['Intimate Setting', 'Bar', 'Private Booths', 'Valet Parking'],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=500&h=300&fit=crop',
    averageRating: 4.9,
    reviewCount: 31,
    bio: 'Upscale jazz lounge featuring live performances nightly.',
    website: 'https://jazzlounge.com',
    contactPhone: '(323) 555-0105',
    email: 'reservations@jazzlounge.com',
  },
];

export function VenueBrowse() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<string | null>(null);

  const venueTypes = ['Club', 'Theater', 'Lounge', 'Outdoor', 'Hall'];
  const allAmenities = Array.from(
    new Set(mockVenues.flatMap(v => v.amenities || []))
  );

  const filteredVenues = useMemo(() => {
    return mockVenues.filter(venue => {
      const matchesSearch = venue.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           venue.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           venue.bio?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = !selectedType || venue.venueType === selectedType;
      const matchesAmenity = !selectedAmenity || venue.amenities?.includes(selectedAmenity);
      
      return matchesSearch && matchesType && matchesAmenity;
    });
  }, [searchTerm, selectedType, selectedAmenity]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">Find Your Perfect Venue</h1>
          <p className="text-purple-100">Browse venues in our directory and book your next event</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search by venue name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-6 text-lg"
            />
          </div>

          {/* Filter Buttons */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Venue Type</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedType === null ? 'default' : 'outline'}
                  onClick={() => setSelectedType(null)}
                  className="rounded-full"
                >
                  All Types
                </Button>
                {venueTypes.map(type => (
                  <Button
                    key={type}
                    variant={selectedType === type ? 'default' : 'outline'}
                    onClick={() => setSelectedType(type)}
                    className="rounded-full"
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-sm mb-2">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedAmenity === null ? 'default' : 'outline'}
                  onClick={() => setSelectedAmenity(null)}
                  className="rounded-full"
                >
                  All Amenities
                </Button>
                {allAmenities.map(amenity => (
                  <Button
                    key={amenity}
                    variant={selectedAmenity === amenity ? 'default' : 'outline'}
                    onClick={() => setSelectedAmenity(amenity)}
                    className="rounded-full text-xs"
                  >
                    {amenity}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <strong>{filteredVenues.length}</strong> venue{filteredVenues.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Venues Grid */}
        {filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map(venue => (
              <Card key={venue.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Venue Image */}
                {venue.profilePhotoUrl && (
                  <div className="h-48 overflow-hidden bg-gray-200">
                    <img
                      src={venue.profilePhotoUrl}
                      alt={venue.organizationName}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                <CardHeader>
                  <CardTitle className="text-lg">{venue.organizationName}</CardTitle>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-2">
                    <MapPin className="h-4 w-4" />
                    {venue.location}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{venue.averageRating}</span>
                    </div>
                    <span className="text-sm text-gray-600">({venue.reviewCount} reviews)</span>
                  </div>

                  {/* Venue Type and Capacity */}
                  <div className="flex gap-2 flex-wrap">
                    {venue.venueType && (
                      <Badge variant="secondary">{venue.venueType}</Badge>
                    )}
                    {venue.capacity && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {venue.capacity} capacity
                      </Badge>
                    )}
                  </div>

                  {/* Bio */}
                  {venue.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">{venue.bio}</p>
                  )}

                  {/* Amenities */}
                  {venue.amenities && venue.amenities.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-700 mb-2">Amenities</p>
                      <div className="flex flex-wrap gap-1">
                        {venue.amenities.slice(0, 3).map(amenity => (
                          <Badge key={amenity} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {venue.amenities.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{venue.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2 pt-2 border-t">
                    {venue.contactPhone && (
                      <a href={`tel:${venue.contactPhone}`} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <Phone className="h-4 w-4" />
                        {venue.contactPhone}
                      </a>
                    )}
                    {venue.website && (
                      <a href={venue.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                        <Globe className="h-4 w-4" />
                        Visit Website
                      </a>
                    )}
                  </div>

                  {/* View Profile Button */}
                  <Button className="w-full mt-4">View Full Profile</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No venues found matching your criteria.</p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedType(null);
              setSelectedAmenity(null);
            }} className="mt-4">
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-50 py-12 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">List Your Venue for Free</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Are you a venue owner? Add your venue to our directory for free and get discovered by artists looking to book events. 
            Promote your space and connect with performers in your area.
          </p>
          <Button size="lg" className="gap-2">
            Add Your Venue
          </Button>
        </div>
      </div>
    </div>
  );
}
