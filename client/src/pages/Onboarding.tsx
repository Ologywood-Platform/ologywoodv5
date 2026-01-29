import { useEffect, useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import OnboardingWizard from '@/components/OnboardingWizard';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

export default function Onboarding() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: artistProfile, refetch: refetchArtistProfile } = trpc.artist.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'artist',
  });
  const { data: venueProfile, refetch: refetchVenueProfile } = trpc.venue.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'venue',
  });

  // Mutations for creating profiles
  const createArtistProfileMutation = trpc.artist.createProfile.useMutation({
    onSuccess: () => {
      toast.success('Artist profile created successfully!');
      refetchArtistProfile();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create artist profile');
      setIsSubmitting(false);
    },
  });

  const createVenueProfileMutation = trpc.venue.createProfile.useMutation({
    onSuccess: () => {
      toast.success('Venue profile created successfully!');
      refetchVenueProfile();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create venue profile');
      setIsSubmitting(false);
    },
  });

  useEffect(() => {
    // If not authenticated, redirect to home
    if (!loading && !isAuthenticated) {
      navigate('/');
      return;
    }
    
    // If user already has a profile, redirect to dashboard
    if (!loading && isAuthenticated) {
      if (user?.role === 'artist' && artistProfile) {
        navigate('/dashboard');
        return;
      } else if (user?.role === 'venue' && venueProfile) {
        navigate('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, loading, user, artistProfile, venueProfile, navigate]);

  const handleOnboardingComplete = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      if (user?.role === 'artist') {
        await createArtistProfileMutation.mutateAsync({
          artistName: data.name,
          location: data.location,
          bio: data.bio,
          genre: data.genre ? [data.genre] : [],
          feeRangeMin: parseInt(data.feeMin) || 0,
          feeRangeMax: parseInt(data.feeMax) || 0,
          touringPartySize: 1,
          profilePhotoUrl: data.photoUrl || '',
        });
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (user?.role === 'venue') {
        await createVenueProfileMutation.mutateAsync({
          venueName: data.name,
          location: data.location,
          description: data.bio,
          profilePhotoUrl: data.photoUrl || '',
        });
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      toast.success('Profile setup complete!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show wizard if user has a role but no profile yet
  const hasRole = user?.role === 'artist' || user?.role === 'venue';
  const hasProfile = (user?.role === 'artist' && artistProfile) || (user?.role === 'venue' && venueProfile);
  
  if (hasRole && !hasProfile) {
    return (
      <OnboardingWizard
        onComplete={handleOnboardingComplete}
        isLoading={isSubmitting}
      />
    );
  }

  return null;
}
