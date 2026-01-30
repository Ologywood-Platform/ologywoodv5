import React, { useState, useEffect } from "react";
import { useParams } from "wouter";
import { Star, MapPin, Music, Calendar, Users, ExternalLink, Loader } from "lucide-react";
import { trpc } from "../lib/trpc";

interface ArtistPortfolioProps {
  artistId?: string;
}

export function ArtistPortfolio({ artistId: propArtistId }: ArtistPortfolioProps) {
  const { artistId: paramArtistId } = useParams<{ artistId: string }>();
  const id = propArtistId || paramArtistId;
  const [activeTab, setActiveTab] = useState<"gallery" | "reviews" | "bookings">("gallery");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch artist profile from API
  const { data: artistData, isLoading: isArtistLoading } = trpc.artist.getProfile.useQuery(
    { id: parseInt(id || "1") },
    { enabled: !!id }
  );

  useEffect(() => {
    setIsLoading(isArtistLoading);
  }, [isArtistLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader size={48} className="animate-spin text-purple-600" />
          <p className="text-gray-600">Loading artist profile...</p>
        </div>
      </div>
    );
  }

  if (!artistData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Artist Not Found</h2>
          <p className="text-gray-600">The artist profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const artist = {
    id: artistData.id || parseInt(id || "1"),
    name: artistData.artistName || "Unknown Artist",
    bio: artistData.bio || "No bio available",
    genre: artistData.genre || [],
    location: artistData.location || "Unknown",
    rating: 4.8, // Would come from reviews API
    reviewCount: 127, // Would come from reviews API
    profileImage: artistData.profilePhotoUrl || "https://via.placeholder.com/300x300?text=Artist+Profile",
    gallery: artistData.mediaGallery?.photos || [],
    reviews: [] as any[],
    bookings: [] as any[],
    stats: {
      totalBookings: 45, // Would fetch from bookings API
      yearsActive: 8, // Would calculate from createdAt
      tourPartySize: artistData.touringPartySize || 5,
      minFee: artistData.feeRangeMin || 2500,
      maxFee: artistData.feeRangeMax || 7500,
    },
    socialLinks: artistData.socialLinks || {},
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={16}
            className={i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-3 sm:p-4 md:p-8 items-center">
            <img
              src={artist.profileImage}
              alt={artist.name}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
            />
            <div className="flex-1">
              <h1 className="text-2xl sm:text-xl sm:text-2xl md:text-3xl md:text-4xl font-bold mb-2">{artist.name}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  {renderStars(artist.rating)}
                  <span className="text-lg font-semibold">{artist.rating}</span>
                  <span className="text-sm opacity-90">({artist.reviewCount} reviews)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin size={18} />
                  {artist.location}
                </div>
                <div className="flex items-center gap-2">
                  <Music size={18} />
                  {artist.genre.length > 0 ? artist.genre.join(", ") : "No genres specified"}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  {artist.stats.tourPartySize} members
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Bio Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">About</h2>
          <p className="text-gray-700 leading-relaxed">{artist.bio}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{artist.stats.totalBookings}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{artist.stats.yearsActive}</div>
            <div className="text-sm text-gray-600">Years Active</div>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">${(artist.stats.minFee / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-600">Starting Rate</div>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{artist.stats.tourPartySize}</div>
            <div className="text-sm text-gray-600">Tour Party Size</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 sm:mb-8">
          <div className="flex gap-3 sm:p-4 md:p-8">
            <button
              onClick={() => setActiveTab("gallery")}
              className={`pb-4 font-semibold transition-colors ${
                activeTab === "gallery"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Gallery ({artist.gallery.length})
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`pb-4 font-semibold transition-colors ${
                activeTab === "reviews"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Reviews
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`pb-4 font-semibold transition-colors ${
                activeTab === "bookings"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Upcoming Bookings
            </button>
          </div>
        </div>

        {/* Gallery Tab */}
        {activeTab === "gallery" && (
          <div>
            {artist.gallery.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {artist.gallery.map((imageUrl, idx) => (
                  <div key={idx} className="group relative overflow-hidden rounded-lg">
                    <img
                      src={imageUrl}
                      alt={`Gallery ${idx + 1}`}
                      className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No gallery photos yet</p>
              </div>
            )}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div>
            {artist.reviews.length > 0 ? (
              <div className="space-y-6">
                {artist.reviews.map((review) => (
                  <div key={review.id} className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{review.author}</p>
                        <p className="text-sm text-gray-600">{review.venue}</p>
                      </div>
                      <div className="flex">{renderStars(review.rating)}</div>
                    </div>
                    <p className="text-gray-700 mb-2">{review.text}</p>
                    <p className="text-xs text-gray-500">{new Date(review.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No reviews yet</p>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div>
            {artist.bookings.length > 0 ? (
              <div className="space-y-4">
                {artist.bookings.map((booking) => (
                  <div key={booking.id} className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Calendar size={24} className="text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-900">{booking.venue}</p>
                        <p className="text-sm text-gray-600">{new Date(booking.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        booking.status === "confirmed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No upcoming bookings</p>
              </div>
            )}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-3 sm:p-4 md:p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to book {artist.name}?</h3>
          <p className="mb-6 text-lg opacity-90">
            Starting at ${(artist.stats.minFee / 100).toFixed(2)} • Professional • Verified
          </p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
            Request Booking
          </button>
        </div>

        {/* Social Links */}
        {Object.keys(artist.socialLinks).length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            {artist.socialLinks.instagram && (
              <a
                href={artist.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ExternalLink size={20} />
              </a>
            )}
            {artist.socialLinks.spotify && (
              <a
                href={artist.socialLinks.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ExternalLink size={20} />
              </a>
            )}
            {artist.socialLinks.youtube && (
              <a
                href={artist.socialLinks.youtube}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-purple-600 transition-colors"
              >
                <ExternalLink size={20} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
