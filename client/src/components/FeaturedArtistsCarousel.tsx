import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Artist } from "@/types";
import { LazyImage } from "./LazyImage";

interface FeaturedArtistsCarouselProps {
  artists: Artist[];
  isLoading?: boolean;
}

export function FeaturedArtistsCarousel({ artists, isLoading }: FeaturedArtistsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(3);

  // Responsive items per view
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

  if (!artists || artists.length === 0) {
    return null;
  }

  const totalSlides = Math.ceil(artists.length / itemsPerView);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  };

  const startIndex = currentIndex * itemsPerView;
  const visibleArtists = artists.slice(startIndex, startIndex + itemsPerView);

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-background to-secondary/5">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Featured Artists</h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Discover talented performers ready to book for your events
            </p>
          </div>
          <Link href="/browse">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              View All Artists
            </Button>
          </Link>
        </div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Artists Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {isLoading ? (
              // Loading skeleton
              Array(itemsPerView)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted rounded-lg h-64 sm:h-72 animate-pulse"
                  />
                ))
            ) : (
              visibleArtists.map((artist, index) => (
                <Link key={`${artist.id}-${index}`} href={`/artist/${artist.id}`}>
                  <div className="group cursor-pointer">
                    <div className="relative overflow-hidden rounded-lg bg-muted h-64 sm:h-72 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105">
                      {artist.profilePhotoUrl ? (
                        <LazyImage
                          src={artist.profilePhotoUrl}
                          alt={artist.artistName || 'Artist'}
                          containerClassName="w-full h-full"
                          imageClassName="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-primary/20 to-accent/20">
                          <Music className="h-12 w-12 sm:h-16 sm:w-16 text-primary/50 mb-2" />
                          <span className="text-xs sm:text-sm text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {artist.artistName || 'Unknown Artist'}
                      </h3>
                      {artist.genre && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                          {artist.genre}
                        </p>
                      )}
                      {artist.location && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                          📍 {artist.location}
                        </p>
                      )}
                      <Button
                        size="sm"
                        className="w-full mt-3 text-xs sm:text-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          window.location.href = `/artist/${artist.id}`;
                        }}
                      >
                        View Profile
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
                aria-label="Previous artists"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Slide Indicators */}
              <div className="flex gap-2">
                {Array(totalSlides)
                  .fill(0)
                  .map((_, i) => (
                    <button
                      key={`slide-${i}`}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-2 w-2 rounded-full transition-all ${
                        i === currentIndex
                          ? "bg-primary w-6"
                          : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                      aria-label={`Go to slide ${i + 1}`}
                    />
                  ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="h-10 w-10"
                aria-label="Next artists"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Mobile View All Button */}
          <div className="sm:hidden mt-6">
            <Link href="/browse">
              <Button variant="default" size="sm" className="w-full">
                View All Artists
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
