import { useState } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft, Mail, Bell, Shield, CheckCircle, AlertCircle, Camera, Trash2, User, DollarSign, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailPreferencesCenter } from "@/components/EmailPreferencesCenter";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { trpc } from "@/lib/trpc";

function NotificationPreferencesSection() {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const { data: prefs, isLoading } = trpc.notifications.getPreferences.useQuery();
  const updateMutation = trpc.notifications.updatePreferences.useMutation({
    onSuccess: () => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  const [localPrefs, setLocalPrefs] = useState({
    bookingNotifications: true,
    messageNotifications: true,
    reviewNotifications: true,
    riderNotifications: true,
    emailNotifications: true,
    pushNotifications: true,
    reminderNotifications: true,
  });

  // Sync from server
  const [synced, setSynced] = useState(false);
  if (prefs && !synced) {
    setLocalPrefs({
      bookingNotifications: prefs.bookingNotifications ?? true,
      messageNotifications: prefs.messageNotifications ?? true,
      reviewNotifications: prefs.reviewNotifications ?? true,
      riderNotifications: prefs.riderNotifications ?? true,
      emailNotifications: prefs.emailNotifications ?? true,
      pushNotifications: prefs.pushNotifications ?? true,
      reminderNotifications: prefs.reminderNotifications ?? true,
    });
    setSynced(true);
  }

  const handleToggle = (key: keyof typeof localPrefs) => {
    setLocalPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaveStatus('saving');
    updateMutation.mutate(localPrefs);
  };

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading preferences...</p>;
  }

  const categories = [
    { key: 'bookingNotifications' as const, label: 'Booking Notifications', desc: 'New requests, confirmations, cancellations' },
    { key: 'messageNotifications' as const, label: 'Message Notifications', desc: 'New messages from artists or venues' },
    { key: 'reviewNotifications' as const, label: 'Review Notifications', desc: 'New reviews on your profile' },
    { key: 'riderNotifications' as const, label: 'Contract & Rider Notifications', desc: 'Contract updates, signatures, and rider changes' },
    { key: 'reminderNotifications' as const, label: 'Reminders', desc: 'Upcoming event and deadline reminders' },
    { key: 'emailNotifications' as const, label: 'Email Copies', desc: 'Also send notifications to your email' },
  ];

  return (
    <div className="space-y-4">
      {saveStatus === 'success' && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <p className="text-sm text-green-700">Notification preferences saved!</p>
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm text-red-700">Failed to save. Please try again.</p>
        </div>
      )}

      <div className="space-y-3">
        {categories.map(({ key, label, desc }) => (
          <label key={key} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={localPrefs[key]}
              onChange={() => handleToggle(key)}
              className="w-4 h-4 rounded"
            />
            <div className="flex-1">
              <p className="font-medium text-slate-900 text-sm">{label}</p>
              <p className="text-xs text-slate-600">{desc}</p>
            </div>
          </label>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={saveStatus === 'saving'}
        className="w-full"
      >
        {saveStatus === 'saving' ? 'Saving...' : 'Save Notification Preferences'}
      </Button>
    </div>
  );
}

function ProfilePictureSection({ user }: { user: any }) {
  const [uploading, setUploading] = useState(false);
  const [removeConfirm, setRemoveConfirm] = useState(false);
  const { refresh } = useAuth();
  const uploadMutation = (trpc.auth as any).uploadCustomAvatar.useMutation({
    onSuccess: () => {
      refresh();
      setUploading(false);
    },
    onError: () => {
      setUploading(false);
    },
  });
  const removeMutation = (trpc.auth as any).removeCustomAvatar.useMutation({
    onSuccess: () => {
      refresh();
      setRemoveConfirm(false);
    },
  });

  const currentAvatar = user?.customAvatarUrl || user?.avatarUrl;
  const hasCustomAvatar = !!user?.customAvatarUrl;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPEG, PNG, or WebP image.');
      return;
    }
    // Validate size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      uploadMutation.mutate({
        fileData: base64,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Camera className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a custom profile picture or use your Google/Spotify avatar
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Current avatar preview */}
          <div className="relative">
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-purple-100 flex items-center justify-center border-2 border-gray-200">
                <User className="h-10 w-10 text-purple-600" />
              </div>
            )}
            {hasCustomAvatar && (
              <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                Custom
              </span>
            )}
          </div>

          {/* Upload / Remove buttons */}
          <div className="space-y-2">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileSelect}
                disabled={uploading}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  {uploading ? 'Uploading...' : 'Upload New Photo'}
                </span>
              </Button>
            </label>
            <p className="text-xs text-slate-500">JPEG, PNG, or WebP. Max 2MB.</p>

            {hasCustomAvatar && (
              removeConfirm ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => removeMutation.mutate()}
                    disabled={removeMutation.isPending}
                  >
                    {removeMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    Confirm Remove
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                    onClick={() => setRemoveConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs text-red-600 hover:text-red-700 p-0 h-auto"
                  onClick={() => setRemoveConfirm(true)}
                >
                  <Trash2 className="h-3 w-3" />
                  Remove custom photo
                </Button>
              )
            )}

            {!hasCustomAvatar && user?.avatarUrl && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Using your {user?.oauthProvider === 'google' ? 'Google' : user?.oauthProvider === 'spotify' ? 'Spotify' : 'social'} profile picture
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // If not logged in, prompt to log in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
        <div className="container mx-auto px-4 py-12 max-w-lg">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to manage your email preferences and account settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => navigate("/")}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Go to Home & Sign In
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/unsubscribe")}
                className="w-full"
              >
                <Mail className="h-4 w-4 mr-2" />
                Unsubscribe from Emails Instead
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/dashboard")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500">
              Manage your email and notification preferences
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <PageBreadcrumb
          className="mb-6"
          segments={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Settings" },
          ]}
        />

        {/* Profile Picture */}
        <div className="space-y-6">
          <ProfilePictureSection user={user} />

          {/* Email Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Email Preferences</CardTitle>
                  <CardDescription>
                    Control which emails you receive from Ologywood
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EmailPreferencesCenter />
            </CardContent>
          </Card>

          {/* In-App Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle>In-App Notifications</CardTitle>
                  <CardDescription>
                    Control which in-app notifications you receive
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <NotificationPreferencesSection />
            </CardContent>
          </Card>

          {/* Payments & Banking */}
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-cyan-50/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle>Payments & Banking</CardTitle>
                  <CardDescription>
                    Connect your bank account to receive earnings from bookings, ticket sales, and tips
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Set up Stripe Connect to receive payments directly to your bank account. Once connected, earnings from bookings, ticket sales, and fan tips will be deposited automatically.
                </p>
                <Button
                  onClick={() => navigate("/earnings")}
                  className="bg-purple-600 hover:bg-purple-700 gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Set Up Payments / Connect to Stripe
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">More Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3"
                  onClick={() => navigate("/dashboard")}
                >
                  <Bell className="h-4 w-4 text-purple-600" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Account Settings</p>
                    <p className="text-xs text-slate-500">Profile, password</p>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start gap-3 h-auto py-3"
                  onClick={() => navigate("/unsubscribe")}
                >
                  <Mail className="h-4 w-4 text-red-500" />
                  <div className="text-left">
                    <p className="font-medium text-sm">Unsubscribe</p>
                    <p className="text-xs text-slate-500">Stop all email communications</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
