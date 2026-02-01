import { useState } from 'react';

interface CalendarEvent {
  id: number;
  date: Date;
  title: string;
  type: 'available' | 'booked' | 'pending';
  details?: string;
}

export default function BookingCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events] = useState<CalendarEvent[]>([
    {
      id: 1,
      date: new Date(2026, 1, 5),
      title: 'Available',
      type: 'available',
    },
    {
      id: 2,
      date: new Date(2026, 1, 10),
      title: 'Booked - Jazz Night',
      type: 'booked',
      details: 'The Blue Room - 8:00 PM',
    },
    {
      id: 3,
      date: new Date(2026, 1, 15),
      title: 'Pending Request',
      type: 'pending',
      details: 'Downtown Club - Waiting for confirmation',
    },
  ]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(
      event =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear()
    );
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const typeColors = {
    available: '#10b981',
    booked: '#ef4444',
    pending: '#f59e0b',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Booking Calendar</h1>
        <p className="text-slate-600 mb-8">View and manage your availability and bookings</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-8">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={handlePrevMonth}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition"
              >
                ← Previous
              </button>
              <h2 className="text-2xl font-bold text-slate-900">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <button
                onClick={handleNextMonth}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-semibold transition"
              >
                Next →
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center font-bold text-slate-600 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((date, index) => {
                const dayEvents = date ? getEventsForDate(date) : [];
                const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();

                return (
                  <div
                    key={index}
                    onClick={() => date && setSelectedDate(date)}
                    className={`p-3 rounded-lg cursor-pointer transition ${
                      date
                        ? isSelected
                          ? 'bg-blue-500 text-white'
                          : dayEvents.length > 0
                          ? 'bg-slate-100 hover:bg-slate-200'
                          : 'bg-slate-50 hover:bg-slate-100'
                        : 'bg-transparent'
                    }`}
                  >
                    {date && (
                      <>
                        <div className="font-semibold text-sm mb-1">{date.getDate()}</div>
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className="text-xs px-2 py-1 rounded mb-1"
                            style={{
                              background: typeColors[event.type],
                              color: 'white',
                            }}
                          >
                            {event.type === 'available' ? '✓' : event.type === 'booked' ? '✗' : '?'}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Event Details</h3>

            {selectedDate ? (
              <>
                <p className="text-slate-600 mb-6">
                  {selectedDate.toLocaleDateString('default', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>

                {getEventsForDate(selectedDate).length > 0 ? (
                  <div className="space-y-4">
                    {getEventsForDate(selectedDate).map(event => (
                      <div
                        key={event.id}
                        className="p-4 rounded-lg border-l-4"
                        style={{
                          borderColor: typeColors[event.type],
                          background: `${typeColors[event.type]}10`,
                        }}
                      >
                        <h4 className="font-semibold text-slate-900 mb-2">{event.title}</h4>
                        {event.details && <p className="text-sm text-slate-600">{event.details}</p>}
                        <div className="mt-3 flex gap-2">
                          <button className="flex-1 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-semibold transition">
                            View Details
                          </button>
                          {event.type === 'pending' && (
                            <button className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-semibold transition">
                              Confirm
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500 mb-4">No events scheduled</p>
                    <button className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold transition">
                      Mark as Available
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-500 text-center py-8">Select a date to view details</p>
            )}

            {/* Legend */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-4">Legend</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: typeColors.available }}></div>
                  <span className="text-sm text-slate-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: typeColors.booked }}></div>
                  <span className="text-sm text-slate-600">Booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ background: typeColors.pending }}></div>
                  <span className="text-sm text-slate-600">Pending Request</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
