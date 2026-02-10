import { useState, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { getLoginUrl } from '@/const';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Image, Bell, Lock, Zap } from 'lucide-react';
import { ArtistProfileEditor } from '@/components/ArtistProfileEditor';
import { VenueProfileEditor } from '@/components/VenueProfileEditor';
import { PhotoGalleryManager } from '@/components/PhotoGalleryManager';
import { NotificationPreferences } from '@/components/NotificationPreferences';
import { PrivacySecurityModal } from '@/components/PrivacySecurityModal';
import { Link } from 'wouter';

export default function Settings() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [privacyModalType, setPrivacyModalType] = useState<'visibility' | 'download' | 'delete'>('visibility');

  const openPrivacyModal = (type: 'visibility' | 'download' | 'delete') => {
    setPrivacyModalType(type);
    setPrivacyModalOpen(true);
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = getLoginUrl();
    }
  }, [isAuthenticated, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const isArtist = user.role === 'artist';
  const isVenue = user.role === 'venue';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="w-full px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Link href="/dashboard" className="flex-shrink-0">
              <Button variant="ghost" size="sm" className="h-8 sm:h-10 px-2 sm:px-3">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden xs:inline ml-1 text-xs sm:text-sm">Back</span>
              </Button>
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold flex-1 text-center truncate">Settings</h1>
            <div className="w-12 sm:w-24 flex-shrink-0" />
          </div>
        </div>
      </header>

      <div className="w-full px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Mobile Tabs - Scrollable */}
            <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 mb-6 sm:mb-8">
              <TabsList className="inline-flex w-full sm:w-auto sm:grid sm:grid-cols-5 gap-1 sm:gap-2 bg-muted p-1">
                <TabsTrigger 
                  value="profile" 
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="media" 
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  <Image className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Media</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications" 
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  <Bell className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Alerts</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="privacy" 
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Privacy</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="billing" 
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm whitespace-nowrap"
                >
                  <Zap className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Billing</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-3 sm:space-y-4">
              <Card className="border">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-lg sm:text-xl">Profile Information</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    {isArtist 
                      ? 'Update your artist profile details' 
                      : 'Update your venue profile details'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  {isArtist ? (
                    <ArtistProfileEditor />
                  ) : (
                    <VenueProfileEditor />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media" className="space-y-3 sm:space-y-4">
              <Card className="border">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-lg sm:text-xl">Media Gallery</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Manage your photos and media files
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <PhotoGalleryManager role={isArtist ? 'artist' : 'venue'} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-3 sm:space-y-4">
              <Card className="border">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-lg sm:text-xl">Notification Preferences</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Control how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <NotificationPreferences />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-3 sm:space-y-4">
              <Card className="border">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-lg sm:text-xl">Privacy & Security</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Manage your privacy settings and security options
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 sm:space-y-3">
                    {/* Profile Visibility */}
                    <div className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base break-words">Profile Visibility</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Control who can see your profile</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm"
                          onClick={() => openPrivacyModal('visibility')}
                        >
                          Configure
                        </Button>
                      </div>
                    </div>

                    {/* Data Download */}
                    <div className="p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base break-words">Data Download</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Download your personal data</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm"
                          onClick={() => openPrivacyModal('download')}
                        >
                          Download
                        </Button>
                      </div>
                    </div>

                    {/* Account Deletion */}
                    <div className="p-3 sm:p-4 border rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base break-words">Account Deletion</p>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Permanently delete your account</p>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm"
                          onClick={() => openPrivacyModal('delete')}
                        >
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-3 sm:space-y-4">
              <Card className="border">
                <CardHeader className="pb-3 sm:pb-4">
                  <CardTitle className="text-lg sm:text-xl">Billing & Subscription</CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1">
                    Manage your subscription and billing information
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 border rounded-lg bg-muted">
                      <p className="font-medium text-sm sm:text-base mb-2">Current Plan</p>
                      <p className="text-xl sm:text-2xl font-bold text-primary">Free Plan</p>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-2">Upgrade to unlock premium features</p>
                    </div>
                    <Link href="/upgrade" className="block">
                      <Button className="w-full text-xs sm:text-sm h-9 sm:h-10">
                        View Upgrade Options
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Privacy & Security Modal */}
      <PrivacySecurityModal 
        open={privacyModalOpen}
        onOpenChange={setPrivacyModalOpen}
        type={privacyModalType}
      />
    </div>
  );
}
