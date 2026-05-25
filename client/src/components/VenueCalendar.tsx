import { useState, useMemo, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Ban, X, GripHorizontal, Download, LayoutGrid, List } from 'lucide-react';
import { Button } from './ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { trpc } from '../lib/trpc';
import { toast } from 'sonner';

interface Booking {
  id: number;
  eventDate: string | Date;
  eventTime?: string | null;
  status: string;
  artistName?: string;
  artistId?: number;
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
  onCreateBooking?: (startDate: string, endDate?: string) => void;
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const TIME_SLOTS = ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM', '9 PM', '10 PM', '11 PM'];

type ViewMode = 'month' | 'week';

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

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function parseTimeToHour(timeStr: string | null | undefined): number | null {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s*(am|pm|AM|PM)?/);
  if (!match) return null;
  let hour = parseInt(match[1]);
  const ampm = match[3]?.toLowerCase();
  if (ampm === 'pm' && hour < 12) hour += 12;
  if (ampm === 'am' && hour === 12) hour = 0;
  return hour;
}

function generateICS(bookings: Booking[], venueName?: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ologywood//Venue Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  bookings.forEach(booking => {
    const eventDate = new Date(booking.eventDate);
    const dateStr = formatDateStr(eventDate).replace(/-/g, '');
    const summary = `${booking.artistName || 'Booking'} - ${booking.eventDetails || 'Event'}`;
    const uid = `booking-${booking.id}@ologywood.com`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART;VALUE=DATE:${dateStr}`);
    lines.push(`DTEND;VALUE=DATE:${dateStr}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DESCRIPTION:Status: ${booking.status}${booking.totalFee ? ` | Fee: $${booking.totalFee}` : ''}`);
    if (venueName) lines.push(`LOCATION:${venueName}`);
    lines.push(`STATUS:${booking.status === 'confirmed' ? 'CONFIRMED' : booking.status === 'cancelled' ? 'CANCELLED' : 'TENTATIVE'}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export default function VenueCalendar({ bookings, onDayClick, onBookingClick, onPostEvent, onCreateBooking }: VenueCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [popoverDate, setPopoverDate] = useState<Date | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockInput, setShowBlockInput] = useState(false);
  const dragRef = useRef(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch blocked dates for this venue
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
  const { data: blockedDates, refetch: refetchBlocked } = trpc.venue.getBlockedDates.useQuery(
    { startDate, endDate },
    { staleTime: 60_000 }
  );
  const blockMutation = trpc.venue.blockDates.useMutation({
    onSuccess: () => { refetchBlocked(); toast.success('Dates blocked'); },
    onError: (err: any) => toast.error(err.message),
  });
  const unblockMutation = trpc.venue.unblockDates.useMutation({
    onSuccess: () => { refetchBlocked(); toast.success('Dates unblocked'); },
    onError: (err: any) => toast.error(err.message),
  });

  const blockedSet = useMemo(() => {
    const set = new Set<string>();
    blockedDates?.forEach((bd: any) => set.add(bd.date));
    return set;
  }, [blockedDates]);

  // Build a map of date -> bookings for the current month
  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach(booking => {
      const d = new Date(booking.eventDate);
      const key = formatDateStr(d);
      if (!map[key]) map[key] = [];
      map[key].push(booking);
    });
    return map;
  }, [bookings]);

  // Calendar grid calculation for month view
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays: { day: number; isCurrentMonth: boolean; date: Date }[] = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    calendarDays.push({ day, isCurrentMonth: false, date: new Date(year, month - 1, day) });
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({ day: i, isCurrentMonth: true, date: new Date(year, month, i) });
  }
  const remaining = 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    calendarDays.push({ day: i, isCurrentMonth: false, date: new Date(year, month + 1, i) });
  }

  const totalRows = firstDayOfMonth + daysInMonth > 35 ? 6 : 5;
  const displayDays = calendarDays.slice(0, totalRows * 7);

  // Week view calculation
  const weekStart = getWeekStart(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const today = new Date();
  const isToday = (date: Date) =>
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToPrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };
  const goToNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };
  const goToToday = () => setCurrentDate(new Date());

  // Drag selection helpers
  const isInDragRange = useCallback((date: Date) => {
    if (!dragStart || !dragEnd) return false;
    const start = dragStart < dragEnd ? dragStart : dragEnd;
    const end = dragStart < dragEnd ? dragEnd : dragStart;
    return date >= start && date <= end;
  }, [dragStart, dragEnd]);

  const handleMouseDown = (date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth && viewMode === 'month') return;
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (isPast) return;
    dragRef.current = true;
    setIsDragging(true);
    setDragStart(date);
    setDragEnd(date);
  };

  const handleMouseEnter = (date: Date, isCurrentMonth: boolean) => {
    if (!dragRef.current) return;
    if (!isCurrentMonth && viewMode === 'month') return;
    setDragEnd(date);
  };

  const handleMouseUp = () => {
    if (!dragRef.current) return;
    dragRef.current = false;
    setIsDragging(false);

    if (dragStart && dragEnd) {
      const start = dragStart < dragEnd ? dragStart : dragEnd;
      const end = dragStart < dragEnd ? dragEnd : dragStart;

      if (start.getTime() === end.getTime()) {
        setPopoverDate(start);
        setPopoverOpen(true);
      } else {
        setPopoverDate(start);
        setPopoverOpen(true);
      }
    }
  };

  const handleCreateBooking = () => {
    if (!dragStart || !dragEnd) return;
    const start = dragStart < dragEnd ? dragStart : dragEnd;
    const end = dragStart < dragEnd ? dragEnd : dragStart;
    const startStr = formatDateStr(start);
    const endStr = start.getTime() !== end.getTime() ? formatDateStr(end) : undefined;
    if (onCreateBooking) {
      onCreateBooking(startStr, endStr);
    }
    setPopoverOpen(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const handleBlockSelected = () => {
    if (!dragStart || !dragEnd) return;
    const start = dragStart < dragEnd ? dragStart : dragEnd;
    const end = dragStart < dragEnd ? dragEnd : dragStart;
    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(formatDateStr(current));
      current.setDate(current.getDate() + 1);
    }
    blockMutation.mutate({ dates, reason: blockReason || undefined });
    setPopoverOpen(false);
    setDragStart(null);
    setDragEnd(null);
    setBlockReason('');
    setShowBlockInput(false);
  };

  const handleUnblockDate = (dateStr: string) => {
    unblockMutation.mutate({ dates: [dateStr] });
  };

  // Export to iCal
  const handleExportICal = () => {
    const activeBookings = bookings.filter(b => b.status !== 'cancelled');
    if (activeBookings.length === 0) {
      toast.error('No bookings to export');
      return;
    }
    const icsContent = generateICS(activeBookings);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ologywood-bookings-${formatDateStr(new Date())}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Calendar exported! Import the .ics file into Google Calendar, Apple Calendar, or Outlook.');
  };

  // Export to Google Calendar (opens URL)
  const handleExportGoogle = () => {
    const activeBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
    if (activeBookings.length === 0) {
      toast.error('No active bookings to export');
      return;
    }
    // Export the next upcoming booking to Google Calendar
    const upcoming = activeBookings
      .filter(b => new Date(b.eventDate) >= today)
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());
    
    if (upcoming.length === 0) {
      toast.error('No upcoming bookings to export');
      return;
    }

    const booking = upcoming[0];
    const eventDate = new Date(booking.eventDate);
    const dateStr = formatDateStr(eventDate).replace(/-/g, '');
    const title = encodeURIComponent(`${booking.artistName || 'Booking'} - ${booking.eventDetails || 'Event'}`);
    const details = encodeURIComponent(`Status: ${booking.status}${booking.totalFee ? ` | Fee: $${booking.totalFee}` : ''}\n\nManaged on Ologywood`);
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dateStr}/${dateStr}&details=${details}`;
    window.open(googleUrl, '_blank');
    toast.success('Opening Google Calendar...');
  };

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

  // Get popover bookings
  const popoverBookings = popoverDate ? (bookingsByDate[formatDateStr(popoverDate)] || []) : [];
  const popoverDateStr = popoverDate ? formatDateStr(popoverDate) : '';
  const isPopoverBlocked = blockedSet.has(popoverDateStr);
  const isMultiDaySelection = dragStart && dragEnd && dragStart.getTime() !== dragEnd.getTime();

  return (
    <div className="space-y-4" onMouseUp={handleMouseUp} onMouseLeave={() => { if (dragRef.current) { dragRef.current = false; setIsDragging(false); setDragStart(null); setDragEnd(null); } }}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {viewMode === 'month' ? `${MONTHS[month]} ${year}` : (
              `${weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
            )}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday} className="text-xs">
            Today
          </Button>
        </div>
        <div className="flex items-center gap-1">
          {/* View Toggle */}
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg mr-2 overflow-hidden">
            <button
              className={`px-2.5 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === 'month' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onClick={() => setViewMode('month')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Month
            </button>
            <button
              className={`px-2.5 py-1.5 text-xs font-medium flex items-center gap-1 transition-colors ${viewMode === 'week' ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              onClick={() => setViewMode('week')}
            >
              <List className="h-3.5 w-3.5" />
              Week
            </button>
          </div>

          {/* Export Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleExportICal}>
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export to iCal / Google Calendar</TooltipContent>
          </Tooltip>

          {/* Navigation */}
          <Button variant="ghost" size="sm" onClick={viewMode === 'month' ? goToPrevMonth : goToPrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={viewMode === 'month' ? goToNextMonth : goToNextWeek}>
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
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-300 dark:bg-red-700"></div>
          <span className="text-gray-600 dark:text-gray-400">{blockedDates?.length || 0} blocked</span>
        </div>
        <div className="text-gray-500 dark:text-gray-500 ml-auto">
          {monthStats.total} total this month
        </div>
      </div>

      {/* MONTH VIEW */}
      {viewMode === 'month' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden select-none">
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
              const dateStr = formatDateStr(cell.date);
              const dayBookings = bookingsByDate[dateStr] || [];
              const hasBookings = dayBookings.length > 0;
              const isPast = cell.date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const isBlocked = blockedSet.has(dateStr);
              const inDragRange = isInDragRange(cell.date) && cell.isCurrentMonth;

              return (
                <div
                  key={idx}
                  className={`
                    min-h-[80px] sm:min-h-[100px] p-1 border-b border-r border-gray-100 dark:border-gray-800
                    ${!cell.isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-900/30' : ''}
                    ${isToday(cell.date) ? 'bg-purple-50/50 dark:bg-purple-950/20' : ''}
                    ${isBlocked ? 'bg-red-50/60 dark:bg-red-950/20' : ''}
                    ${inDragRange ? 'bg-purple-100 dark:bg-purple-900/40 ring-1 ring-inset ring-purple-300 dark:ring-purple-700' : ''}
                    ${cell.isCurrentMonth && !isPast ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
                    transition-colors
                  `}
                  onMouseDown={() => handleMouseDown(cell.date, cell.isCurrentMonth)}
                  onMouseEnter={() => handleMouseEnter(cell.date, cell.isCurrentMonth)}
                >
                  {/* Day number */}
                  <div className={`
                    text-xs sm:text-sm font-medium mb-0.5 flex items-center justify-between
                    ${!cell.isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : ''}
                    ${isToday(cell.date) ? 'text-purple-700 dark:text-purple-300 font-bold' : 'text-gray-700 dark:text-gray-300'}
                    ${isPast && cell.isCurrentMonth ? 'text-gray-400 dark:text-gray-500' : ''}
                  `}>
                    <span className={isToday(cell.date) ? 'bg-purple-600 text-white rounded-full w-6 h-6 inline-flex items-center justify-center text-xs' : ''}>
                      {cell.day}
                    </span>
                    {isBlocked && cell.isCurrentMonth && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="text-red-400 hover:text-red-600 transition-colors"
                            onClick={(e) => { e.stopPropagation(); handleUnblockDate(dateStr); }}
                          >
                            <Ban className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Click to unblock this date</TooltipContent>
                      </Tooltip>
                    )}
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
      )}

      {/* WEEK VIEW */}
      {viewMode === 'week' && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden select-none">
          {/* Day headers */}
          <div className="grid grid-cols-8 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="px-2 py-2 text-center text-xs font-semibold text-gray-400 dark:text-gray-500 border-r border-gray-200 dark:border-gray-700">
              Time
            </div>
            {weekDays.map((day, idx) => {
              const dateStr = formatDateStr(day);
              const isBlockedDay = blockedSet.has(dateStr);
              return (
                <div key={idx} className={`px-1 py-2 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${isToday(day) ? 'bg-purple-50 dark:bg-purple-950/20' : ''}`}>
                  <div className={`text-xs font-semibold uppercase ${isToday(day) ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400'}`}>
                    {DAYS_OF_WEEK[idx]}
                  </div>
                  <div className={`text-sm font-bold ${isToday(day) ? 'text-purple-700 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
                    {day.getDate()}
                  </div>
                  {isBlockedDay && (
                    <div className="text-[9px] text-red-500 font-medium mt-0.5">BLOCKED</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time slot rows */}
          <div className="max-h-[480px] overflow-y-auto">
            {TIME_SLOTS.map((timeLabel, timeIdx) => {
              const hour = timeIdx + 9; // 9 AM start
              return (
                <div key={timeLabel} className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-800 last:border-b-0">
                  {/* Time label */}
                  <div className="px-2 py-3 text-xs text-gray-400 dark:text-gray-500 text-right pr-3 border-r border-gray-200 dark:border-gray-700 font-medium">
                    {timeLabel}
                  </div>
                  {/* Day columns */}
                  {weekDays.map((day, dayIdx) => {
                    const dateStr = formatDateStr(day);
                    const dayBookings = bookingsByDate[dateStr] || [];
                    const slotBookings = dayBookings.filter(b => {
                      const bookingHour = parseTimeToHour(b.eventTime);
                      return bookingHour === hour;
                    });
                    const isBlockedDay = blockedSet.has(dateStr);
                    const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());

                    return (
                      <div
                        key={dayIdx}
                        className={`
                          px-0.5 py-1 border-r border-gray-100 dark:border-gray-800 last:border-r-0 min-h-[44px]
                          ${isBlockedDay ? 'bg-red-50/40 dark:bg-red-950/10' : ''}
                          ${isToday(day) ? 'bg-purple-50/30 dark:bg-purple-950/10' : ''}
                          ${!isPast && !isBlockedDay ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/30' : ''}
                          transition-colors
                        `}
                        onClick={() => {
                          if (!isPast && !isBlockedDay) {
                            setDragStart(day);
                            setDragEnd(day);
                            setPopoverDate(day);
                            setPopoverOpen(true);
                          }
                        }}
                      >
                        {slotBookings.map(booking => (
                          <div
                            key={booking.id}
                            className={`
                              text-[10px] px-1.5 py-1 rounded border mb-0.5
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
                              <span className="truncate font-medium">{booking.artistName || 'Artist'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* All-day / unscheduled bookings row */}
          {(() => {
            const weekBookingsWithoutTime = weekDays.map(day => {
              const dateStr = formatDateStr(day);
              const dayBookings = bookingsByDate[dateStr] || [];
              return dayBookings.filter(b => !parseTimeToHour(b.eventTime));
            });
            const hasAny = weekBookingsWithoutTime.some(arr => arr.length > 0);
            if (!hasAny) return null;
            return (
              <div className="grid grid-cols-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
                <div className="px-2 py-2 text-xs text-gray-400 dark:text-gray-500 text-right pr-3 border-r border-gray-200 dark:border-gray-700 font-medium">
                  All Day
                </div>
                {weekBookingsWithoutTime.map((dayBookings, dayIdx) => (
                  <div key={dayIdx} className="px-0.5 py-1 border-r border-gray-100 dark:border-gray-800 last:border-r-0">
                    {dayBookings.slice(0, 3).map(booking => (
                      <div
                        key={booking.id}
                        className={`
                          text-[10px] px-1.5 py-0.5 rounded border mb-0.5
                          ${getStatusBg(booking.status)} ${getStatusBorder(booking.status)}
                          cursor-pointer hover:opacity-80
                        `}
                        onClick={() => onBookingClick?.(booking)}
                      >
                        <span className="truncate font-medium">{booking.artistName || 'Artist'}</span>
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[9px] text-gray-500 px-1">+{dayBookings.length - 3} more</div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Day Popover */}
      {popoverOpen && popoverDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={() => { setPopoverOpen(false); setDragStart(null); setDragEnd(null); setShowBlockInput(false); }}>
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-[320px] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {isMultiDaySelection ? (
                  <>
                    {formatDateStr(dragStart! < dragEnd! ? dragStart! : dragEnd!)} → {formatDateStr(dragStart! < dragEnd! ? dragEnd! : dragStart!)}
                  </>
                ) : (
                  popoverDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                )}
              </h3>
              <button onClick={() => { setPopoverOpen(false); setDragStart(null); setDragEnd(null); setShowBlockInput(false); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Show existing bookings for single day */}
            {!isMultiDaySelection && popoverBookings.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs text-gray-500 font-medium uppercase">Bookings on this day</p>
                {popoverBookings.map(b => (
                  <button
                    key={b.id}
                    className={`w-full text-left px-3 py-2 rounded-lg border ${getStatusBg(b.status)} ${getStatusBorder(b.status)} hover:opacity-80 transition-opacity`}
                    onClick={() => { onBookingClick?.(b); setPopoverOpen(false); }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(b.status)}`}></div>
                      <span className="text-sm font-medium">{b.artistName || 'Artist'}</span>
                      <span className="text-xs text-gray-500 ml-auto capitalize">{b.status}</span>
                    </div>
                    {b.eventTime && <p className="text-xs text-gray-500 mt-0.5 ml-4">{b.eventTime}</p>}
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Button
                className="w-full justify-start gap-2"
                variant="outline"
                onClick={handleCreateBooking}
              >
                <Plus className="h-4 w-4 text-purple-600" />
                {isMultiDaySelection ? 'Create Multi-Day Booking' : 'Create New Booking'}
              </Button>

              {!showBlockInput ? (
                <Button
                  className="w-full justify-start gap-2"
                  variant="outline"
                  onClick={() => {
                    if (isPopoverBlocked && !isMultiDaySelection) {
                      handleUnblockDate(popoverDateStr);
                      setPopoverOpen(false);
                    } else {
                      setShowBlockInput(true);
                    }
                  }}
                >
                  <Ban className="h-4 w-4 text-red-500" />
                  {isPopoverBlocked && !isMultiDaySelection ? 'Unblock Date' : (isMultiDaySelection ? 'Block Selected Dates' : 'Block This Date')}
                </Button>
              ) : (
                <div className="space-y-2 border border-red-200 dark:border-red-800 rounded-lg p-3 bg-red-50/50 dark:bg-red-950/20">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300">Block reason (optional)</p>
                  <input
                    type="text"
                    placeholder="e.g., Private event, Maintenance..."
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full text-sm px-3 py-1.5 rounded border border-red-200 dark:border-red-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" className="flex-1" onClick={handleBlockSelected}>
                      Confirm Block
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setShowBlockInput(false); setBlockReason(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Export options */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 mt-2">
                <div className="flex gap-2">
                  <Button
                    className="flex-1 justify-center gap-1.5 text-xs"
                    variant="ghost"
                    size="sm"
                    onClick={handleExportICal}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export iCal
                  </Button>
                  <Button
                    className="flex-1 justify-center gap-1.5 text-xs"
                    variant="ghost"
                    size="sm"
                    onClick={handleExportGoogle}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    Google Cal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
        <div className="flex items-center gap-1.5">
          <GripHorizontal className="h-3.5 w-3.5" />
          <span>{viewMode === 'month' ? 'Click a date for options, or drag across dates for multi-day actions' : 'Click a time slot to create a booking'}</span>
        </div>
      </div>
    </div>
  );
}
