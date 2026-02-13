
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MapPin, Users, Phone, Globe, Mail, Clock, AlertCircle } from 'lucide-react';
import { useParams, useLocation } from 'wouter';
import { VenueShareButtons } from '@/components/VenueShareButtons';
import { useEffect, useState } from 'react';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';

const mockVenueData: Record<number, any> = {
  1: {
    id: 1,
    organizationName: 'The Blue Room',
    location: 'Los Angeles, CA',
    venueType: 'Club',
    capacity: 300,
    amenities: ['PA System', 'Stage', 'Parking', 'Bar', 'Sound Engineer', 'Lighting'],
    profilePhotoUrl: '/venues/blue-room.jpg',
    averageRating: 4.8,
    reviewCount: 24,
    bio: 'Intimate live music venue in downtown LA featuring local and touring artists.',
    website: 'https://theblueroom.com',
    contactPhone: '(213) 555-0101',
    email: 'info@theblueroom.com',
    operatingHours: 'Mon-Sun: 8 PM - 2 AM',
    bookingInfo: 'Contact us for booking inquiries. We accept all genres and are open to new artists.',
    reviews: [
      { id: 1, author: 'Sarah M.', rating: 5, date: '2 weeks ago', text: 'Amazing venue! Great sound system and supportive staff.' },
      { id: 2, author: 'John D.', rating: 5, date: '1 month ago', text: 'Professional setup with excellent technical support.' },
    ],
  },
  2: {
    id: 2,
    organizationName: 'Sunset Theater',
    location: 'Los Angeles, CA',
    venueType: 'Theater',
    capacity: 800,
    amenities: ['Full PA System', 'Professional Lighting', 'Dressing Rooms', 'Parking'],
    profilePhotoUrl: '/venues/sunset-theater.jpg',
    averageRating: 4.9,
    reviewCount: 42,
    bio: 'Historic theater hosting concerts, comedy, and theatrical productions.',
    website: 'https://sunsettheater.com',
    contactPhone: '(213) 555-0102',
    email: 'bookings@sunsettheater.com',
    operatingHours: 'Tue-Sun: 7 PM - 11 PM',
    bookingInfo: 'Professional venue for concerts and theatrical productions. Contact for booking.',
    reviews: [
      { id: 1, author: 'Mike T.', rating: 5, date: '1 week ago', text: 'Excellent venue with professional staff.' },
      { id: 2, author: 'Lisa R.', rating: 5, date: '2 weeks ago', text: 'Beautiful theater with great acoustics.' },
    ],
  },
  3: {
    id: 3,
    organizationName: 'Downtown Club',
    location: 'Los Angeles, CA',
    venueType: 'Club',
    capacity: 250,
    amenities: ['DJ Booth', 'Dance Floor', 'Bar', 'Parking'],
    profilePhotoUrl: '/venues/downtown-club.jpg',
    averageRating: 4.6,
    reviewCount: 18,
    bio: 'Modern nightclub with state-of-the-art sound and lighting.',
    website: 'https://downtownclub.com',
    contactPhone: '(213) 555-0103',
    email: 'info@downtownclub.com',
    operatingHours: 'Thu-Sat: 10 PM - 4 AM',
    bookingInfo: 'Great venue for DJ and electronic music events.',
    reviews: [
      { id: 1, author: 'Alex P.', rating: 5, date: '3 days ago', text: 'Amazing DJ setup and great crowd.' },
    ],
  },
  4: {
    id: 4,
    organizationName: 'The Amphitheater',
    location: 'Santa Monica, CA',
    venueType: 'Outdoor',
    capacity: 5000,
    amenities: ['Outdoor Stage', 'Seating', 'Parking', 'Food Vendors'],
    profilePhotoUrl: '/venues/amphitheater.jpg',
    averageRating: 4.7,
    reviewCount: 56,
    bio: 'Large outdoor amphitheater perfect for festivals and major events.',
    website: 'https://theamphitheater.com',
    contactPhone: '(310) 555-0104',
    email: 'events@theamphitheater.com',
    operatingHours: 'Seasonal: May - October',
    bookingInfo: 'Perfect for festivals and outdoor concerts. Large capacity venue.',
    reviews: [
      { id: 1, author: 'Emma S.', rating: 5, date: '1 month ago', text: 'Perfect outdoor venue for festivals.' },
    ],
  },
  5: {
    id: 5,
    organizationName: 'Jazz Lounge',
    location: 'Hollywood, CA',
    venueType: 'Lounge',
    capacity: 150,
    amenities: ['Intimate Setting', 'Bar', 'Private Booths', 'Valet Parking'],
    profilePhotoUrl: '/venues/jazz-lounge.jpg',
    averageRating: 4.9,
    reviewCount: 31,
    bio: 'Sophisticated jazz lounge with intimate seating and premium bar selection.',
    website: 'https://jazzlounge.com',
    contactPhone: '(323) 555-0105',
    email: 'info@jazzlounge.com',
    operatingHours: 'Tue-Sun: 7 PM - 2 AM',
    bookingInfo: 'Intimate venue perfect for jazz, blues, and acoustic performances.',
    reviews: [
      { id: 1, author: 'David M.', rating: 5, date: '5 days ago', text: 'Perfect intimate jazz venue.' },
    ],
  },
};

export default function VenueProfileDetail() {
  const { id: idParam } = useParams();
  const [, navigate] = useLocation();
  const venueId = idParam ? parseInt(idParam) : 1;

  // Set SEO meta tags when venue data loads
  useEffect(() => {
    const venueData = mockVenueData[venueId];
    if (venueData) {
      setMetaTags(pageMetaTags.venueProfile(venueData.organizationName));
    }
  }, [venueId]);
  const [isContacting, setIsContacting] = useState(false);

  // Get venue data from mock data with fallback
  const defaultVenue = {
    id: 1,
    organizationName: 'The Blue Room',
    location: 'Los Angeles, CA',
    venueType: 'Club',
    capacity: 300,
    amenities: ['PA System', 'Stage', 'Parking', 'Bar', 'Sound Engineer', 'Lighting'],
    profilePhotoUrl: '/venues/blue-room.jpg',
    mediaGallery: ['/venues/blue-room.jpg', '/venues/blue-room.jpg', '/venues/blue-room.jpg'],
    averageRating: 4.8,
    reviewCount: 24,
    bio: 'Intimate live music venue in downtown LA featuring local and touring artists.',
    website: 'https://theblueroom.com',
    contactPhone: '(213) 555-0101',
    email: 'info@theblueroom.com',
    operatingHours: 'Mon-Sun: 8 PM - 2 AM',
    bookingInfo: 'Contact us for booking inquiries. We accept all genres and are open to new artists.',
    reviews: [
      { id: 1, author: 'Sarah M.', rating: 5, date: '2 weeks ago', text: 'Amazing venue! Great sound system and supportive staff.' },
      { id: 2, author: 'John D.', rating: 5, date: '1 month ago', text: 'Professional setup with excellent technical support.' },
    ],
  };
  
  const venue = mockVenueData[venueId] ? { ...defaultVenue, ...mockVenueData[venueId], mediaGallery: [mockVenueData[venueId].profilePhotoUrl, mockVenueData[venueId].profilePhotoUrl, mockVenueData[venueId].profilePhotoUrl] } : defaultVenue;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-gray-300 overflow-hidden">
        <img
          src={venueData.profilePhotoUrl}
          alt={venueData.organizationName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
          <h1 className="text-4xl font-bold text-white mb-2">{venueData.organizationName}</h1>
          <div className="flex items-center gap-2 text-white mb-4">
            <MapPin className="h-5 w-5" />
            {venueData.location}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{venueData.averageRating}</span>
              <span className="text-sm">({venueData.reviewCount} reviews)</span>
            </div>
            <Badge variant="secondary">{venueData.venueType}</Badge>
            <Badge variant="outline" className="bg-white/20 text-white border-white">
              <Users className="h-3 w-3 mr-1" />
              {venueData.capacity} capacity
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{venueData.bio}</p>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities & Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {venue.amenities.map((amenity: any) => (
                    <Badge key={amenity} variant="outline" className="justify-center py-2">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Photo Gallery */}
            <Card>
              <CardHeader>
                <CardTitle>Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {venue.mediaGallery.map((photo: any, idx: number) => (
                    <div key={idx} className="aspect-square overflow-hidden rounded-lg">
                      <img
                        src={photo}
                        alt={`Gallery ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {venue.reviews.map((review: any) => (
                  <div key={review.id} className="border-b pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{review.author}</p>
                        <p className="text-sm text-gray-500">{review.date}</p>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-700">{review.text}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Contact & CTA */}
          <div className="space-y-6">
            {/* Contact Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Phone</p>
                  <a href={`tel:${venue.contactPhone}`} className="text-blue-600 hover:underline font-semibold flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {venue.contactPhone}
                  </a>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <a href={`mailto:${venue.email}`} className="text-blue-600 hover:underline font-semibold flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {venue.email}
                  </a>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Website</p>
                  <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Visit Website
                  </a>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hours
                  </p>
                  <p className="font-semibold">{venue.operatingHours}</p>
                </div>

                <div className="space-y-3">
                  <Button size="lg" className="w-full" onClick={() => setIsContacting(true)}>
                    Contact Venue
                  </Button>
                  <VenueShareButtons
                    venueId={venue.id}
                    venueName={venue.organizationName}
                    venueLocation={venue.location}
                    venueDescription={venue.bio}
                    profilePhotoUrl={venue.profilePhotoUrl}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Booking Info */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  Booking Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{venue.bookingInfo}</p>
              </CardContent>
            </Card>

            {/* Share */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Share This Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">Share</Button>
                  <Button variant="outline" size="sm" className="flex-1">Save</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
