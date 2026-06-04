import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../_core/hooks/useAuth';
import { trpc } from '../lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, User, Phone, FileText, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import SiteHeader from '../components/SiteHeader';

export default function VenueOnboarding() {
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    organizationName: '',
    location: '',
    contactName: '',
    contactPhone: '',
    bio: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Check if venue already has a profile
  const { data: existingProfile, isLoading: profileLoading } = trpc.venue.getMyProfile.useQuery(
    undefined,
    { enabled: !!user && (user.role === 'venue' || user.role === 'admin') }
  );

  const createProfileMutation = trpc.venue.createProfile.useMutation({
    onSuccess: () => {
      setStep(3); // Go to success step
    },
    onError: (error: any) => {
      if (error.message?.includes('already exists')) {
        // Profile already exists, redirect to dashboard
        navigate('/venue-dashboard');
      } else {
        setErrors({ submit: error.message || 'Failed to create profile. Please try again.' });
      }
    },
  });

  // Redirect if already has profile
  if (!loading && !profileLoading && existingProfile) {
    navigate('/venue-dashboard');
    return null;
  }

  // Redirect if not a venue
  if (!loading && user && user.role !== 'venue' && user.role !== 'admin') {
    navigate('/');
    return null;
  }

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!form.organizationName.trim()) {
      newErrors.organizationName = 'Venue name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setErrors({});
    await createProfileMutation.mutateAsync({
      organizationName: form.organizationName.trim(),
      location: form.location.trim() || undefined,
      contactName: form.contactName.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      bio: form.bio.trim() || undefined,
    });
  };

  return (
    <>
      <SiteHeader />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 py-8 px-4">
        <div className="max-w-lg mx-auto">
          {/* Progress Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step ? 'bg-green-500 text-white' :
                  s === step ? 'bg-purple-600 text-white' :
                  'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {s < step ? <CheckCircle className="h-5 w-5" /> : s}
                </div>
                {s < 3 && <div className={`w-12 h-0.5 ${s < step ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Welcome to Ologywood!</CardTitle>
                    <CardDescription>Let's set up your venue profile</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Venue / Organization Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.organizationName}
                      onChange={(e) => { setForm({ ...form, organizationName: e.target.value }); setErrors({}); }}
                      placeholder="e.g., The Blue Note, Atlanta Convention Center"
                      className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${errors.organizationName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                  </div>
                  {errors.organizationName && <p className="text-red-500 text-sm mt-1">{errors.organizationName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      placeholder="City, State (e.g., Atlanta, GA)"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <Button onClick={handleNext} className="w-full bg-purple-600 hover:bg-purple-700 mt-2">
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Contact & Details */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                    <User className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Contact Details</CardTitle>
                    <CardDescription>How artists can reach you (optional)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Contact Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.contactName}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                      placeholder="Your name"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">This stays private — only shared with artists you're actively booking with.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={form.contactPhone}
                      onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                      placeholder="(555) 123-4567"
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5">About Your Venue</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Describe your venue — capacity, type of events, amenities, etc."
                      rows={4}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Describe your space, typical events, and what artists should know. This is public on your profile.</p>
                </div>

                {errors.submit && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <p className="text-red-600 dark:text-red-400 text-sm">{errors.submit}</p>
                  </div>
                )}

                <div className="flex gap-3 mt-2">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createProfileMutation.isPending}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {createProfileMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creating...</>
                    ) : (
                      <>Create Profile <ArrowRight className="h-4 w-4 ml-2" /></>
                    )}
                  </Button>
                </div>

                <button
                  onClick={handleSubmit}
                  className="w-full text-center text-sm text-gray-500 hover:text-purple-600 mt-1"
                >
                  Skip for now — I'll add details later
                </button>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <Card>
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">You're All Set!</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                  Your venue profile has been created. You can now browse artists, send booking requests, and manage everything from your dashboard.
                </p>
                <div className="space-y-3 pt-2">
                  <Button onClick={() => navigate('/venue-dashboard')} className="w-full bg-purple-600 hover:bg-purple-700">
                    Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                  <Button onClick={() => navigate('/browse')} variant="outline" className="w-full">
                    Browse Artists
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help text */}
          {step < 3 && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
              You can always update your profile later from your dashboard.
            </p>
          )}
        </div>
      </div>

    </>
  );
}
