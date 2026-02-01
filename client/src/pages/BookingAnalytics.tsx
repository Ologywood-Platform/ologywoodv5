import React, { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Calendar, DollarSign, Users, BarChart3 } from "lucide-react";

interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  completionRate: number;
  bookingsByMonth: { month: string; count: number; revenue: number }[];
  topGenres: { genre: string; bookings: number; revenue: number }[];
  peakTimes: { day: string; bookings: number }[];
}

const mockArtistAnalytics: AnalyticsData = {
  totalBookings: 24,
  totalRevenue: 4800,
  averageRating: 4.8,
  completionRate: 96,
  bookingsByMonth: [
    { month: "Jan", count: 2, revenue: 400 },
    { month: "Feb", count: 3, revenue: 600 },
    { month: "Mar", count: 4, revenue: 800 },
    { month: "Apr", count: 5, revenue: 1000 },
    { month: "May", count: 6, revenue: 1200 },
    { month: "Jun", count: 4, revenue: 800 },
  ],
  topGenres: [
    { genre: "Jazz", bookings: 8, revenue: 1600 },
    { genre: "Blues", bookings: 6, revenue: 1200 },
    { genre: "Soul", bookings: 5, revenue: 1000 },
    { genre: "Rock", bookings: 5, revenue: 1000 },
  ],
  peakTimes: [
    { day: "Friday", bookings: 6 },
    { day: "Saturday", bookings: 8 },
    { day: "Sunday", bookings: 4 },
    { day: "Thursday", bookings: 3 },
    { day: "Wednesday", bookings: 2 },
    { day: "Tuesday", bookings: 1 },
  ],
};

const mockVenueAnalytics: AnalyticsData = {
  totalBookings: 32,
  totalRevenue: 6400,
  averageRating: 4.6,
  completionRate: 94,
  bookingsByMonth: [
    { month: "Jan", count: 4, revenue: 800 },
    { month: "Feb", count: 5, revenue: 1000 },
    { month: "Mar", count: 6, revenue: 1200 },
    { month: "Apr", count: 5, revenue: 1000 },
    { month: "May", count: 7, revenue: 1400 },
    { month: "Jun", count: 5, revenue: 1000 },
  ],
  topGenres: [
    { genre: "Rock", bookings: 10, revenue: 2000 },
    { genre: "Hip-Hop", bookings: 8, revenue: 1600 },
    { genre: "Jazz", bookings: 7, revenue: 1400 },
    { genre: "Pop", bookings: 7, revenue: 1400 },
  ],
  peakTimes: [
    { day: "Saturday", bookings: 10 },
    { day: "Friday", bookings: 8 },
    { day: "Sunday", bookings: 6 },
    { day: "Thursday", bookings: 4 },
    { day: "Wednesday", bookings: 3 },
    { day: "Tuesday", bookings: 1 },
  ],
};

export default function BookingAnalytics() {
  const [userType, setUserType] = useState<"artist" | "venue">("artist");
  const [timeRange, setTimeRange] = useState<"6m" | "1y" | "all">("6m");

  const analytics = userType === "artist" ? mockArtistAnalytics : mockVenueAnalytics;

  const StatCard = ({
    icon: Icon,
    label,
    value,
    unit = "",
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    unit?: string;
  }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {value}
            {unit && <span className="text-lg text-gray-500 ml-1">{unit}</span>}
          </p>
        </div>
        <div className="text-primary opacity-20">{Icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg sm:text-2xl font-bold text-primary">
            <img src="/logo-icon.png" alt="Ologywood" className="h-6 sm:h-8 w-6 sm:w-8 rounded" />
            <span className="hidden sm:inline">Ologywood</span>
            <span className="sm:hidden">OW</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-xs sm:text-sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">
            Booking Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your performance, revenue, and booking trends
          </p>
        </div>

        {/* Controls */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setUserType("artist")}
              className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                userType === "artist"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              🎤 Artist View
            </button>
            <button
              onClick={() => setUserType("venue")}
              className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                userType === "venue"
                  ? "bg-primary text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              🎪 Venue View
            </button>
          </div>
          <div className="flex gap-2">
            {(["6m", "1y", "all"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${
                  timeRange === range
                    ? "bg-primary text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {range === "6m" ? "6 Months" : range === "1y" ? "1 Year" : "All Time"}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Calendar className="h-8 w-8" />}
            label="Total Bookings"
            value={analytics.totalBookings}
          />
          <StatCard
            icon={<DollarSign className="h-8 w-8" />}
            label="Total Revenue"
            value={`$${analytics.totalRevenue.toLocaleString()}`}
          />
          <StatCard
            icon={<TrendingUp className="h-8 w-8" />}
            label="Average Rating"
            value={analytics.averageRating}
            unit="⭐"
          />
          <StatCard
            icon={<Users className="h-8 w-8" />}
            label="Completion Rate"
            value={analytics.completionRate}
            unit="%"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bookings by Month */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Bookings by Month
            </h2>
            <div className="space-y-4">
              {analytics.bookingsByMonth.map((data) => (
                <div key={data.month}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{data.month}</span>
                    <span className="text-gray-600">{data.count} bookings</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(data.count / Math.max(...analytics.bookingsByMonth.map((d) => d.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-sm text-gray-500 mt-1">${data.revenue}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Genres */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Genres
            </h2>
            <div className="space-y-4">
              {analytics.topGenres.map((genre) => (
                <div key={genre.genre}>
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{genre.genre}</span>
                    <span className="text-gray-600">{genre.bookings} bookings</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full"
                      style={{
                        width: `${(genre.bookings / Math.max(...analytics.topGenres.map((g) => g.bookings))) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="text-sm text-gray-500 mt-1">${genre.revenue} revenue</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Peak Times */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Peak Booking Days
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {analytics.peakTimes.map((time) => (
              <div key={time.day} className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{time.bookings}</div>
                <div className="text-sm font-semibold text-gray-700">{time.day}</div>
                <div className="text-xs text-gray-500 mt-1">bookings</div>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-gradient-to-r from-primary/10 to-indigo-100 rounded-lg p-6 border border-primary/20">
          <h2 className="text-xl font-bold mb-4">📊 Key Insights</h2>
          <ul className="space-y-2 text-gray-700">
            <li>
              ✓ Your peak booking day is{" "}
              <strong>
                {analytics.peakTimes.reduce((max, curr) =>
                  curr.bookings > max.bookings ? curr : max
                ).day}
              </strong>
              . Consider scheduling promotions for this day.
            </li>
            <li>
              ✓ <strong>{analytics.topGenres[0].genre}</strong> is your top genre with{" "}
              <strong>{analytics.topGenres[0].bookings} bookings</strong>. Focus on this
              audience.
            </li>
            <li>
              ✓ Your completion rate of <strong>{analytics.completionRate}%</strong> is
              excellent! Keep up the great work.
            </li>
            <li>
              ✓ Average revenue per booking: <strong>${Math.round(analytics.totalRevenue / analytics.totalBookings)}</strong>
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
