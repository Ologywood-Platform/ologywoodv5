import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import OnboardingWizard from "@/components/OnboardingWizard";
import { toast } from "sonner";

export default function Onboarding() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Check if user already has a profile
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    // If user already has a profile, redirect to dashboard
    const checkProfile = async () => {
      try {
        if (user.role === "artist") {
          // Check if artist profile exists
          const profile = await trpc.artist.getMyProfile.query();
          if (profile) {
            navigate("/dashboard");
          }
        } else if (user.role === "venue") {
          // Check if venue profile exists
          const profile = await trpc.venue.getMyProfile.query();
          if (profile) {
            navigate("/dashboard");
          }
        }
      } catch (error) {
        // Profile doesn't exist, continue with onboarding
      }
    };

    checkProfile();
  }, [user, navigate]);

  const createArtistProfile = trpc.artist.createProfile.useMutation({
    onSuccess: () => {
      toast.success("Artist profile created successfully!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create artist profile");
      setIsLoading(false);
    },
  });

  const createVenueProfile = trpc.venue.createProfile.useMutation({
    onSuccess: () => {
      toast.success("Venue profile created successfully!");
      navigate("/dashboard");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create venue profile");
      setIsLoading(false);
    },
  });

  const handleComplete = async (data: any) => {
    setIsLoading(true);

    try {
      if (data.role === "artist") {
        createArtistProfile.mutate({
          artistName: data.name,
          location: data.location,
          bio: data.bio,
          genre: data.genre ? [data.genre] : [],
          feeRangeMin: data.feeMin ? parseInt(data.feeMin) : undefined,
          feeRangeMax: data.feeMax ? parseInt(data.feeMax) : undefined,
          touringPartySize: 1,
        });
      } else if (data.role === "venue") {
        createVenueProfile.mutate({
          venueName: data.name,
          location: data.location,
          description: data.bio,
          capacity: 100, // Default capacity
        });
      }
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Failed to create profile");
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <OnboardingWizard 
      onComplete={handleComplete}
      isLoading={isLoading}
    />
  );
}
