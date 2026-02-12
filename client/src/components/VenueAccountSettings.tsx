import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  AlertCircle,
  Bell,
  CreditCard,
  Lock,
  LogOut,
  Mail,
  Phone,
  Settings,
  Shield,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  Clock,
  X,
  MapPin,
  Globe,
  Users,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { EmailPreferencesCenter } from './EmailPreferencesCenter';
import { PhotoManagement } from './PhotoManagement';
import { EmailVerificationModal } from './EmailVerificationModal';

export function VenueAccountSettings() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  
  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [editingCapacity, setEditingCapacity] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  
  const [newName, setNewName] = useState(user?.name || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [newLocation, setNewLocation] = useState('');
  const [newBio, setNewBio] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    bookingNotifications: true,
    messageNotifications: true,
    bookingReminders: true,
    marketingUpdates: false,
  });

  const { data: venueProfile } = trpc.venue.getMyProfile.useQuery();
  const { data: subscription } = trpc.subscription.getStatus.useQuery();
  const { data: notificationSettings } = trpc.notificationPreference.get.useQuery();
  
  const logoutMutation = trpc.auth.logout.useMutation();
  const updateProfileMutation = trpc.user.updateProfile.useMutation();
  const updateVenueProfileMutation = trpc.venue.updateProfile.useMutation();
  const updateNotificationsMutation = trpc.notificationPreference.update.useMutation();
  const deleteAccountMutation = trpc.account.deleteAccount.useMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      logout();
      navigate('/');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    try {
      await updateProfileMutation.mutateAsync({ name: newName });
      setEditingName(false);
      toast.success('Name updated successfully');
    } catch (error) {
      toast.error('Failed to update name');
    }
  };

  const handleSaveEmail = async () => {
    if (!newEmail.trim()) {
      toast.error('Email cannot be empty');
      return;
    }
    // Use email verification modal instead of direct update
    setShowEmailVerification(true);
  };

  const handleEmailVerificationSuccess = (newEmail: string) => {
    setEditingEmail(false);
    toast.success('Email updated and verified successfully');
  };

  const handleChangeEmail = () => {
    setShowEmailVerification(true);
  };

  const handleSaveVenueProfile = async () => {
    try {
      await updateVenueProfileMutation.mutateAsync({
        location: newLocation || undefined,
        bio: newBio || undefined,
        capacity: newCapacity ? parseInt(newCapacity) : undefined,
        phone: newPhone || undefined,
        website: newWebsite || undefined,
      });
      setEditingLocation(false);
      setEditingBio(false);
      setEditingCapacity(false);
      setEditingPhone(false);
      setEditingWebsite(false);
      toast.success('Venue profile updated successfully');
    } catch (error) {
      toast.error('Failed to update venue profile');
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await updateNotificationsMutation.mutateAsync(notificationPrefs);
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save notification preferences');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccountMutation.mutateAsync({
        confirmationText: 'DELETE MY ACCOUNT',
      });

      toast.success('Your account has been deleted successfully');
      setTimeout(() => {
        logout();
        navigate('/');
      }, 2000);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete account');
    }
  };

  return (
    <>
      <EmailVerificationModal
        isOpen={showEmailVerification}
        currentEmail={user?.email || ''}
        onClose={() => setShowEmailVerification(false)}
        onSuccess={handleEmailVerificationSuccess}
      />
      <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="venue">Venue</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Email Address</Label>
                <div className="flex items-center gap-3">
                  {editingEmail ? (
                    <>
                      <Input
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        type="email"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveEmail}
                        disabled={updateProfileMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingEmail(false);
                          setNewEmail(user?.email || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm">{user?.email}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEmailVerification(true)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Change
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Full Name</Label>
                <div className="flex items-center gap-3">
                  {editingName ? (
                    <>
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveName}
                        disabled={updateProfileMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingName(false);
                          setNewName(user?.name || '');
                        }}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Input
                        value={user?.name || ''}
                        readOnly
                        className="flex-1 bg-gray-50"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingName(true)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Account Created */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Account Created</Label>
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Account Status */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">Account Status</Label>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Active</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photo Management Section */}
          <PhotoManagement
            currentPhotoUrl={profilePhotoUrl}
            venueId={user?.id}
            onPhotoUpdate={setProfilePhotoUrl}
          />
        </TabsContent>

        {/* Venue Tab */}
        <TabsContent value="venue" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Venue Information
              </CardTitle>
              <CardDescription>
                Manage your venue details and public information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Location */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <div className="flex items-center gap-3">
                  {editingLocation ? (
                    <>
                      <Input
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder="City, State"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveVenueProfile}
                        disabled={updateVenueProfileMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingLocation(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm">{venueProfile?.location || 'Not set'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewLocation(venueProfile?.location || '');
                          setEditingLocation(true);
                        }}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Capacity
                </Label>
                <div className="flex items-center gap-3">
                  {editingCapacity ? (
                    <>
                      <Input
                        value={newCapacity}
                        onChange={(e) => setNewCapacity(e.target.value)}
                        type="number"
                        placeholder="Number of guests"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveVenueProfile}
                        disabled={updateVenueProfileMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingCapacity(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm">{venueProfile?.capacity || 'Not set'} guests</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewCapacity(venueProfile?.capacity?.toString() || '');
                          setEditingCapacity(true);
                        }}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <div className="flex items-center gap-3">
                  {editingPhone ? (
                    <>
                      <Input
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveVenueProfile}
                        disabled={updateVenueProfileMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingPhone(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm">{venueProfile?.phone || 'Not set'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewPhone(venueProfile?.phone || '');
                          setEditingPhone(true);
                        }}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Website
                </Label>
                <div className="flex items-center gap-3">
                  {editingWebsite ? (
                    <>
                      <Input
                        value={newWebsite}
                        onChange={(e) => setNewWebsite(e.target.value)}
                        type="url"
                        placeholder="https://example.com"
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveVenueProfile}
                        disabled={updateVenueProfileMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingWebsite(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm">{venueProfile?.website || 'Not set'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewWebsite(venueProfile?.website || '');
                          setEditingWebsite(true);
                        }}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Description
                </Label>
                <div className="flex items-start gap-3">
                  {editingBio ? (
                    <>
                      <textarea
                        value={newBio}
                        onChange={(e) => setNewBio(e.target.value)}
                        placeholder="Tell artists about your venue..."
                        className="flex-1 p-3 border rounded-lg min-h-24"
                      />
                      <div className="flex gap-2 flex-col">
                        <Button
                          size="sm"
                          onClick={handleSaveVenueProfile}
                          disabled={updateVenueProfileMutation.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingBio(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1 p-3 bg-gray-50 rounded-lg border min-h-24">
                        <p className="text-sm">{venueProfile?.bio || 'No description yet'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewBio(venueProfile?.bio || '');
                          setEditingBio(true);
                        }}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900">
                  Current Plan: <span className="font-bold">{subscription?.tier || 'Free'}</span>
                </p>
                <p className="text-xs text-blue-800 mt-1">
                  {subscription?.status === 'active' ? 'Your subscription is active' : 'No active subscription'}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Payment Method</Label>
                  <p className="text-sm text-gray-600 mt-1">Visa ending in 4242</p>
                </div>

                <Button variant="outline" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>

                <Button variant="outline" className="w-full">
                  View Invoices
                </Button>

                <Button variant="outline" className="w-full">
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.bookingNotifications}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        bookingNotifications: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">Booking Notifications</p>
                    <p className="text-xs text-gray-600">Get notified when artists send booking requests</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.messageNotifications}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        messageNotifications: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">Message Notifications</p>
                    <p className="text-xs text-gray-600">Get notified when you receive new messages</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.bookingReminders}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        bookingReminders: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">Booking Reminders</p>
                    <p className="text-xs text-gray-600">Get reminded about upcoming events</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.marketingUpdates}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        marketingUpdates: e.target.checked,
                      })
                    }
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-medium text-sm">Marketing Updates</p>
                    <p className="text-xs text-gray-600">Receive news about new features and promotions</p>
                  </div>
                </label>
              </div>

              <Button onClick={handleSaveNotifications} className="w-full">
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-4 mt-6">
          <EmailPreferencesCenter />
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Support & Help
              </CardTitle>
              <CardDescription>
                Get help and manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.open('/help', '_blank')}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Help Center
              </Button>

              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/support')}>
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </Button>

              <div className="border-t pt-4 mt-4">
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Danger Zone
                </h3>

                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-900">Delete Account</CardTitle>
                <CardDescription className="text-red-800">
                  This action cannot be undone. All your data will be permanently deleted.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-red-100 rounded-lg border border-red-300">
                  <p className="text-sm text-red-900 font-medium">
                    Type "DELETE MY ACCOUNT" to confirm deletion:
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}

export default VenueAccountSettings;
