import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';

export function ArtistDashboardV3() {
  const [, navigate] = useLocation();
  const [activeSection, setActiveSection] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const { data: artistProfile } = trpc.artist.getMyProfile.useQuery();
  const { data: bookings } = trpc.booking.getMyArtistBookings.useQuery();

  // Navigation sections with logical grouping
  const navigationSections = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      description: 'Dashboard & quick stats',
      action: () => setActiveSection('overview'),
    },
    {
      id: 'bookings',
      label: 'Bookings',
      icon: Calendar,
      description: 'Manage bookings & events',
      action: () => navigate('/bookings'),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: Music,
      description: 'Edit profile & media',
      action: () => navigate('/onboarding/artist'),
    },
    {
      id: 'availability',
      label: 'Availability',
      icon: Clock,
      description: 'Manage your availability',
      action: () => navigate('/availability'),
    },
    {
      id: 'riders',
      label: 'Riders',
      icon: FileText,
      description: 'Performance riders',
      action: () => navigate('/riders'),
    },
    {
      id: 'communication',
      label: 'Communication',
      icon: MessageSquare,
      description: 'Messages & notifications',
      action: () => navigate('/messages'),
    },
    {
      id: 'account',
      label: 'Account',
      icon: Settings,
      description: 'Settings & support',
      action: () => navigate('/dashboard'),
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
              <p className="text-sm text-slate-600">{artistProfile?.stageName || 'Artist'}</p>
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
                      section.action();
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
                        Artist Rating
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
                      onClick={() => navigate('/bookings')}
                    >
                      View Bookings
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/onboarding/artist')}
                    >
                      Edit Profile
                    </Button>
                    {user?.role === 'artist' && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate('/availability')}
                      >
                        Availability
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/messages')}
                    >
                      Messages
                    </Button>
                  </CardContent>
                </Card>
              </div>
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

            {activeSection === 'profile' && (
              <Card>
                <CardHeader>
                  <CardTitle>Artist Profile</CardTitle>
                  <CardDescription>
                    Edit your profile information and media
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-600">
                    <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Profile editing interface</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'availability' && (
              <Card>
                <CardHeader>
                  <CardTitle>Availability</CardTitle>
                  <CardDescription>
                    Manage your availability and calendar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-slate-600">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Availability management interface</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {activeSection === 'riders' && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Riders</CardTitle>
                  <CardDescription>
                    Manage your performance requirements and riders
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

export default ArtistDashboardV3;
