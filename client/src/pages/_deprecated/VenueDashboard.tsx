import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  Settings,
  Search,
  MessageSquare,
  Heart,
  ArrowLeft,
  Menu,
  X,
  BarChart3,
  Music,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';

export function VenueDashboard() {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['auth.me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Failed to fetch user');
      return response.json();
    },
  });

  const { data: venueProfile } = trpc.venue.getMyProfile.useQuery();
  const { data: bookings } = trpc.booking.getMyVenueBookings.useQuery();

  // Navigation sections with logical grouping for venues
  const navigationSections = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'Dashboard & quick stats',
    },
    {
      id: 'discover',
      label: 'Discover',
      icon: Search,
      description: 'Browse & find artists',
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Calendar,
      description: 'Manage bookings & events',
    },
    {
      id: 'saved',
      label: 'Saved Artists',
      icon: Heart,
      description: 'Your favorite artists',
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: Music,
      description: 'Edit venue info & media',
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: MessageSquare,
      description: 'Messages & notifications',
    },
    {
      id: 'account',
      label: 'Account',
      icon: Settings,
      description: 'Settings & support',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Venue Dashboard</h1>
              <p className="text-sm text-slate-600">{user?.name || 'Venue'}</p>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside
            className={`md:col-span-1 ${
              mobileMenuOpen ? 'block' : 'hidden md:block'
            }`}
          >
            <div className="space-y-2 sticky top-24">
              {navigationSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-start gap-3 ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white text-slate-900 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-semibold text-sm">{section.label}</div>
                      <div
                        className={`text-xs ${
                          isActive
                            ? 'text-white/80'
                            : 'text-slate-600'
                        }`}
                      >
                        {section.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Total Bookings
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {bookings?.length || 0}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Profile Completion
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {venueProfile?.profileCompletionScore || 0}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Venue Rating
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {venueProfile?.averageRating?.toFixed(1) || 'N/A'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveSection('discover')}
                    >
                      Find Artists
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveSection('bookings')}
                    >
                      View Bookings
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveSection('profile')}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveSection('communication')}
                    >
                      Messages
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeSection === 'discover' && (
              <Card>
                <CardHeader>
                  <CardTitle>Discover Artists</CardTitle>
                  <CardDescription>
                    Browse and search for artists to book
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-600">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Artist discovery interface</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'bookings' && (
              <Card>
                <CardHeader>
                  <CardTitle>Bookings & Events</CardTitle>
                  <CardDescription>
                    Manage your event bookings and calendar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-600">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Booking management interface</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'saved' && (
              <Card>
                <CardHeader>
                  <CardTitle>Saved Artists</CardTitle>
                  <CardDescription>
                    Your favorite artists and bookmarks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-600">
                    <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Saved artists interface</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Venue Profile</CardTitle>
                  <CardDescription>
                    Edit your venue information and media
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-600">
                    <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Venue profile editing interface</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'communication' && (
              <Card>
                <CardHeader>
                  <CardTitle>Messages & Notifications</CardTitle>
                  <CardDescription>
                    Stay connected with artists and manage alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-600">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Communication interface</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'account' && (
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage subscription, support, and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-600">
                    <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Account settings interface</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default VenueDashboard;
