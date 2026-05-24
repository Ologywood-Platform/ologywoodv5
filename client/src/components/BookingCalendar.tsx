import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

interface Booking {
  id: number;
  eventDate: string | Date;
  status: string;
  venueName?: string | null;
  artistName?: string | null;
  eventName?: string | null;
}

interface BookingCalendarProps {
  bookings: Booking[];
  role: 'artist' | 'venue';
}

const STATUS_COLORS: Record<string, { bg: string; dot: string; label: string }> = {
  confirmed: { bg: 'bg-green-100 dark:bg-green-900/30', dot: 'bg-green-500', label: 'Confirmed' },
  pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', dot: 'bg-yellow-500', label: 'Pending' },
  completed: { bg: 'bg-blue-100 dark:bg-blue-900/30', dot: 'bg-blue-500', label: 'Completed' },
  cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', dot: 'bg-red-400', label: 'Cancelled' },
  declined: { bg: 'bg-gray-100 dark:bg-gray-800', dot: 'bg-gray-400', label: 'Declined' },
};

export default function BookingCalendar({ bookings, role }: BookingCalendarProps) {
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const bookingsByDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    bookings.forEach((b) => {
      const dateStr = new Date(b.eventDate).toISOString().split('T')[0];
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(b);
    });
    return map;
  }, [bookings]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date().toISOString().split('T')[0];

  const days = [];
  // Empty cells for days before the 1st
  for (let i = 0; i < firstDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="h-20 sm:h-24" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayBookings = bookingsByDate[dateStr] || [];
    const isToday = dateStr === today;

    days.push(
      <div
        key={day}
        className={`h-20 sm:h-24 border border-gray-100 dark:border-gray-700 rounded-md p-1 relative overflow-hidden ${
          isToday ? 'ring-2 ring-purple-500 ring-inset' : ''
        } ${dayBookings.length > 0 ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
        onClick={() => {
          if (dayBookings.length === 1) {
            navigate(`/booking/${dayBookings[0].id}`);
          }
        }}
      >
        <span className={`text-xs font-medium ${isToday ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
          {day}
        </span>
        <div className="mt-0.5 space-y-0.5">
          {dayBookings.slice(0, 2).map((b) => {
            const status = STATUS_COLORS[b.status] || STATUS_COLORS.pending;
            const label = role === 'artist' ? (b.venueName || b.eventName || `#${b.id}`) : (b.artistName || b.eventName || `#${b.id}`);
            return (
              <div
                key={b.id}
                className={`${status.bg} rounded px-1 py-0.5 flex items-center gap-1 cursor-pointer`}
                onClick={(e) => { e.stopPropagation(); navigate(`/booking/${b.id}`); }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot} flex-shrink-0`} />
                <span className="text-[10px] sm:text-xs truncate font-medium text-gray-800 dark:text-gray-200">
                  {label}
                </span>
              </div>
            );
          })}
          {dayBookings.length > 2 && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400 pl-1">+{dayBookings.length - 2} more</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{monthName}</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goToToday} className="text-xs">
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3">
        {Object.entries(STATUS_COLORS).filter(([k]) => k !== 'declined').map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${val.dot}`} />
            <span className="text-[11px] text-gray-600 dark:text-gray-400">{val.label}</span>
          </div>
        ))}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-gray-500 dark:text-gray-400 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
}
