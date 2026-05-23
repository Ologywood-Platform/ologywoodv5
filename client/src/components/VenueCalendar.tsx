import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';

interface Booking {
  id: number;
  eventDate: string | Date;
  eventTime?: string | null;
  status: string;
  artistName?: string;
  artistPhoto?: string | null;
  eventDetails?: string | null;
  totalFee?: string | null;
  paymentStatus?: string;
}

interface VenueCalendarProps {
  bookings: Booking[];
  onDayClick?: (date: Date, bookings: Booking[]) => void;
  onBookingClick?: (booking: Booking) => void;
  onPostEvent?: (booking: Booking) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getStatusColor(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-green-500';
    case 'pending': return 'bg-yellow-500';
    case 'cancelled': return 'bg-red-400';
    case 'completed': return 'bg-blue-500';
    default: return 'bg-gray-400';
  }
}

function getStatusBorder(status: string) {
  switch (status) {
    case 'confirmed': return 'border-green-200 dark:border-green-800';
    case 'pending': return 'border-yellow-200 dark:border-yellow-800';
    case 'cancelled': return 'border-red-200 dark:border-red-800';
    case 'completed': return 'border-blue-200 dark:border-blue-800';
    default: return 'border-gray-200 dark:border-gray-700';
  }
}

function getStatusBg(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-green-50 dark:bg-green-950/30';
    case 'pending': return 'bg-yellow-50 dark:bg-yellow-950/30';
    case 'cancelled': return 'bg-red-50 dark:bg-red-950/30';
    case 'completed': return 'bg-blue-50 dark:bg-blue-950/30';
    default: return 'bg-gray-50 dark:bg-gray-800';
  }
}

export default function VenueCalendar({ bookings, onDayClick, onBookingClick, onPostEvent }: VenueCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Build a map of date -> bookings for the current month
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach(booking => {
      const d = new Date(booking.eventDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate().toString();
        if (!map[key]) map[key] = [];
        map[key].push(booking);
      }
    });
    return map;
  }, [bookings, year, month]);

  // Calendar grid calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Build calendar grid (6 rows x 7 cols max)
  const calendarDays: { day: number; isCurrentMonth: boolean; date: Date }[] = [];
  
  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    calendarDays.push({ day, isCurrentMonth: false, date: new Date(year, month - 1, day) });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
  }
  
  // Next month leading days (fill to complete the grid)
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
  }

  // Only show 5 rows if we don't need 6
  const totalRows = firstDayOfMonth + daysInMonth > 35 ? 6 : 5;
  const displayDays = calendarDays.slice(0, totalRows * 7);

  const today = new Date();
  const isToday = (date: Date) => 
    date.getDate() === today.getDate() && 
    date.getMonth() === today.getMonth() && 
    date.getFullYear() === today.getFullYear();

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Stats for the month
  const monthStats = useMemo(() => {
    const monthBookings = bookings.filter(b => {
      const d = new Date(b.eventDate);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    return {
      total: monthBookings.length,
      confirmed: monthBookings.filter(b => b.status === 'confirmed').length,
      pending: monthBookings.filter(b => b.status === 'pending').length,
      completed: monthBookings.filter(b => b.status === 'completed').length,
    };
  }, [bookings, year, month]);

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Month Stats */}
      <div className="flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
          <span className="text-gray-600 dark:text-gray-400">{monthStats.confirmed} confirmed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
          <span className="text-gray-600 dark:text-gray-400">{monthStats.pending} pending</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-400">{monthStats.completed} completed</span>
        </div>
        <div className="text-gray-500 dark:text-gray-500 ml-auto">
          {monthStats.total} total this month
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="px-1 py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {displayDays.map((cell, idx) => {
            const dayBookings = cell.isCurrentMonth ? (bookingsByDate[cell.day.toString()] || []) : [];
            const hasBookings = dayBookings.length > 0;
            const isPast = cell.date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

            return (
              <div
                key={idx}
                className={`
                  min-h-[80px] sm:min-h-[100px] p-1 border-b border-r border-gray-100 dark:border-gray-800
                  ${!cell.isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/30' : ''}
                  ${isToday(cell.date) ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''}
                  ${cell.isCurrentMonth && !isPast ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
                  transition-colors
                `}
                onClick={() => {
                  if (cell.isCurrentMonth && onDayClick) {
                    onDayClick(cell.date, dayBookings);
                  }
                }}
              >
                {/* Day number */}
                <div className={`
                  text-xs sm:text-sm font-medium mb-0.5
                  ${!cell.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                  ${isToday(cell.date) ? 'text-purple-700 dark:text-purple-300 font-bold' : 'text-gray-700 dark:text-gray-300'}
                  ${isPast && cell.isCurrentMonth ? 'text-gray-400 dark:text-gray-500' : ''}
                `}>
                  <span className={isToday(cell.date) ? 'bg-purple-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center text-xs' : ''}>
                    {cell.day}
                  </span>
                </div>

                {/* Booking indicators */}
                {hasBookings && (
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 2).map((booking) => (
                      <Tooltip key={booking.id}>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              text-[10px] sm:text-xs px-1 py-0.5 rounded truncate border
                              ${getStatusBg(booking.status)} ${getStatusBorder(booking.status)}
                              cursor-pointer hover:opacity-80 transition-opacity
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              onBookingClick?.(booking);
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(booking.status)}`}></div>
                              <span className="truncate font-medium">
                                {booking.artistName || 'Artist'}
                              </span>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[220px]">
                          <div className="text-xs space-y-1">
                            <p className="font-semibold">{booking.artistName}</p>
                            <p>{booking.eventTime || 'Time TBA'} &bull; <span className="capitalize">{booking.status}</span></p>
                            {booking.totalFee && <p className="text-green-600">${booking.totalFee}</p>}
                            {booking.status === 'confirmed' && onPostEvent && (
                              <button
                                className="flex items-center gap-1 mt-1 text-purple-600 hover:text-purple-800 font-medium"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPostEvent(booking);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                                Post Event
                              </button>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 px-1">
                        +{dayBookings.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span>Click any date to view details or create a booking</span>
        </div>
      </div>
    </div>
  );
}
