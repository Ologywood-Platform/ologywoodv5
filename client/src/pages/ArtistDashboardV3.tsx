import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Settings,
  Music,
  MessageSquare,
  Bell,
  Headphones,
  TrendingUp,
  Heart,
  FileText,
  ArrowLeft,
  Menu,
  X,
  BarChart3,
  Clock,
  Image,
  Star,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { useNavigate } from 'react-router-dom';

export function ArtistDashboardV3() {
  const navigate = useNavigate();
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

  const { data: artistProfile } = trpc.artist.getMyProfile.useQuery();
  const { data: bookings } = trpc.booking.getMyArtistBookings.useQuery();

  // Navigation sections with logical grouping
  const navigationSections = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'Dashboard & quick stats',
    },
    {
      id: 'booking',
      label: 'Bookings',
      icon: Calendar,
      description: 'Manage bookings & requests',
      subsections: ['bookings', 'calendar-sync'],
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: Settings,
      description: 'Edit profile & media',
      subsections: ['profile', 'photos', 'availability'],
    },
    {
      id: 'riders',
      label: 'Riders',
      icon: FileText,
      description: 'Manage performance riders',
      subsections: ['riders', 'rider-analytics'],
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Star,
      description: 'Reviews & analytics',
      subsections: ['reviews', 'analytics'],
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: MessageSquare,
      description: 'Messages & notifications',
      subsections: ['messages', 'notifications'],
    },
    {
      id: 'account',
      label: 'Account',
      icon: Settings,
      description: 'Settings & support',
      subsections: ['subscription', 'support', 'help'],
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
              <h1 className="text-2xl font-bold text-slate-900">Artist Dashboard</h1>
              <p className="text-sm text-slate-600">{user?.name || 'Artist'}</p>
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
                        {artistProfile?.profileCompletionScore || 0}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Average Rating
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {artistProfile?.averageRating?.toFixed(1) || 'N/A'}
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
                      onClick={() => setActiveSection('profile')}
                    >
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveSection('booking')}
                    >
                      View Bookings
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveSection('riders')}
                    >
                      Manage Riders
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

            {activeSection === 'booking' && (
              <Card>
                <CardHeader>
                  <CardTitle>Bookings & Calendar</CardTitle>
                  <CardDescription>
                    Manage your bookings and sync with calendar
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

            {activeSection === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Profile & Media</CardTitle>
                  <CardDescription>
                    Edit your profile, upload photos, and manage availability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-600">
                    <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Profile editing interface</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'riders' && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Riders</CardTitle>
                  <CardDescription>
                    Manage your rider templates and analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-600">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Rider management interface</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'performance' && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance & Reviews</CardTitle>
                  <CardDescription>
                    View your reviews and performance analytics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-600">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Performance analytics interface</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'communication' && (
              <Card>
                <CardHeader>
                  <CardTitle>Messages & Notifications</CardTitle>
                  <CardDescription>
                    Stay connected with venues and manage alerts
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
