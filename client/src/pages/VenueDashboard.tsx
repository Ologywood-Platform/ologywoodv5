import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { AlertCircle, ArrowLeft, Calendar, MessageSquare, Search, Settings, Users } from 'lucide-react';

export function VenueDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Verify user is a venue
  if (user?.role !== 'venue') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">This page is only available for venue users.</p>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const venueProfile = trpc.venue.getMyProfile.useQuery();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Venue Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={() => logout()}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/browse')}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-purple-600"
            >
              <Search className="w-6 h-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Browse Artists</h3>
              <p className="text-sm text-gray-600">Find and book talent</p>
            </button>

            <button
              onClick={() => navigate('/bookings')}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-blue-600"
            >
              <Calendar className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">View Bookings</h3>
              <p className="text-sm text-gray-600">Manage your events</p>
            </button>

            <button
              onClick={() => navigate('/messages')}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-green-600"
            >
              <MessageSquare className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Messages</h3>
              <p className="text-sm text-gray-600">Communicate with artists</p>
            </button>

            <button
              onClick={() => navigate('/account')}
              className="p-4 bg-white rounded-lg shadow hover:shadow-md transition border-l-4 border-orange-600"
            >
              <Settings className="w-6 h-6 text-orange-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Settings</h3>
              <p className="text-sm text-gray-600">Manage your profile</p>
            </button>
          </div>
        </div>

        {/* Overview Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Bookings</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <Calendar className="w-10 h-10 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Saved Artists</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <Users className="w-10 h-10 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Unread Messages</p>
                <p className="text-3xl font-bold text-gray-900">0</p>
              </div>
              <MessageSquare className="w-10 h-10 text-green-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Venue Info */}
        {venueProfile.data && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Organization Name</p>
                <p className="font-semibold text-gray-900">{venueProfile.data.organizationName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact Name</p>
                <p className="font-semibold text-gray-900">{venueProfile.data.contactName || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-semibold text-gray-900">{venueProfile.data.contactPhone || 'Not set'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Location</p>
                <p className="font-semibold text-gray-900">{(venueProfile.data as any).location || 'Not set'}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
