import { getDb } from "../db";
import { users, artistProfiles } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  order: number;
}

export interface OnboardingProgress {
  userId: number;
  completedSteps: string[];
  currentStep: string;
  progressPercentage: number;
  completedAt?: Date;
}

const ONBOARDING_STEPS = [
  {
    id: "profile-setup",
    title: "Complete Your Profile",
    description: "Add your name, bio, and profile photo",
    icon: "👤",
    order: 1,
  },
  {
    id: "genres",
    title: "Add Your Genres",
    description: "Select the music genres you perform",
    icon: "🎵",
    order: 2,
  },
  {
    id: "pricing",
    title: "Set Your Pricing",
    description: "Define your booking rates and packages",
    icon: "💰",
    order: 3,
  },
  {
    id: "availability",
    title: "Add Availability",
    description: "Set your available dates and times",
    icon: "📅",
    order: 4,
  },
  {
    id: "photos",
    title: "Upload Photos",
    description: "Add photos from past performances",
    icon: "📸",
    order: 5,
  },
  {
    id: "verification",
    title: "Get Verified",
    description: "Complete identity verification",
    icon: "✅",
    order: 6,
  },
];

/**
 * Get onboarding progress for an artist
 */
export async function getOnboardingProgress(
  userId: number
): Promise<OnboardingProgress> {
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  // Get user data
  const userData = await database
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (userData.length === 0) {
    throw new Error("User not found");
  }

  const user = userData[0];

  // Get artist profile data
  const artistData = await database
    .select()
    .from(artistProfiles)
    .where(eq(artistProfiles.userId, userId));

  const artist = artistData[0];

  // Determine completed steps based on profile data
  const completedSteps: string[] = [];

  // Profile setup - check if name and photo exist
  if (user.name && artist?.profilePhotoUrl) {
    completedSteps.push("profile-setup");
  }

  // Genres - check if artist has genres
  if (artist?.genre && artist.genre.length > 0) {
    completedSteps.push("genres");
  }

  // Pricing - check if artist has pricing
  if (artist?.feeRangeMin && artist?.feeRangeMax) {
    completedSteps.push("pricing");
  }

  // Availability - check if artist has availability
  if (artist?.websiteUrl) {
    completedSteps.push("availability");
  }

  // Photos - check if artist has media gallery
  if (artist?.mediaGallery && artist.mediaGallery.photos && artist.mediaGallery.photos.length > 0) {
    completedSteps.push("photos");
  }

  // Verification - check if artist has bio (proxy for verification)
  if (artist?.bio) {
    completedSteps.push("verification");
  }

  const progressPercentage = Math.round(
    (completedSteps.length / ONBOARDING_STEPS.length) * 100
  );

  return {
    userId,
    completedSteps,
    currentStep: ONBOARDING_STEPS.find(
      (step) => !completedSteps.includes(step.id)
    )?.id || "completed",
    progressPercentage,
  };
}

/**
 * Get all onboarding steps with completion status
 */
export async function getOnboardingSteps(
  userId: number
): Promise<OnboardingStep[]> {
  const progress = await getOnboardingProgress(userId);

  return ONBOARDING_STEPS.map((step) => ({
    ...step,
    completed: progress.completedSteps.includes(step.id),
  }));
}

/**
 * Mark a step as completed
 */
export async function completeOnboardingStep(
  userId: number,
  stepId: string
): Promise<OnboardingProgress> {
  // In a real app, you'd update the database
  // For now, we just return the updated progress
  return getOnboardingProgress(userId);
}

/**
 * Get onboarding completion reward
 */
export async function getOnboardingReward(userId: number): Promise<{
  completed: boolean;
  reward: string;
  creditsAwarded: number;
}> {
  const progress = await getOnboardingProgress(userId);

  if (progress.progressPercentage === 100) {
    return {
      completed: true,
      reward: "🎉 Onboarding Complete! You've unlocked premium features.",
      creditsAwarded: 100,
    };
  }

  return {
    completed: false,
    reward: `Complete ${ONBOARDING_STEPS.length - progress.completedSteps.length} more steps to unlock rewards`,
    creditsAwarded: 0,
  };
}
