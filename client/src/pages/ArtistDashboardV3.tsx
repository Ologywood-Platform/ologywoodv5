import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, MessageSquare, Music, Settings, Star, Clock } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { AccountSettings } from '@/components/AccountSettings';

export function ArtistDashboardV3() {
  const [, navigate] = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();

  const { data: artistProfile } = trpc.artist.getMyProfile.useQuery();
  const { data: bookings } = trpc.booking.getMyArtistBookings.useQuery();
  const { data: messages } = trpc.message.getMyMessages.useQuery({ limit: 3 });

  // Verify user is an artist
  if (user?.role !== 'artist') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>This dashboard is only for artists.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const upcomingBookings = bookings?.filter(b => new Date(b.eventDate) > new Date()) || [];
  const completionScore = artistProfile?.profileCompletionScore || 0;

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
              <p className="text-sm text-slate-600">{artistProfile?.stageName || 'Welcome'}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {showSettings ? (
          <AccountSettings />
        ) : (
          <div className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    {artistProfile?.profilePhotoUrl && (
                      <img
                        src={artistProfile.profilePhotoUrl}
                        alt={artistProfile.stageName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <CardTitle className="text-2xl">{artistProfile?.stageName || 'Artist'}</CardTitle>
                      <CardDescription>{artistProfile?.genre || 'Genre not specified'}</CardDescription>
                      {artistProfile?.averageRating && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">{artistProfile.averageRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-600">Profile Completion</span>
                    <span className="text-sm font-bold">{completionScore}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${completionScore}%` }}
                    />
                  </div>
                  {completionScore < 100 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/onboarding/artist')}
                      className="mt-4 w-full"
                    >
                      Complete Your Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/bookings')}
                  >
                    <Calendar className="h-5 w-5" />
                    <span className="text-xs">Bookings</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/availability')}
                  >
                    <Clock className="h-5 w-5" />
                    <span className="text-xs">Availability</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/riders')}
                  >
                    <Music className="h-5 w-5" />
                    <span className="text-xs">Riders</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex flex-col items-center gap-2 h-auto py-4"
                    onClick={() => navigate('/messages')}
                  >
                    <MessageSquare className="h-5 w-5" />
                    <span className="text-xs">Messages</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Bookings */}
            {upcomingBookings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upcoming Bookings</CardTitle>
                  <CardDescription>{upcomingBookings.length} event(s) scheduled</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingBookings.slice(0, 3).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <div>
                          <p className="font-semibold text-sm">{booking.venueName}</p>
                          <p className="text-xs text-slate-600">
                            {new Date(booking.eventDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/bookings/${booking.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent Messages */}
            {messages && messages.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Messages</CardTitle>
                  <CardDescription>{messages.length} unread message(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {messages.slice(0, 3).map((msg) => (
                      <div
                        key={msg.id}
                        className="flex items-start justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 cursor-pointer"
                        onClick={() => navigate('/messages')}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{msg.senderName}</p>
                          <p className="text-xs text-slate-600 truncate">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => navigate('/messages')}
                  >
                    View All Messages
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {upcomingBookings.length === 0 && (!messages || messages.length === 0) && (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p className="text-slate-600 mb-4">No upcoming bookings yet</p>
                  <Button onClick={() => navigate('/browse')}>
                    Browse Venues
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ArtistDashboardV3;
