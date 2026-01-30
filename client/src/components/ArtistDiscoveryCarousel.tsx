import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, MapPin } from 'lucide-react';

interface DiscoveryArtist {
  id: number;
  artistName: string;
  genre: string[];
  profilePhotoUrl?: string;
  feeRangeMin?: number;
  feeRangeMax?: number;
  averageRating: number;
  reviewCount: number;
  location?: string;
  badge?: 'featured' | 'trending' | 'new';
}

interface ArtistDiscoveryCarouselProps {
  title: string;
  description: string;
  artists: DiscoveryArtist[];
  onViewMore: () => void;
  onArtistClick: (artistId: number) => void;
}

export const ArtistDiscoveryCarousel: React.FC<ArtistDiscoveryCarouselProps> = ({
  title,
  description,
  artists,
  onViewMore,
  onArtistClick,
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById(`carousel-${title}`);
    if (container) {
      const scrollAmount = 320; // Card width + gap
      const newPosition = direction === 'left' ? scrollPosition - scrollAmount : scrollPosition + scrollAmount;
      container.scrollLeft = newPosition;
      setScrollPosition(newPosition);
    }
  };

  const getBadgeColor = (badge?: string) => {
    switch (badge) {
      case 'featured':
        return 'bg-yellow-100 text-yellow-800';
      case 'trending':
        return 'bg-red-100 text-red-800';
      case 'new':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="py-12 px-4 md:px-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-2">{description}</p>
        </div>
        <button
          onClick={onViewMore}
          className="px-6 py-2 text-blue-600 hover:text-blue-700 font-medium transition"
        >
          View All →
        </button>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Scroll Buttons */}
        {scrollPosition > 0 && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
        )}

        {artists.length > 3 && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
          >
            <ChevronRight size={24} className="text-gray-700" />
          </button>
        )}

        {/* Artist Cards */}
        <div
          id={`carousel-${title}`}
          className="flex gap-6 overflow-x-auto scroll-smooth pb-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          {artists.map((artist) => (
            <div
              key={artist.id}
              onClick={() => onArtistClick(artist.id)}
              className="flex-shrink-0 w-80 bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer overflow-hidden"
            >
              {/* Image */}
              <div className="relative h-48 bg-gray-200 overflow-hidden">
                {artist.profilePhotoUrl ? (
                  <img
                    src={artist.profilePhotoUrl}
                    alt={artist.artistName}
                    className="w-full h-full object-cover hover:scale-105 transition"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">
                      {artist.artistName.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Badge */}
                {artist.badge && (
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${getBadgeColor(artist.badge)}`}>
                    {artist.badge.charAt(0).toUpperCase() + artist.badge.slice(1)}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                {/* Name */}
                <h3 className="text-lg font-bold text-gray-900 truncate">{artist.artistName}</h3>

                {/* Location */}
                {artist.location && (
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                    <MapPin size={14} />
                    <span className="truncate">{artist.location}</span>
                  </div>
                )}

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {artist.genre.slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                    >
                      {g}
                    </span>
                  ))}
                  {artist.genre.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                      +{artist.genre.length - 2}
                    </span>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < Math.round(artist.averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {artist.averageRating.toFixed(1)} ({artist.reviewCount})
                  </span>
                </div>

                {/* Fee Range */}
                {artist.feeRangeMin && artist.feeRangeMax && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">
                      ${artist.feeRangeMin.toLocaleString()} - ${artist.feeRangeMax.toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Book Button */}
                <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ArtistDiscoveryCarousel;
