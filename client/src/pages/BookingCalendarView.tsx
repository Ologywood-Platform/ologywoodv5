import React, { useState, useMemo } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, User } from 'lucide-react';

interface CalendarBooking {
  id: number;
  title: string;
  date: string;
  time: string;
  type: 'booked' | 'available' | 'unavailable';
  details?: string;
  location?: string;
  contact?: string;
}

export default function BookingCalendarView() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 3)); // February 3, 2026
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  if (!user) {
    navigate('/');
    return null;
  }

  // Mock booking data
  const bookings: CalendarBooking[] = [
    {
      id: 1,
      title: 'Corporate Event - Jazz Quartet',
      date: '2026-02-15',
      time: '19:00',
      type: 'booked',
      details: 'Downtown venue',
      location: 'The Grand Ballroom',
      contact: 'John Smith',
    },
    {
      id: 2,
      title: 'Wedding Reception',
      date: '2026-03-01',
      time: '20:00',
      type: 'booked',
      details: 'Wedding reception',
      location: 'Riverside Manor',
      contact: 'Sarah Johnson',
    },
    {
      id: 3,
      title: 'Available',
      date: '2026-02-08',
      time: '18:00',
      type: 'available',
    },
    {
      id: 4,
      title: 'Unavailable',
      date: '2026-02-10',
      time: '00:00',
      type: 'unavailable',
    },
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getBookingForDate = (date: string) => {
    return bookings.find(b => b.date === date);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = [];

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'booked':
        return 'bg-purple-100 border-purple-300 text-purple-900';
      case 'available':
        return 'bg-green-100 border-green-300 text-green-900';
      case 'unavailable':
        return 'bg-gray-100 border-gray-300 text-gray-900';
      default:
        return 'bg-gray-50';
    }
  };

  const getStatusBadge = (type: string) => {
    switch (type) {
      case 'booked':
        return 'Booked';
      case 'available':
        return 'Available';
      case 'unavailable':
        return 'Unavailable';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Calendar</h1>
          <p className="mt-2 text-gray-600">View and manage your bookings and availability</p>
        </div>

        {/* Calendar Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 min-w-[200px] text-center">{monthName}</h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'month'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'week'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Week
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded" />
              <span className="text-sm text-gray-700">Booked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded" />
              <span className="text-sm text-gray-700">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded" />
              <span className="text-sm text-gray-700">Unavailable</span>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-0 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-4 text-center font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-0">
            {days.map((day, index) => {
              const dateStr = day
                ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                : null;
              const booking = dateStr ? getBookingForDate(dateStr) : null;

              return (
                <div
                  key={index}
                  className={`min-h-24 p-2 border-r border-b border-gray-200 last:border-r-0 ${
                    day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } cursor-pointer transition-colors`}
                >
                  {day && (
                    <div>
                      <p className="font-semibold text-gray-900 mb-1">{day}</p>
                      {booking && (
                        <div className={`p-2 rounded text-xs border ${getStatusColor(booking.type)}`}>
                          <p className="font-semibold truncate">{booking.title}</p>
                          {booking.time && <p className="text-xs opacity-75">{booking.time}</p>}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {bookings
              .filter(b => b.type === 'booked')
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map(booking => (
                <div key={booking.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{booking.title}</h3>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        </div>
                        {booking.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {booking.location}
                          </div>
                        )}
                        {booking.contact && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            {booking.contact}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium">
                        View Details
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                        Message
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {bookings.filter(b => b.type === 'booked').length === 0 && (
            <div className="px-6 py-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No upcoming bookings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
