import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, MapPin, DollarSign, ChevronRight, Filter } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

interface Booking {
  id: number;
  artistId?: number;
  venueId?: number;
  artistName?: string;
  venueName: string;
  eventDate: Date | string;
  eventTime?: string | null;
  eventDetails: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  totalFee?: string | number | null;
  depositAmount?: string | number | null;
  location?: string;
  venueAddress?: string | null;
  createdAt: Date | string;
  updatedAt?: Date | string;
  [key: string]: any;
}

export default function BookingsList() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Fetch bookings based on user role
  const { data: artistBookings, isLoading: artistLoading } = trpc.booking.getMyArtistBookings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "artist",
  });

  const { data: venueBookings, isLoading: venueLoading } = trpc.booking.getMyVenueBookings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "venue",
  });

  if (!isAuthenticated || !user) {
    return null;
  }

  const isArtist = user.role === "artist";
  const bookings = (isArtist ? artistBookings : venueBookings) || [];
  const isLoading = isArtist ? artistLoading : venueLoading;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const filteredBookings = bookings.filter((booking: Booking) => {
    if (filterStatus === "all") return true;
    return booking.status === filterStatus;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b: Booking) => b.status === "pending").length,
    confirmed: bookings.filter((b: Booking) => b.status === "confirmed").length,
    completed: bookings.filter((b: Booking) => b.status === "completed").length,
    cancelled: bookings.filter((b: Booking) => b.status === "cancelled").length,
  };

  const totalRevenue = bookings
    .filter((b: Booking) => b.status === "completed")
    .reduce((sum: number, b: Booking) => sum + (typeof b.totalFee === 'string' ? parseFloat(b.totalFee) : (b.totalFee || 0)), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
                <p className="text-gray-600 mt-1">
                  {isArtist ? "Manage your booking requests and confirmations" : "View and manage your venue bookings"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Bookings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Confirmed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.confirmed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Bookings List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Bookings</CardTitle>
                <CardDescription>View and manage your bookings</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Loading bookings...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {filterStatus === "all"
                    ? isArtist
                      ? "No bookings yet. Check back soon!"
                      : "No bookings created yet."
                    : `No ${filterStatus} bookings found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookings.map((booking: Booking) => (
                  <Link key={booking.id} href={`/booking/${booking.id}`}>
                    <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {isArtist ? booking.venueName : (booking.artistName || 'Unknown Artist')}
                            </h3>
                            <Badge className={getStatusColor(booking.status)}>
                              {getStatusLabel(booking.status)}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{typeof booking.eventDate === 'string' ? new Date(booking.eventDate).toLocaleDateString() : (booking.eventDate as Date).toLocaleDateString()}</span>
                            </div>

                            {booking.location && (
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{booking.location}</span>
                              </div>
                            )}

                            {booking.totalFee && (
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4" />
                                <span>${typeof booking.totalFee === 'string' ? parseFloat(booking.totalFee).toFixed(2) : (booking.totalFee as number).toFixed(2)}</span>
                              </div>
                            )}
                          </div>

                          {booking.eventDetails && (
                            <p className="text-sm text-gray-600 mt-2">{booking.eventDetails}</p>
                          )}
                        </div>

                        <ChevronRight className="h-5 w-5 text-gray-400 ml-4 flex-shrink-0" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  Back to Dashboard
                </Button>
              </Link>
              <Link href={isArtist ? "/availability" : "/browse"}>
                <Button variant="outline" className="w-full">
                  {isArtist ? "Manage Availability" : "Browse Artists"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
