import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MapPin, Users, Phone, Globe, Mail, Clock, AlertCircle } from 'lucide-react';

interface VenueProfileDetailProps {
  venueId?: number;
}

export function VenueProfileDetail({ venueId }: VenueProfileDetailProps) {
  const [isContacting, setIsContacting] = useState(false);

  // Mock venue data - would be fetched from API
  const venue = {
    id: 1,
    organizationName: 'The Blue Room',
    location: 'Los Angeles, CA',
    venueType: 'Club',
    capacity: 300,
    amenities: ['PA System', 'Stage', 'Parking', 'Bar', 'Sound Engineer', 'Lighting'],
    profilePhotoUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop',
    mediaGallery: [
      'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    ],
    averageRating: 4.8,
    reviewCount: 24,
    bio: 'Intimate live music venue in downtown LA featuring local and touring artists. We specialize in indie, rock, and alternative music with a focus on supporting emerging talent.',
    website: 'https://theblueroom.com',
    contactPhone: '(213) 555-0101',
    email: 'info@theblueroom.com',
    operatingHours: 'Mon-Sun: 8 PM - 2 AM',
    bookingInfo: 'Contact us for booking inquiries. We accept all genres and are open to new artists.',
    reviews: [
      {
        id: 1,
        author: 'Sarah M.',
        rating: 5,
        date: '2 weeks ago',
        text: 'Amazing venue! Great sound system and supportive staff. Highly recommend for any artist.',
      },
      {
        id: 2,
        author: 'John D.',
        rating: 5,
        date: '1 month ago',
        text: 'Professional setup with excellent technical support. The crowd was fantastic.',
      },
      {
        id: 3,
        author: 'Emma L.',
        rating: 4,
        date: '2 months ago',
        text: 'Good venue with decent equipment. Would appreciate better parking options.',
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-96 bg-gray-300 overflow-hidden">
        <img
          src={venue.profilePhotoUrl}
          alt={venue.organizationName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
          <h1 className="text-4xl font-bold text-white mb-2">{venue.organizationName}</h1>
          <div className="flex items-center gap-2 text-white mb-4">
            <MapPin className="h-5 w-5" />
            {venue.location}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{venue.averageRating}</span>
              <span className="text-sm">({venue.reviewCount} reviews)</span>
            </div>
            <Badge variant="secondary">{venue.venueType}</Badge>
            <Badge variant="outline" className="bg-white/20 text-white border-white">
              <Users className="h-3 w-3 mr-1" />
              {venue.capacity} capacity
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
                <p className="text-gray-700 leading-relaxed">{venue.bio}</p>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities & Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {venue.amenities.map(amenity => (
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
                  {venue.mediaGallery.map((photo, idx) => (
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
                {venue.reviews.map(review => (
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

                <Button size="lg" className="w-full" onClick={() => setIsContacting(true)}>
                  Contact Venue
                </Button>
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
