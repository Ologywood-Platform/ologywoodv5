import React, { useState } from "react";
import { useParams } from "wouter";
import { Star, MapPin, Music, Calendar, Users, ExternalLink } from "lucide-react";

interface ArtistPortfolioProps {
  artistId?: string;
}

export function ArtistPortfolio({ artistId: propArtistId }: ArtistPortfolioProps) {
  const { artistId: paramArtistId } = useParams<{ artistId: string }>();
  const id = propArtistId || paramArtistId;
  const [activeTab, setActiveTab] = useState<"gallery" | "reviews" | "bookings">("gallery");

  // Mock data - replace with actual API call
  const artist = {
    id: parseInt(id || "1"),
    name: "The Jazz Collective",
    bio: "Award-winning jazz ensemble bringing sophisticated sounds to venues across the country.",
    genre: ["Jazz", "Blues", "Soul"],
    location: "New York, NY",
    rating: 4.8,
    reviewCount: 127,
    profileImage: "https://via.placeholder.com/300x300?text=Artist+Profile",
    gallery: [
      { id: 1, url: "https://via.placeholder.com/400x300?text=Performance+1", caption: "Live at Madison Square Garden" },
      { id: 2, url: "https://via.placeholder.com/400x300?text=Performance+2", caption: "Studio Session" },
      { id: 3, url: "https://via.placeholder.com/400x300?text=Performance+3", caption: "Outdoor Festival" },
      { id: 4, url: "https://via.placeholder.com/400x300?text=Performance+4", caption: "Concert Hall" },
    ],
    reviews: [
      {
        id: 1,
        author: "Sarah Johnson",
        venue: "The Blue Note",
        rating: 5,
        text: "Absolutely fantastic performance! The energy and musicianship were outstanding.",
        date: "2024-01-15",
      },
      {
        id: 2,
        author: "Michael Chen",
        venue: "Jazz at Lincoln Center",
        rating: 5,
        text: "Professional, talented, and a joy to work with. Highly recommended!",
        date: "2024-01-10",
      },
      {
        id: 3,
        author: "Emma Rodriguez",
        venue: "The Fillmore",
        rating: 4,
        text: "Great performance. Would love to book them again.",
        date: "2024-01-05",
      },
    ],
    bookings: [
      { id: 1, venue: "The Blue Note", date: "2024-02-15", status: "confirmed" },
      { id: 2, venue: "Jazz at Lincoln Center", date: "2024-02-22", status: "confirmed" },
      { id: 3, venue: "The Fillmore", date: "2024-03-10", status: "pending" },
    ],
    stats: {
      totalBookings: 45,
      yearsActive: 8,
      tourPartySize: 5,
      minFee: 2500,
      maxFee: 7500,
    },
    socialLinks: {
      instagram: "https://instagram.com",
      spotify: "https://spotify.com",
      youtube: "https://youtube.com",
    },
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
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <img
              src={artist.profileImage}
              alt={artist.name}
              className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
            />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{artist.name}</h1>
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
                  {artist.genre.join(", ")}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{artist.stats.totalBookings}</div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{artist.stats.yearsActive}</div>
            <div className="text-sm text-gray-600">Years Active</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">${(artist.stats.minFee / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-600">Starting Rate</div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{artist.stats.tourPartySize}</div>
            <div className="text-sm text-gray-600">Tour Party Size</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("gallery")}
              className={`pb-4 font-semibold transition-colors ${
                activeTab === "gallery"
                  ? "text-purple-600 border-b-2 border-purple-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Gallery
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {artist.gallery.map((image) => (
              <div key={image.id} className="group relative overflow-hidden rounded-lg">
                <img
                  src={image.url}
                  alt={image.caption}
                  className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                  <p className="text-white text-sm">{image.caption}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            {artist.reviews.map((review) => (
              <div key={review.id} className="bg-white p-6 rounded-lg border border-gray-200">
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
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="space-y-4">
            {artist.bookings.map((booking) => (
              <div key={booking.id} className="bg-white p-6 rounded-lg border border-gray-200 flex items-center justify-between">
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
        )}

        {/* CTA Section */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to book {artist.name}?</h3>
          <p className="mb-6 text-lg opacity-90">
            Starting at ${(artist.stats.minFee / 100).toFixed(2)} • Professional • Verified
          </p>
          <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors">
            Request Booking
          </button>
        </div>

        {/* Social Links */}
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
      </div>
    </div>
  );
}
