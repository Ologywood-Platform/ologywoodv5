import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Share2, Facebook, Twitter, Linkedin, Instagram, X } from 'lucide-react';

interface GalleryImage {
  id: number;
  url: string;
  title: string;
  description: string;
}

interface Venue {
  id: number;
  name: string;
  location: string;
  gallery: GalleryImage[];
}

const mockVenueGalleries: Venue[] = [
  {
    id: 1,
    name: 'The Blue Room',
    location: 'Los Angeles, CA',
    gallery: [
      {
        id: 1,
        url: '/venues/blue-room.jpg',
        title: 'Main Stage',
        description: 'Professional stage with intimate seating'
      },
      {
        id: 2,
        url: '/venues/blue-room.jpg',
        title: 'Bar Area',
        description: 'Premium bar with vintage concert posters'
      },
      {
        id: 3,
        url: '/venues/blue-room.jpg',
        title: 'Audience View',
        description: 'Cozy seating arrangement'
      }
    ]
  },
  {
    id: 2,
    name: 'Sunset Theater',
    location: 'Los Angeles, CA',
    gallery: [
      {
        id: 1,
        url: '/venues/sunset-theater.jpg',
        title: 'Grand Auditorium',
        description: 'Historic theater with ornate architecture'
      },
      {
        id: 2,
        url: '/venues/sunset-theater.jpg',
        title: 'Stage Setup',
        description: 'Professional theatrical lighting'
      },
      {
        id: 3,
        url: '/venues/sunset-theater.jpg',
        title: 'Seating',
        description: 'Red velvet seats with excellent views'
      }
    ]
  }
];

export function VenueGallery() {
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(mockVenueGalleries[0]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(
    mockVenueGalleries[0]?.gallery[0] || null
  );
  const [shareOpen, setShareOpen] = useState(false);

  const handleShare = (platform: string) => {
    if (!selectedVenue || !selectedImage) return;

    const text = `Check out ${selectedVenue.name} on Ologywood! ${selectedImage.description}`;
    const url = window.location.href;

    switch (platform) {
      case 'facebook':
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
          '_blank'
        );
        break;
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
          '_blank'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
          '_blank'
        );
        break;
      case 'instagram':
        alert('Share this image on Instagram by copying the link and posting it in your story!');
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Venue Photo Gallery</h1>
          <p className="text-lg text-slate-600">
            Explore stunning photos of our partner venues and share them with your network
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Venue List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Venues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {mockVenueGalleries.map((venue) => (
                  <button
                    key={venue.id}
                    onClick={() => {
                      setSelectedVenue(venue);
                      setSelectedImage(venue.gallery[0]);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedVenue?.id === venue.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    <div className="font-semibold">{venue.name}</div>
                    <div className="text-sm opacity-75">{venue.location}</div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Gallery */}
          <div className="lg:col-span-3">
            {selectedVenue && selectedImage && (
              <div className="space-y-6">
                {/* Main Image */}
                <Card className="overflow-hidden">
                  <div className="relative bg-slate-200 aspect-video">
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="pt-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      {selectedImage.title}
                    </h2>
                    <p className="text-slate-600 mb-6">{selectedImage.description}</p>

                    {/* Social Share Buttons */}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={() => handleShare('facebook')}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Facebook className="w-4 h-4 mr-2" />
                        Share on Facebook
                      </Button>
                      <Button
                        onClick={() => handleShare('twitter')}
                        className="bg-blue-400 hover:bg-blue-500 text-white"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Share on Twitter
                      </Button>
                      <Button
                        onClick={() => handleShare('linkedin')}
                        className="bg-blue-700 hover:bg-blue-800 text-white"
                      >
                        <Linkedin className="w-4 h-4 mr-2" />
                        Share on LinkedIn
                      </Button>
                      <Button
                        onClick={() => handleShare('instagram')}
                        className="bg-pink-600 hover:bg-pink-700 text-white"
                      >
                        <Instagram className="w-4 h-4 mr-2" />
                        Share on Instagram
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Thumbnail Gallery */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">More Photos</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {selectedVenue.gallery.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(image)}
                        className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImage.id === image.id
                            ? 'border-blue-500 ring-2 ring-blue-300'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={image.url}
                          alt={image.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Venue Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>About {selectedVenue.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-4">
                      {selectedVenue.name} is a premier venue in {selectedVenue.location}. 
                      Browse our photo gallery to see the amazing facilities and atmosphere.
                    </p>
                    <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                      View Full Profile
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
