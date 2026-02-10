import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Users, Phone, Globe, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { useLocation } from 'wouter';

export function DemoVenueProfile() {
  const [, navigate] = useLocation();

  const demoVenue = {
    name: 'The Blue Room',
    location: 'Los Angeles, CA',
    image: '/venues/blue-room.jpg',
    rating: 4.8,
    reviews: 24,
    capacity: 300,
    type: 'Club',
    amenities: ['PA System', 'Stage', 'Parking', 'Bar', 'Professional Lighting'],
    description: 'Intimate live music venue in downtown LA featuring local and touring artists. Cozy setting with vintage concert posters and professional stage lighting.',
    phone: '(213) 555-0101',
    website: 'https://theblueroom.com',
    hours: 'Tue-Sun 8PM-2AM',
    priceRange: '$500-$2000',
    upcomingBookings: 12,
    artistsBooked: 48
  };

  const handleSignUp = () => {
    navigate('/get-started');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Sign-Up Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 px-4 sm:px-6 lg:px-8 sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">This is a Demo Venue Profile</h2>
            <p className="text-blue-100 mt-1">See what your venue profile could look like on Ologywood</p>
          </div>
          <Button
            onClick={handleSignUp}
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2 whitespace-nowrap"
          >
            Sign Up Free
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="relative bg-slate-200 rounded-lg overflow-hidden h-96 mb-6">
            <img
              src={demoVenue.image}
              alt={demoVenue.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{demoVenue.name}</h1>
                <div className="flex items-center gap-2 text-slate-600 mb-4">
                  <MapPin className="w-5 h-5" />
                  {demoVenue.location}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.round(demoVenue.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-slate-900">
                    {demoVenue.rating}
                  </span>
                  <span className="text-slate-600">({demoVenue.reviews} reviews)</span>
                </div>
              </div>
              <Button
                onClick={handleSignUp}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                Claim Your Venue
              </Button>
            </div>

            <p className="text-slate-600 text-lg mb-6">{demoVenue.description}</p>

            {/* Key Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-8">
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="text-sm text-slate-600">Capacity</div>
                  <div className="font-semibold text-slate-900">{demoVenue.capacity}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="text-sm text-slate-600">Hours</div>
                  <div className="font-semibold text-slate-900">{demoVenue.hours}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="text-sm text-slate-600">Booking Rate</div>
                  <div className="font-semibold text-slate-900">{demoVenue.priceRange}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card>
              <CardHeader>
                <CardTitle>About This Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  {demoVenue.description}
                </p>
                <p className="text-slate-600">
                  Located in the heart of downtown Los Angeles, {demoVenue.name} offers the perfect intimate setting for live performances. With state-of-the-art sound and lighting, professional staff, and a dedicated audience, this venue is ideal for artists looking to build their fanbase and create memorable performances.
                </p>
              </CardContent>
            </Card>

            {/* Amenities Section */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {demoVenue.amenities.map((amenity) => (
                    <Badge key={amenity} className="bg-blue-100 text-blue-800 py-2 px-3 text-center justify-center">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Section */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <a href={`tel:${demoVenue.phone}`} className="text-blue-600 hover:underline">
                    {demoVenue.phone}
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <a href={demoVenue.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {demoVenue.website}
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle>Venue Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-b pb-4">
                  <div className="text-sm text-slate-600 mb-1">Upcoming Bookings</div>
                  <div className="text-3xl font-bold text-slate-900">{demoVenue.upcomingBookings}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-600 mb-1">Artists Booked</div>
                  <div className="text-3xl font-bold text-slate-900">{demoVenue.artistsBooked}</div>
                </div>
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Unlock These Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Full photo gallery</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Artist reviews & ratings</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Booking calendar</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Analytics dashboard</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Social sharing tools</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Direct messaging</span>
                </div>
              </CardContent>
            </Card>

            {/* CTA Button */}
            <Button
              onClick={handleSignUp}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-6 text-lg font-semibold"
            >
              Sign Up Your Venue Free
            </Button>

            {/* Trust Indicators */}
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="text-3xl font-bold text-slate-900">1000+</div>
                  <div className="text-sm text-slate-600">Artists on Ologywood</div>
                  <div className="border-t pt-3">
                    <div className="text-2xl font-bold text-slate-900">500+</div>
                    <div className="text-sm text-slate-600">Bookings this month</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-12 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Showcase Your Venue?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of venues on Ologywood and connect with artists looking to book your space. It's free to list, and you only pay when you book.
          </p>
          <Button
            onClick={handleSignUp}
            className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
          >
            Get Started Free
          </Button>
        </div>
      </div>
    </div>
  );
}
