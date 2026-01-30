import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

interface Artist {
  id: number;
  name: string;
  genre: string;
  image: string;
  rating: number;
  reviewCount: number;
  price?: number;
}

interface MobileArtistCarouselProps {
  title: string;
  artists: Artist[];
  onArtistClick?: (artist: Artist) => void;
}

export function MobileArtistCarousel({ title, artists, onArtistClick }: MobileArtistCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? artists.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === artists.length - 1 ? 0 : prev + 1));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setTouchEnd(e.changedTouches[0].clientX);
    handleSwipe();
  };

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrev();
    }
  };

  // Auto-rotate carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === artists.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [artists.length]);

  if (!artists || artists.length === 0) {
    return null;
  }

  const currentArtist = artists[currentIndex];

  return (
    <div className="w-full px-3 sm:px-4 py-6">
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">Swipe to explore</p>
      </div>

      {/* Carousel Container */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative bg-white rounded-xl overflow-hidden shadow-md"
      >
        {/* Artist Card */}
        <div className="aspect-video sm:aspect-square relative overflow-hidden bg-gradient-to-br from-purple-100 to-purple-50">
          {currentArtist.image ? (
            <img
              src={currentArtist.image}
              alt={currentArtist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl font-bold text-purple-200 mb-2">♪</div>
                <p className="text-gray-400">{currentArtist.genre}</p>
              </div>
            </div>
          )}

          {/* Overlay with Info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white">{currentArtist.name}</h3>
            <p className="text-sm text-gray-200">{currentArtist.genre}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-sm font-semibold text-white">{currentArtist.rating}</span>
              </div>
              <span className="text-xs text-gray-300">({currentArtist.reviewCount} reviews)</span>
              {currentArtist.price && (
                <span className="text-sm font-semibold text-green-400 ml-auto">${currentArtist.price}</span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Buttons - Hidden on mobile, visible on tablet+ */}
        <button
          onClick={handlePrev}
          className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors z-10"
          aria-label="Previous artist"
        >
          <ChevronLeft className="h-5 w-5 text-gray-900" />
        </button>

        <button
          onClick={handleNext}
          className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 transition-colors z-10"
          aria-label="Next artist"
        >
          <ChevronRight className="h-5 w-5 text-gray-900" />
        </button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-4">
        {artists.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-purple-600 w-6'
                : 'bg-gray-300 w-2 hover:bg-gray-400'
            }`}
            aria-label={`Go to artist ${index + 1}`}
          />
        ))}
      </div>

      {/* CTA Button */}
      <button
        onClick={() => onArtistClick?.(currentArtist)}
        className="w-full mt-4 px-4 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm sm:text-base"
      >
        View Profile & Book
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-600 text-center mt-3">
        {currentIndex + 1} of {artists.length}
      </p>
    </div>
  );
}
