import React, { useState, useEffect } from 'react';
import { useAuth } from '../_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Calendar, Clock, DollarSign, MessageCircle, CheckCircle, Clock4, XCircle, AlertCircle } from 'lucide-react';

interface Booking {
  id: number;
  artistName?: string;
  venueName?: string;
  eventDate: string;
  eventTime?: string;
  eventDetails?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  budget?: number;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export default function BookingStatusDashboard() {
  const { user } = useAuth();
    const [, navigate] = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    // Fetch bookings from API
    fetchBookings();
  }, [user, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // This would call the actual API endpoint
      // const response = await fetch('/api/bookings');
      // const data = await response.json();
      // setBookings(data);

      // For now, use mock data
      const mockBookings: Booking[] = [
        {
          id: 1,
          artistName: 'Jazz Quartet',
          eventDate: '2026-02-15',
          eventTime: '19:00',
          eventDetails: 'Corporate event at downtown venue',
          status: 'confirmed',
          budget: 1500,
          createdAt: '2026-02-01',
          updatedAt: '2026-02-03',
          notes: 'Confirmed with artist',
        },
        {
          id: 2,
          venueName: 'The Grand Ballroom',
          eventDate: '2026-03-01',
          eventTime: '20:00',
          eventDetails: 'Wedding reception',
          status: 'pending',
          budget: 3000,
          createdAt: '2026-02-02',
          updatedAt: '2026-02-02',
          notes: 'Awaiting venue confirmation',
        },
        {
          id: 3,
          artistName: 'DJ Pulse',
          eventDate: '2026-01-20',
          eventTime: '22:00',
          eventDetails: 'Club night',
          status: 'completed',
          budget: 800,
          createdAt: '2026-01-10',
          updatedAt: '2026-01-21',
          notes: 'Event completed successfully',
        },
      ];

      setBookings(mockBookings);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock4 className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = filter === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filter);

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booking Status</h1>
          <p className="mt-2 text-gray-600">Track and manage all your bookings in one place</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <Clock4 className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Confirmed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Cancelled</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{stats.cancelled}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-gray-400'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No bookings found</p>
              <p className="text-gray-500 mt-2">Start by browsing artists or venues to create your first booking</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.artistName || booking.venueName || 'Booking'}
                        </h3>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(booking.status)}
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(booking.status)}`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{booking.eventDetails}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 py-4 border-t border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(booking.eventDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {booking.eventTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Time</p>
                          <p className="text-sm font-medium text-gray-900">{booking.eventTime}</p>
                        </div>
                      </div>
                    )}

                    {booking.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="text-sm font-medium text-gray-900">${booking.budget}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Clock4 className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded">
                      <p className="text-xs text-gray-500 font-medium mb-1">Notes</p>
                      <p className="text-sm text-gray-700">{booking.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium">
                      <MessageCircle className="w-4 h-4" />
                      Message
                    </button>
                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
