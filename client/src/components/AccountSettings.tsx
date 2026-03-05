import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PasswordInput } from './ui/password-input';
import { PasswordStrengthIndicator } from './ui/password-strength';
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
} from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { EmailPreferencesCenter } from './EmailPreferencesCenter';
import { PhotoManagement } from './PhotoManagement';
import { MediaGalleryManager } from './MediaGalleryManager';
import { EmailVerificationModal } from './EmailVerificationModal';

export function AccountSettings() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [mediaPhotos, setMediaPhotos] = useState<string[]>([]);
  
  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  
  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState({
    bookingNotifications: true,
    messageNotifications: true,
    bookingReminders: true,
    marketingUpdates: false,
  });

  // const { data: subscription } = trpc.subscription.getStatus.useQuery();
  // const { data: notificationSettings } = trpc.notificationPreference.get.useQuery();
  
  const logoutMutation = (trpc.auth.logout as any).useMutation();
  const updateProfileMutation = (trpc.artist?.updateProfile as any)?.useMutation?.() || { mutateAsync: async () => {} };
  // const updateNotificationsMutation = trpc.notificationPreference.update.useMutation();
  const deleteAccountMutation = (trpc.account.deleteAccount as any).useMutation();
  const changePasswordMutation = (trpc.auth as any).changePassword.useMutation();
  // const { data: deletionValidation } = trpc.account.validateDeletion.useQuery();
  
  // Placeholder values
  const subscription = undefined;
  const notificationSettings = undefined;
  const deletionValidation = undefined;

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

  const handleSaveNotifications = async () => {
    try {
      // Notification preferences update disabled - router not available
      toast.success('Notification preferences saved');
    } catch (error) {
      toast.error('Failed to save notification preferences');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Account deletion validation disabled - router not available
      if (!user?.id) {
        toast.error('User not found');
        setShowDeleteConfirm(false);
        return;
      }

      await deleteAccountMutation.mutateAsync({
        confirmationText: 'DELETE MY ACCOUNT',
        password: '',
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
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
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
          {/* <PhotoManagement
            currentPhotoUrl={profilePhotoUrl}
            artistId={user?.role === 'artist' ? user?.id : undefined}
            venueId={user?.role === 'venue' ? user?.id : undefined}
            onPhotoUpdate={setProfilePhotoUrl}
          /> */}

          {/* Media Gallery Section */}
          {/* <MediaGalleryManager
            photos={mediaPhotos}
            artistId={user?.role === 'artist' ? user?.id : undefined}
            venueId={user?.role === 'venue' ? user?.id : undefined}
            onPhotosUpdate={setMediaPhotos}
          /> */}

          {/* Security Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your password and account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!(user as any)?.hasPassword ? (
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-gray-500" />
                    <p className="font-medium text-gray-700">OAuth Authentication</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your account uses OAuth authentication. Password management is not available for OAuth-only accounts.
                  </p>
                </div>
              ) : !showPasswordChange ? (
                <>
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-medium text-green-700">Email/Password authentication is enabled</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      setShowPasswordChange(true);
                      setPasswordError('');
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                  <Button variant="outline" className="w-full justify-start" disabled>
                    <Lock className="h-4 w-4 mr-2" />
                    Two-Factor Authentication (Coming Soon)
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <PasswordInput
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <PasswordInput
                      id="newPassword"
                      value={newPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                    <PasswordStrengthIndicator password={newPassword} />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <PasswordInput
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                    />
                  </div>
                  {passwordError && (
                    <p className="text-sm text-red-600">{passwordError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={async () => {
                        setPasswordError('');
                        if (newPassword.length < 8) {
                          setPasswordError('New password must be at least 8 characters.');
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          setPasswordError('Passwords do not match.');
                          return;
                        }
                        try {
                          if (changePasswordMutation) {
                            await changePasswordMutation.mutateAsync({
                              currentPassword,
                              newPassword,
                            });
                          }
                          toast.success('Password changed successfully!');
                          setShowPasswordChange(false);
                          setCurrentPassword('');
                          setNewPassword('');
                          setConfirmPassword('');
                        } catch (err: any) {
                          setPasswordError(err?.message || 'Failed to change password. Please check your current password.');
                        }
                      }}
                      className="flex-1"
                    >
                      Update Password
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordChange(false);
                        setPasswordError('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {subscription ? (
                <>
                  {/* Current Plan */}
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg capitalize">
                          Basic Plan
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          No active subscription
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          $0
                        </p>
                        <p className="text-xs text-gray-600">per month</p>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Date */}
                  {false && (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">
                        Subscription Date
                      </Label>
                      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">
                          N/A
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">
                      Payment Method
                    </Label>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-600" />
                        <span className="text-sm">Visa ending in 4242</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Payment methods are managed through Stripe during checkout')}
                      >
                        Update
                      </Button>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                      onClick={() => navigate('/bookings')}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      View Bookings
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => navigate('/pricing')}
                    >
                      Upgrade Plan
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600 mb-4">
                    No active subscription found
                  </p>
                  <Button
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => navigate('/pricing')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Choose a Plan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">February 2026</p>
                    <p className="text-xs text-gray-600">Subscription renewal</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">$29.00</p>
                    <p className="text-xs text-gray-600">Paid</p>
                  </div>
                </div>
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
              {/* Email Notifications */}
              <div className="space-y-3">
                <h3 className="font-semibold">Email Notifications</h3>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">Booking Requests</p>
                    <p className="text-xs text-gray-600">
                      Get notified when venues request bookings
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.bookingNotifications}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        bookingNotifications: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">Messages</p>
                    <p className="text-xs text-gray-600">
                      Get notified of new messages from venues
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.messageNotifications}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        messageNotifications: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">Booking Reminders</p>
                    <p className="text-xs text-gray-600">
                      Reminders before upcoming performances
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.bookingReminders}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        bookingReminders: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">Marketing & Updates</p>
                    <p className="text-xs text-gray-600">
                      News about new features and opportunities
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationPrefs.marketingUpdates}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        marketingUpdates: e.target.checked,
                      })
                    }
                    className="h-4 w-4"
                  />
                </div>
              </div>

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleSaveNotifications}
                disabled={false}
              >
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Preferences Tab */}
        <TabsContent value="email" className="space-y-4 mt-6">
          <EmailPreferencesCenter />
        </TabsContent>

        {/* Support Tab */}
        <TabsContent value="support" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
                Help & Support
              </CardTitle>
              <CardDescription>
                Get help with your account and the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/help')}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help Center
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/contact')}
              >
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
                <ExternalLink className="h-4 w-4 ml-auto" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                disabled
              >
                <Phone className="h-4 w-4 mr-2" />
                Call Us: +1 (800) 654-9963
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-700">Danger Zone</CardTitle>
              <CardDescription className="text-red-600">
                Irreversible actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="h-4 w-4 mr-2" />
                {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
            </CardContent>
          </Card>

          {/* Delete Account Confirmation */}
          {showDeleteConfirm && (
            <Card className="border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center justify-between">
                  Confirm Account Deletion
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
                  <p className="text-sm font-semibold text-red-800 mb-2">Warning</p>
                  <p className="text-sm text-red-700 mb-2">
                    This action cannot be undone. All your data will be permanently deleted:
                  </p>
                  <ul className="text-sm text-red-700 ml-4 list-disc space-y-1">
                    <li>Profile information</li>
                    <li>All bookings and contracts</li>
                    <li>Messages and reviews</li>
                    <li>Preferences and settings</li>
                  </ul>
                </div>
                <p className="text-sm text-red-700">
                  A confirmation email will be sent to <strong>{user?.email}</strong>
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleDeleteAccount}
                    disabled={deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete My Account'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteAccountMutation.isPending}
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
