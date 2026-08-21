import { toSlug } from '@/lib/slugify';
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Building2, MapPin, Users, Wine, Disc3, Mic2, Theater, Trophy, TreePine, UtensilsCrossed, Sofa, Tent, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { LazyImage } from "./LazyImage";

interface FeaturedVenue {
  id: number;
  userId: number;
  organizationName: string;
  location?: string;
  venueType?: string;
  capacity?: number;
  profilePhotoUrl?: string;
  averageRating?: number;
  reviewCount?: number;
}

interface FeaturedVenuesCarouselProps {
  venues: FeaturedVenue[];
  isLoading?: boolean;
}

function getVenueTypeIcon(type: string) {
  switch (type?.toLowerCase()) {
    case 'bar': return <Wine className="h-3 w-3" />;
    case 'club': return <Disc3 className="h-3 w-3" />;
    case 'concert_hall': return <Mic2 className="h-3 w-3" />;
    case 'theater': return <Theater className="h-3 w-3" />;
    case 'arena': return <Trophy className="h-3 w-3" />;
    case 'outdoor': return <TreePine className="h-3 w-3" />;
    case 'restaurant': return <UtensilsCrossed className="h-3 w-3" />;
    case 'lounge': return <Sofa className="h-3 w-3" />;
    case 'festival_grounds': return <Tent className="h-3 w-3" />;
    case 'private_event_space': return <Lock className="h-3 w-3" />;
    default: return <Building2 className="h-3 w-3" />;
  }
}

function formatVenueType(type: string) {
  return type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Venue';
}

export function FeaturedVenuesCarousel({ venues, isLoading }: FeaturedVenuesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!venues || venues.length === 0) {
    return null; // Don't show section if no venues
  }

  const totalSlides = Math.ceil(venues.length / itemsPerView);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const startIndex = currentIndex * itemsPerView;
  const visibleVenues = venues.slice(startIndex, startIndex + itemsPerView);

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-secondary/5 to-background">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Featured Venues</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Discover top venues looking for talented artists to perform
            </p>
          </div>
          <Link href="/browse?tab=venues">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              View All Venues
            </Button>
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {isLoading ? (
              Array(itemsPerView)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted rounded-lg h-64 sm:h-72 animate-pulse"
                  />
                ))
            ) : (
              visibleVenues.map((venue, index) => (
                <Link key={`${venue.id}-${index}`} href={`/venue/${toSlug(venue.organizationName || '')}`}>
                  <div className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-lg bg-muted aspect-[4/3] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105">
                      {venue.profilePhotoUrl ? (
                        <LazyImage
                          src={venue.profilePhotoUrl}
                          alt={venue.organizationName}
                          containerClassName="w-full h-full"
                          imageClassName="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <Building2 className="h-16 w-16 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Venue type badge */}
                      {venue.venueType && (
                        <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm">
                          {getVenueTypeIcon(venue.venueType)}
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {venue.organizationName}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {venue.venueType && (
                          <Badge variant="secondary" className="text-xs gap-1 flex items-center">
                            {getVenueTypeIcon(venue.venueType)}
                            {formatVenueType(venue.venueType)}
                          </Badge>
                        )}
                        {venue.capacity && (
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <Users className="h-3 w-3" />
                            {venue.capacity}
                          </span>
                        )}
                      </div>
                      {venue.location && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {venue.location}
                        </p>
                      )}
                      <Button
                        size="sm"
                        className="w-full mt-3 text-xs sm:text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/venue/${toSlug(venue.organizationName || '')}`;
                        }}
                      >
                        View Venue
                      </Button>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Navigation Buttons */}
          {totalSlides > 1 && (
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="h-10 w-10"
                aria-label="Previous venues"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex gap-2">
                {Array(totalSlides)
                  .fill(0)
                  .map((_, i) => (
                    <button
                      key={`venue-slide-${i}`}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        i === currentIndex
                          ? "bg-primary w-6"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                      aria-label={`Go to venue slide ${i + 1}`}
                    />
                  ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="h-10 w-10"
                aria-label="Next venues"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
