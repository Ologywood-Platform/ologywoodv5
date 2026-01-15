import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface BookingEvent {
  id: number;
  date: string;
  title: string;
  type: "booking" | "available" | "unavailable";
  status: string;
  venueOrArtist: string;
}

export default function Calendar() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 15));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<BookingEvent[]>([]);

  // Fetch artist profile
  const { data: artistProfile } = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });

  // Fetch bookings for artist
  const { data: bookings } = trpc.booking.getMyArtistBookings.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });

  // Fetch availability for artist
  const { data: availability } = trpc.availability.getForArtist.useQuery(
    { artistId: artistProfile?.id || 0 },
    { enabled: !!artistProfile?.id }
  );

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    // Build events from real data
    const calendarEvents: BookingEvent[] = [];
    let eventId = 1;

    // Add bookings as events
    if (bookings && bookings.length > 0) {
      bookings.forEach((booking: any) => {
        const eventDate = new Date(booking.eventDate);
        calendarEvents.push({
          id: eventId++,
          date: eventDate.toISOString().split('T')[0],
          title: `${booking.venueName} - ${booking.eventDetails || 'Booking'}`,
          type: 'booking',
          status: booking.status,
          venueOrArtist: booking.venueName,
        });
      });
    }

    // Add availability markers
    if (availability && availability.length > 0) {
      availability.forEach((avail: any) => {
        const availDate = new Date(avail.date);
        const dateStr = availDate.toISOString().split('T')[0];
        
        // Only add if not already a booking
        if (!calendarEvents.find(e => e.date === dateStr)) {
          calendarEvents.push({
            id: eventId++,
            date: dateStr,
            title: avail.status === 'available' ? 'Available for bookings' : 'Unavailable',
            type: avail.status as 'available' | 'unavailable',
            status: avail.status,
            venueOrArtist: avail.status === 'available' ? 'Open' : 'Blocked',
          });
        }
      });
    }

    setEvents(calendarEvents);
  }, [bookings, availability]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const getEventForDate = (day: number): BookingEvent | undefined => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.find((e) => e.date === dateStr);
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "booking":
        return "bg-blue-100 text-blue-800";
      case "available":
        return "bg-green-100 text-green-800";
      case "unavailable":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" });

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <a className="inline-flex">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </a>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
              <p className="text-slate-600">Manage your availability and bookings</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={previousMonth}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <h2 className="text-xl font-semibold min-w-48 text-center">
                      {monthName}
                    </h2>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={nextMonth}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div
                      key={day}
                      className="text-center font-semibold text-slate-600 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-2">
                  {calendarDays.map((day, index) => {
                    const event = day ? getEventForDate(day) : null;
                    const isToday =
                      day &&
                      new Date().toDateString() ===
                        new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

                    return (
                      <div
                        key={index}
                        onClick={() => {
                          if (day) {
                            setSelectedDate(
                              new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                            );
                          }
                        }}
                        className={`aspect-square p-2 rounded-lg border-2 cursor-pointer transition-all ${
                          day
                            ? isToday
                              ? "border-blue-500 bg-blue-50"
                              : selectedDate?.getDate() === day &&
                                selectedDate?.getMonth() === currentDate.getMonth()
                              ? "border-slate-400 bg-slate-100"
                              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            : "border-transparent"
                        }`}
                      >
                        {day && (
                          <div className="flex flex-col h-full">
                            <span className="text-sm font-medium text-slate-900">{day}</span>
                            {event && (
                              <div className="mt-1 flex-1 flex items-center justify-center">
                                <div
                                  className={`w-2 h-2 rounded-full ${
                                    event.type === "booking"
                                      ? "bg-blue-500"
                                      : event.type === "available"
                                      ? "bg-green-500"
                                      : "bg-red-500"
                                  }`}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <p className="text-sm font-semibold text-slate-900 mb-3">Legend</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-slate-600">Booking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-slate-600">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm text-slate-600">Unavailable</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Events Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate
                    ? selectedDate.toLocaleDateString("default", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : "Select a Date"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDate && getEventForDate(selectedDate.getDate()) ? (
                  <div className="space-y-4">
                    {getEventForDate(selectedDate.getDate()) && (
                      <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-slate-900">
                            {getEventForDate(selectedDate.getDate())?.title}
                          </h3>
                          <Badge
                            className={getEventBadgeColor(
                              getEventForDate(selectedDate.getDate())?.type || ""
                            )}
                          >
                            {getEventForDate(selectedDate.getDate())?.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">
                          {getEventForDate(selectedDate.getDate())?.venueOrArtist}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            View Details
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Edit
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : selectedDate ? (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 mb-4">No events on this date</p>
                    <Button className="w-full">Add Event</Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">Select a date to view events</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {events.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-slate-900 text-sm">{event.title}</p>
                        <Badge
                          variant="outline"
                          className={getEventBadgeColor(event.type)}
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600">{event.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
